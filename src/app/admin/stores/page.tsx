"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store, Plus, Search, Edit2, Trash2, X, Eye,
  MapPin, Ruler, Users as UsersIcon, TrendingUp,
  DollarSign, BarChart3, ShoppingCart, ArrowRight,
  ChevronRight, Home, Loader2, Phone, User,
  RefreshCw, ExternalLink, Package, CheckCircle2,
  Clock, Lightbulb, LayoutGrid, FileText, Palette, Download,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { FEMALE_STYLES, MALE_STYLES, STYLE_KEY_MAP, STYLE_PRO_MAP, FEMALE_STYLE_KEYS, MALE_STYLE_KEYS, FEMALE_STYLE_ALL_KEYS, MALE_STYLE_ALL_KEYS, getColorSeasonFullLabel, getStyleProLabel } from "@/lib/styles";

/* ==================== 类型 ==================== */
interface StoreType {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  wechat: string | null;
  city: string | null;
  district: string | null;
  shop_size: string | null;
  style_position: string | null;
  target_age: string | null;
  price_range: string | null;
  business_data: Record<string, any>;
  member_stats: Record<string, any>;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface VipCustomer {
  id: string;
  name: string;
  phone: string | null;
  gender: string | null;
  color_season: string | null;
  main_style: string | null;
  sub_style: string | null;
  vip_level: string;
  wechat: string | null;
  is_active: boolean;
  last_test_at: string | null;
  created_at: string;
}

interface DeliveryPlan {
  id: string;
  customer_name: string;
  service_type: string;
  title: string;
  description: string | null;
  status: string;
  price: number | null;
  created_at: string;
  updated_at: string;
}

/* 服务阶段 */
const SERVICE_STAGES = [
  { key: "diagnosis", label: "诊断", desc: "店铺信息录入", icon: Eye },
  { key: "test", label: "测试", desc: "会员色彩/风格测试", icon: Clock },
  { key: "analysis", label: "分析", desc: "聚合统计分析", icon: BarChart3 },
  { key: "planning", label: "企划", desc: "商品企划方案", icon: Lightbulb },
  { key: "delivery", label: "交付", desc: "方案交付确认", icon: Package },
  { key: "tracking", label: "跟踪", desc: "持续跟踪服务", icon: CheckCircle2 },
];

/* 交付方案服务类型映射 */
const serviceTypeMap: Record<string, { label: string; icon: typeof Package; color: string }> = {
  select: { label: "选品方案", icon: Package, color: "text-blue-600 bg-blue-50" },
  display: { label: "陈列方案", icon: LayoutGrid, color: "text-purple-600 bg-purple-50" },
  planning: { label: "企划方案", icon: Lightbulb, color: "text-amber-600 bg-amber-50" },
  full: { label: "全案服务", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
};

const deliveryStatusMap: Record<string, { label: string; color: string }> = {
  draft: { label: "草稿", color: "bg-gray-100 text-gray-600" },
  in_progress: { label: "进行中", color: "bg-amber-50 text-amber-600" },
  delivered: { label: "已交付", color: "bg-blue-50 text-blue-600" },
  confirmed: { label: "已确认", color: "bg-green-50 text-green-600" },
};

/* ==================== CSV 导出 ==================== */
function exportMembersToCSV(storeId: string, storeName: string, members: VipCustomer[]) {
  if (members.length === 0) return;
  const escapeCSV = (v: any) => `"${String(v ?? "").replace(/"/g, "\"\"")}"`;
  const headers = ["姓名", "电话", "性别", "微信号", "色彩季型", "主风格", "副风格", "VIP等级", "录入时间"];
  const rows = members.map((m) => [
    escapeCSV(m.name),
    escapeCSV(m.phone),
    escapeCSV(m.gender === "female" ? "女" : m.gender === "male" ? "男" : ""),
    escapeCSV(m.wechat),
    escapeCSV(getColorSeasonFullLabel(m.color_season)),
    escapeCSV(getStyleProLabel(m.main_style)),
    escapeCSV(getStyleProLabel(m.sub_style)),
    escapeCSV(m.vip_level),
    escapeCSV(m.created_at ? new Date(m.created_at).toLocaleDateString("zh-CN") : ""),
  ].join(","));

  const BOM = "\uFEFF";
  const csv = [headers.map(h => escapeCSV(h)).join(","), ...rows].join("\n");
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${storeName}_VIP会员_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ==================== 常量 ==================== */
const STYLE_OPTIONS = [
  ...FEMALE_STYLES.map(s => ({ ...s, group: "女士八大风格" as const })),
  ...MALE_STYLES.map(s => ({ ...s, group: "男士五大风格" as const })),
];

const SHOP_SIZE_OPTIONS = ["30㎡以下", "30-50㎡", "50-80㎡", "80-120㎡", "120㎡以上"];
const TARGET_AGE_OPTIONS = ["18-25岁", "25-35岁", "30-40岁", "35-50岁"];
const PRICE_RANGE_OPTIONS = ["99-199元", "199-399元", "399-699元", "699元+"];
const STATUS_OPTIONS = [
  { value: "active", label: "活跃", color: "bg-green-100 text-green-700" },
  { value: "inactive", label: "非活跃", color: "bg-gray-100 text-gray-600" },
  { value: "churned", label: "已流失", color: "bg-red-100 text-red-700" },
];

const STYLE_LABELS = STYLE_PRO_MAP;

const PIE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F0B27A", "#82E0AA",
];

/* ==================== 页面 ==================== */
export default function StoresAdminPage() {
  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  }, [filterStatus, filterCity, supabase]);

  useEffect(() => { fetchStores(); }, [fetchStores]);
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Eye,
  Package,
  LayoutGrid,
  Lightbulb,
  CheckCircle2,
  Clock,
  ChevronDown,
  Store,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeliveryPlan {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_wechat: string | null;
  vip_level: string;
  service_type: string;
  title: string;
  description: string | null;
  status: string;
  price: number | null;
  notes: string | null;
  store_id: string | null;
  created_at: string;
  updated_at: string;
}

interface StoreOption {
  id: string;
  name: string;
  city: string | null;
}

const serviceTypeMap: Record<string, { label: string; icon: typeof Package; color: string }> = {
  select: { label: "选品方案", icon: Package, color: "text-blue-600 bg-blue-50" },
  display: { label: "陈列方案", icon: LayoutGrid, color: "text-purple-600 bg-purple-50" },
  planning: { label: "企划方案", icon: Lightbulb, color: "text-amber-600 bg-amber-50" },
  full: { label: "全案服务", icon: CheckCircle2, color: "text-green-600 bg-green-50" },
};

const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "草稿", color: "text-gray-500 bg-gray-100", icon: Clock },
  in_progress: { label: "进行中", color: "text-amber-600 bg-amber-50", icon: Clock },
  delivered: { label: "已交付", color: "text-blue-600 bg-blue-50", icon: Package },
  confirmed: { label: "已确认", color: "text-green-600 bg-green-50", icon: CheckCircle2 },
};

/* 服务阶段定义 */
const SERVICE_STAGES = [
  { key: "diagnosis", label: "诊断", icon: Eye },
  { key: "test", label: "测试", icon: Clock },
  { key: "analysis", label: "分析", icon: Lightbulb },
  { key: "planning", label: "企划", icon: Package },
  { key: "delivery", label: "交付", icon: ArrowRight },
  { key: "tracking", label: "跟踪", icon: CheckCircle2 },
];

export default function DeliveriesPage() {
  const [plans, setPlans] = useState<DeliveryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DeliveryPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  /* 店铺相关 */
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_wechat: "",
    vip_level: "V1",
    service_type: "select",
    title: "",
    description: "",
    price: "",
    notes: "",
    store_id: "" as string,
  });

  [supabase, setSupabase] = useState<any>(null);
  // 延迟初始化 Supabase（避免 SSR hydration mismatch）
  useEffect(() => {
  useEffect(() => { fetchStores(); }, [supabase]);

  const fetchPlans = async () => {
    setLoading(true);
    let query = supabase.from("delivery_plans").select("*").order("created_at", { ascending: false });
    if (filterStatus) query = query.eq("status", filterStatus);
    if (filterService) query = query.eq("service_type", filterService);
    if (filterStore) query = query.eq("store_id", filterStore);
    const { data, error } = await query;
    if (!error && data) setPlans(data as DeliveryPlan[]);
    setLoading(false);
  };

  useEffect(() => {
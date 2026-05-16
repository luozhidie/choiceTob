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
  Clock, Lightbulb, LayoutGrid, FileText,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";

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
  vip_level: string;
  is_active: boolean;
  last_test_at: string | null;
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

/* ==================== 常量 ==================== */
const STYLE_OPTIONS = [
  { value: "shao_nv", label: "甜美少女", group: "女士八大风格" },
  { value: "you_ya", label: "法式优雅", group: "女士八大风格" },
  { value: "lang_man_f", label: "浪漫女神", group: "女士八大风格" },
  { value: "shao_nian_f", label: "简约通勤", group: "女士八大风格" },
  { value: "shi_shang_f", label: "街头潮牌", group: "女士八大风格" },
  { value: "gu_dian_f", label: "轻奢极简", group: "女士八大风格" },
  { value: "zi_ran_f", label: "日系文艺", group: "女士八大风格" },
  { value: "xi_ju_f", label: "气场女王", group: "女士八大风格" },
  { value: "xi_ju_m", label: "气场型男", group: "男士五大风格" },
  { value: "zi_ran_m", label: "随性达人", group: "男士五大风格" },
  { value: "gu_dian_m", label: "精英绅士", group: "男士五大风格" },
  { value: "lang_man_m", label: "优雅先生", group: "男士五大风格" },
  { value: "shi_shang_m", label: "潮流先锋", group: "男士五大风格" },
];

const SHOP_SIZE_OPTIONS = ["30㎡以下", "30-50㎡", "50-80㎡", "80-120㎡", "120㎡以上"];
const TARGET_AGE_OPTIONS = ["18-25岁", "25-35岁", "30-40岁", "35-50岁"];
const PRICE_RANGE_OPTIONS = ["99-199元", "199-399元", "399-699元", "699元+"];
const STATUS_OPTIONS = [
  { value: "active", label: "活跃", color: "bg-green-100 text-green-700" },
  { value: "inactive", label: "非活跃", color: "bg-gray-100 text-gray-600" },
  { value: "churned", label: "已流失", color: "bg-red-100 text-red-700" },
];

const COLOR_SEASON_LABELS: Record<string, string> = {
  light_warm: "樱花粉（浅暖春）", warm_bright: "珊瑚橘（暖亮春）", clear_warm: "柠檬黄（净暖春）",
  light_cool: "天空蓝（浅冷夏）", soft_cool: "薰衣草（柔冷夏）", cool_soft: "薄荷绿（冷柔夏）",
  warm_soft: "焦糖棕（暖柔秋）", soft_warm: "枫叶红（柔暖秋）", deep_warm: "酒红色（深暖秋）",
  clear_cool: "宝石蓝（净冷冬）", cool_bright: "银白色（冷亮冬）", deep_cool: "墨黑色（深冷冬）",
};

const STYLE_LABELS: Record<string, string> = {
  // 女士八大风格
  shao_nv: "甜美少女", you_ya: "法式优雅", lang_man_f: "浪漫女神",
  shao_nian_f: "简约通勤", shi_shang_f: "街头潮牌", gu_dian_f: "轻奢极简",
  zi_ran_f: "日系文艺", xi_ju_f: "气场女王",
  // 男士五大风格
  xi_ju_m: "气场型男", zi_ran_m: "随性达人", gu_dian_m: "精英绅士",
  lang_man_m: "优雅先生", shi_shang_m: "潮流先锋",
};

const PIE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
  "#F0B27A", "#82E0AA",
];

/* ==================== 页面 ==================== */
export default function StoresAdminPage() {
  const supabase = createClient();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCity, setFilterCity] = useState("");

  /* 弹窗状态 */
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);
  const [detailStore, setDetailStore] = useState<StoreType | null>(null);
  const [detailMembers, setDetailMembers] = useState<VipCustomer[]>([]);
  const [detailDeliveries, setDetailDeliveries] = useState<DeliveryPlan[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  /* 表单数据 */
  const [form, setForm] = useState({
    name: "", contact_person: "", phone: "", wechat: "",
    city: "", district: "", shop_size: "", style_position: "",
    target_age: "", price_range: "", notes: "", status: "active",
  });
  const [bizData, setBizData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("stores").select("*").order("created_at", { ascending: false });
    if (filterStatus) q = q.eq("status", filterStatus);
    if (filterCity) q = q.eq("city", filterCity);
    const { data, error } = await q;
    if (!error && data) setStores(data as StoreType[]);
    setLoading(false);
  }, [filterStatus, filterCity]);

  useEffect(() => { fetchStores(); }, [fetchStores]);

  const cities = Array.from(new Set(stores.map((s) => s.city).filter(Boolean) as string[]));

  const filteredStores = stores.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.phone || "").includes(q) || (s.city || "").toLowerCase().includes(q);
  });

  /* 打开新增表单 */
  const openAdd = () => {
    setEditingStore(null);
    setForm({ name: "", contact_person: "", phone: "", wechat: "", city: "", district: "", shop_size: "", style_position: "", target_age: "", price_range: "", notes: "", status: "active" });
    setBizData({});
    setShowForm(true);
  };

  /* 打开编辑表单 */
  const openEdit = (store: StoreType) => {
    setEditingStore(store);
    setForm({
      name: store.name, contact_person: store.contact_person || "", phone: store.phone || "",
      wechat: store.wechat || "", city: store.city || "", district: store.district || "",
      shop_size: store.shop_size || "", style_position: store.style_position || "",
      target_age: store.target_age || "", price_range: store.price_range || "",
      notes: store.notes || "", status: store.status,
    });
    setBizData(store.business_data || {});
    setShowForm(true);
  };

  /* 保存店铺 */
  const handleSave = async () => {
    if (!form.name.trim()) { alert("店铺名称不能为空"); return; }
    setSaving(true);
    const payload = {
      name: form.name, contact_person: form.contact_person || null,
      phone: form.phone || null, wechat: form.wechat || null,
      city: form.city || null, district: form.district || null,
      shop_size: form.shop_size || null, style_position: form.style_position || null,
      target_age: form.target_age || null, price_range: form.price_range || null,
      business_data: bizData, notes: form.notes || null, status: form.status,
    };
    if (editingStore) {
      await supabase.from("stores").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editingStore.id);
    } else {
      await supabase.from("stores").insert([payload]);
    }
    setShowForm(false);
    setSaving(false);
    fetchStores();
  };

  /* 删除店铺 */
  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此店铺？关联的会员不会被删除，但 store_id 将被清空。")) return;
    await supabase.from("stores").delete().eq("id", id);
    fetchStores();
  };

  /* 刷新聚合统计 */
  const refreshStats = async (storeId: string) => {
    await supabase.rpc("refresh_store_member_stats", { p_store_id: storeId });
    fetchStores();
    if (detailStore?.id === storeId) {
      const { data } = await supabase.from("stores").select("*").eq("id", storeId).single();
      if (data) setDetailStore(data as StoreType);
    }
  };

  /* 查看详情 */
  const openDetail = async (store: StoreType) => {
    setDetailStore(store);
    setDetailLoading(true);
    const [membersRes, deliveriesRes] = await Promise.all([
      supabase.from("vip_customers").select("*").eq("store_id", store.id).order("created_at", { ascending: false }),
      supabase.from("delivery_plans").select("*").eq("store_id", store.id).order("created_at", { ascending: false }),
    ]);
    setDetailMembers((membersRes.data || []) as VipCustomer[]);
    setDetailDeliveries((deliveriesRes.data || []) as DeliveryPlan[]);
    setDetailLoading(false);
  };

  /* 计算服务进度 */
  const getServiceProgress = (store: StoreType, members: VipCustomer[], deliveries: DeliveryPlan[]) => {
    const stages = SERVICE_STAGES.map((stage) => ({ ...stage, completed: false, active: false }));

    // 诊断：店铺有基本信息
    if (store.city || store.shop_size || store.style_position) {
      stages[0].completed = true;
    }

    // 测试：有会员已测试色彩季型或风格
    const testedMembers = members.filter((m) => m.color_season || m.main_style);
    if (testedMembers.length > 0) {
      stages[1].completed = true;
    }

    // 分析：聚合统计有数据
    const stats = store.member_stats || {};
    if (stats.tested_vip_count && stats.tested_vip_count > 0) {
      stages[2].completed = true;
    }

    // 企划：有交付方案
    if (deliveries.length > 0) {
      stages[3].completed = true;
    }

    // 交付：有已交付或已确认的方案
    if (deliveries.some((d) => d.status === "delivered" || d.status === "confirmed")) {
      stages[4].completed = true;
    }

    // 跟踪：有已确认的方案
    if (deliveries.some((d) => d.status === "confirmed")) {
      stages[5].completed = true;
    }

    // 标记当前活跃阶段
    const currentIdx = stages.findIndex((s) => !s.completed);
    if (currentIdx >= 0) {
      stages[currentIdx].active = true;
    }

    return stages;
  };

  /* 经营数据字段定义 */
  const BIZ_FIELDS = [
    { key: "monthly_rent", label: "月租金（元）", type: "number" },
    { key: "break_even_point", label: "保本点（元/月）", type: "number" },
    { key: "gross_margin_rate", label: "毛利率", type: "percent" },
    { key: "net_margin_rate", label: "净利率", type: "percent" },
    { key: "online_exposure", label: "线上曝光人数/月", type: "number" },
    { key: "foot_traffic", label: "月进店数", type: "number" },
    { key: "conversion_rate", label: "成交率", type: "percent" },
    { key: "attach_rate", label: "连带率", type: "number" },
    { key: "avg_item_price", label: "均件单价（元）", type: "number" },
    { key: "monthly_revenue", label: "月营业额（元）", type: "number" },
  ];

  const renderBizField = (field: typeof BIZ_FIELDS[0]) => (
    <div key={field.key}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{field.label}</label>
      <input
        type={field.type === "number" ? "number" : "text"}
        step={field.type === "percent" ? "0.01" : undefined}
        value={bizData[field.key] != null ? String(bizData[field.key]) : ""}
        onChange={(e) => {
          const v = e.target.value;
          setBizData({ ...bizData, [field.key]: v === "" ? null : field.type === "number" || field.type === "percent" ? Number(v) : v });
        }}
        placeholder={field.type === "percent" ? "如 0.55 表示55%" : ""}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none"
      />
    </div>
  );

  /* ==================== 聚合统计图表 ==================== */
  const renderMemberStatsCharts = (store: StoreType) => {
    const stats = store.member_stats || {};
    const colorDist = stats.color_season_distribution || {};
    const styleDist = stats.style_distribution || {};
    const totalVip = stats.total_vip_count || 0;
    const testedVip = stats.tested_vip_count || 0;

    const colorChartData = Object.entries(colorDist).map(([key, val]: [string, any]) => ({
      name: COLOR_SEASON_LABELS[key] || key,
      value: val.count,
      percentage: val.percentage,
    }));

    const styleChartData = Object.entries(styleDist).map(([key, val]: [string, any]) => ({
      name: STYLE_LABELS[key] || key,
      value: val.count,
      percentage: val.percentage,
    }));

    return (
      <div className="space-y-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalVip}</div>
            <div className="text-xs text-blue-500 mt-1">总VIP数</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{testedVip}</div>
            <div className="text-xs text-green-500 mt-1">已测试</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{totalVip > 0 ? Math.round((testedVip / totalVip) * 100) : 0}%</div>
            <div className="text-xs text-amber-500 mt-1">测试覆盖率</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(colorDist).length}</div>
            <div className="text-xs text-purple-500 mt-1">色彩季型种类</div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 色彩季型分布 - 饼图 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h4 className="font-bold text-primary mb-4">色彩季型分布</h4>
            {colorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={colorChartData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value"
                    label={({ name, percentage }: any) => `${name} ${percentage}%`} labelLine={false}
                    fontSize={11}>
                    {colorChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any) => [`${value}人`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">暂无测试数据</div>
            )}
          </div>

          {/* 风格分布 - 柱状图 */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h4 className="font-bold text-primary mb-4">风格分布</h4>
            {styleChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={styleChartData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => [`${value}人`, "数量"]} />
                  <Bar dataKey="value" fill="#4ECDC4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">暂无测试数据</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ==================== 渲染 ==================== */
  return (
    <div className="space-y-6">
      {/* 标题栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Store className="w-6 h-6" /> 店铺管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">以店铺为核心组织会员数据，驱动差异化商品企划</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> 新增店铺
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索店铺名称、电话、城市..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="">全部状态</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">
          <option value="">全部城市</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* 店铺列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent mr-3" /><span className="text-muted-foreground">加载中...</span></div>
      ) : filteredStores.length === 0 ? (
        <div className="text-center py-16"><Store className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-muted-foreground text-sm">暂无店铺数据</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStores.map((store) => {
            const stats = store.member_stats || {};
            const statusOpt = STATUS_OPTIONS.find((s) => s.value === store.status);
            return (
              <motion.div key={store.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5">
                  {/* 头部 */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-primary">{store.name}</h3>
                      {store.city && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{store.city}{store.district ? ` · ${store.district}` : ""}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusOpt?.color || "bg-gray-100 text-gray-600"}`}>{statusOpt?.label || store.status}</span>
                  </div>

                  {/* 信息行 */}
                  <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                    {store.style_position && <span className="px-2 py-0.5 bg-primary/5 rounded-full">{STYLE_LABELS[store.style_position] || store.style_position}</span>}
                    {store.shop_size && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{store.shop_size}</span>}
                    {store.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{store.phone}</span>}
                  </div>

                  {/* 会员统计摘要 */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-gray-50 pt-3">
                    <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" />VIP {stats.total_vip_count || 0}</span>
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />已测试 {stats.tested_vip_count || 0}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{store.price_range || "未设"}</span>
                  </div>
                </div>

                {/* 操作栏 */}
                <div className="flex items-center border-t border-gray-50 divide-x divide-gray-50">
                  <button onClick={() => openDetail(store)} className="flex-1 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1">
                    <Eye className="w-3.5 h-3.5" />详情
                  </button>
                  <button onClick={() => openEdit(store)} className="flex-1 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
                    <Edit2 className="w-3.5 h-3.5" />编辑
                  </button>
                  <button onClick={() => refreshStats(store.id)} className="flex-1 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors flex items-center justify-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" />刷新统计
                  </button>
                  <button onClick={() => handleDelete(store.id)} className="flex-1 py-2.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" />删除
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ==================== 新增/编辑弹窗 ==================== */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center pt-10 p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl w-full max-w-4xl shadow-2xl mb-10">
              {/* 头部 */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <h3 className="font-bold text-lg text-primary">{editingStore ? "编辑店铺" : "新增店铺"}</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 基本信息 */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><Store className="w-4 h-4 text-accent" />基本信息</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 lg:col-span-1"><label className="block text-xs font-medium text-gray-500 mb-1">店铺名称 *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">联系人</label><input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">联系电话</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">微信号</label><input value={form.wechat} onChange={(e) => setForm({ ...form, wechat: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">所在城市</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" placeholder="如：杭州" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">商圈/地段</label><input value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" placeholder="如：武林银泰" /></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">店铺面积</label><select value={form.shop_size} onChange={(e) => setForm({ ...form, shop_size: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"><option value="">请选择</option>{SHOP_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">风格定位</label><select value={form.style_position} onChange={(e) => setForm({ ...form, style_position: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"><option value="">请选择</option><optgroup label="── 女士八大风格 ──">{STYLE_OPTIONS.filter(s => s.group === "女士八大风格").map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</optgroup><optgroup label="── 男士五大风格 ──">{STYLE_OPTIONS.filter(s => s.group === "男士五大风格").map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</optgroup></select></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">目标年龄层</label><select value={form.target_age} onChange={(e) => setForm({ ...form, target_age: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"><option value="">请选择</option>{TARGET_AGE_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">价格带</label><select value={form.price_range} onChange={(e) => setForm({ ...form, price_range: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white"><option value="">请选择</option>{PRICE_RANGE_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">状态</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">{STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
                  </div>
                </div>

                {/* 经营数据 */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" />经营数据</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {BIZ_FIELDS.map(renderBizField)}
                  </div>
                  {/* 流量渠道 */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">流量渠道（逗号分隔）</label>
                    <input value={Array.isArray(bizData.traffic_channels) ? bizData.traffic_channels.join("，") : bizData.traffic_channels || ""}
                      onChange={(e) => setBizData({ ...bizData, traffic_channels: e.target.value ? e.target.value.split(/[，,]/).map((s: string) => s.trim()).filter(Boolean) : [] })}
                      placeholder="如：小红书，抖音，线下" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" />
                  </div>
                  {/* 当前流行趋势 */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">当前流行趋势（逗号分隔）</label>
                    <input value={Array.isArray(bizData.current_trends) ? bizData.current_trends.join("，") : bizData.current_trends || ""}
                      onChange={(e) => setBizData({ ...bizData, current_trends: e.target.value ? e.target.value.split(/[，,]/).map((s: string) => s.trim()).filter(Boolean) : [] })}
                      placeholder="如：新中式，莫兰迪色系" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none" />
                  </div>
                </div>

                {/* 备注 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">备注</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-1 focus:ring-accent/20 outline-none resize-none" />
                </div>
              </div>

              {/* 底部 */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}保存
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== 详情弹窗 ==================== */}
      <AnimatePresence>
        {detailStore && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center pt-6 p-4 overflow-y-auto">
            <div className="absolute inset-0 bg-black/50" onClick={() => setDetailStore(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl w-full max-w-6xl shadow-2xl mb-10">
              {/* 头部 */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-primary">{detailStore.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {detailStore.city}{detailStore.district ? ` · ${detailStore.district}` : ""}
                    {detailStore.style_position && ` · ${STYLE_LABELS[detailStore.style_position] || detailStore.style_position}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => refreshStats(detailStore.id)} className="px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 rounded-lg border border-green-200 transition-colors flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />刷新统计
                  </button>
                  <button onClick={() => setDetailStore(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* 基本信息卡片 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { icon: Ruler, label: "面积", value: detailStore.shop_size },
                    { icon: UsersIcon, label: "年龄层", value: detailStore.target_age },
                    { icon: DollarSign, label: "价格带", value: detailStore.price_range },
                    { icon: Phone, label: "电话", value: detailStore.phone },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><item.icon className="w-3 h-3" />{item.label}</div>
                      <div className="text-sm font-medium text-primary">{item.value || "未填写"}</div>
                    </div>
                  ))}
                </div>

                {/* 经营数据 */}
                {Object.keys(detailStore.business_data || {}).length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" />经营数据</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {BIZ_FIELDS.map((f) => {
                        const val = detailStore.business_data?.[f.key];
                        if (val === null || val === undefined) return null;
                        return (
                          <div key={f.key} className="bg-muted/30 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-primary">
                              {f.type === "percent" ? `${(val * 100).toFixed(0)}%` : f.key.includes("rent") || f.key.includes("revenue") || f.key.includes("price") || f.key.includes("point") ? `¥${val.toLocaleString()}` : val}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1">{f.label}</div>
                          </div>
                        );
                      })}
                    </div>
                    {/* 流量渠道 */}
                    {detailStore.business_data?.traffic_channels?.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">流量渠道：</span>
                        {detailStore.business_data.traffic_channels.map((ch: string) => (
                          <span key={ch} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{ch}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 会员聚合统计仪表盘 */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-accent" />会员色彩/风格聚合统计</h4>
                  {renderMemberStatsCharts(detailStore)}
                </div>

                {/* 服务交付进度 */}
                {(() => {
                  const progress = getServiceProgress(detailStore, detailMembers, detailDeliveries);
                  const completedCount = progress.filter((s) => s.completed).length;
                  const progressPercent = Math.round((completedCount / progress.length) * 100);
                  const activeStage = progress.find((s) => s.active);
                  return (
                    <div>
                      <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><ArrowRight className="w-4 h-4 text-accent" />服务交付进度</h4>
                      <div className="bg-muted/30 rounded-xl p-5">
                        {/* 进度条 */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-primary">整体进度 {progressPercent}%</span>
                          {activeStage && (
                            <span className="text-xs text-accent font-medium">当前阶段：{activeStage.label} — {activeStage.desc}</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-5">
                          <div className="bg-accent rounded-full h-2.5 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>

                        {/* 阶段节点 */}
                        <div className="flex items-start justify-between gap-1">
                          {progress.map((stage, i) => (
                            <div key={stage.key} className="flex flex-col items-center flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                                stage.completed ? "bg-accent border-accent text-white" :
                                stage.active ? "bg-white border-accent text-accent animate-pulse" :
                                "bg-white border-gray-200 text-gray-300"
                              }`}>
                                <stage.icon className="w-4 h-4" />
                              </div>
                              <span className={`text-[10px] mt-1.5 font-medium text-center ${
                                stage.completed ? "text-accent" :
                                stage.active ? "text-accent" :
                                "text-gray-400"
                              }`}>
                                {stage.label}
                              </span>
                              {stage.completed && (
                                <CheckCircle2 className="w-3 h-3 text-accent mt-0.5" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 交付方案时间线 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-primary flex items-center gap-2"><Package className="w-4 h-4 text-accent" />交付方案时间线</h4>
                    <Link href="/admin/deliveries" className="text-xs text-accent hover:underline flex items-center gap-1">
                      管理全部方案 <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                  {detailDeliveries.length === 0 ? (
                    <div className="bg-muted/30 rounded-xl p-8 text-center">
                      <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">暂无交付方案</p>
                      <Link href="/admin/deliveries" className="text-xs text-accent hover:underline mt-2 inline-block">去创建第一个方案 →</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {detailDeliveries.map((plan, idx) => {
                        const typeInfo = serviceTypeMap[plan.service_type] || serviceTypeMap.select;
                        const statusInfo = deliveryStatusMap[plan.status] || deliveryStatusMap.draft;
                        const TypeIcon = typeInfo.icon;
                        return (
                          <div key={plan.id} className="flex gap-4 group">
                            {/* 时间线竖线 */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                plan.status === "confirmed" ? "bg-green-100 text-green-600" :
                                plan.status === "delivered" ? "bg-blue-100 text-blue-600" :
                                plan.status === "in_progress" ? "bg-amber-100 text-amber-600" :
                                "bg-gray-100 text-gray-400"
                              }`}>
                                <TypeIcon className="w-3.5 h-3.5" />
                              </div>
                              {idx < detailDeliveries.length - 1 && (
                                <div className="w-0.5 flex-1 bg-gray-100 my-1" />
                              )}
                            </div>
                            {/* 内容 */}
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-primary">{plan.title}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                                  <TypeIcon className="w-2.5 h-2.5 inline mr-0.5" />{typeInfo.label}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              {plan.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                                <span>{plan.customer_name}</span>
                                {plan.price && <span className="text-accent font-medium">¥{(plan.price / 100).toFixed(0)}</span>}
                                <span>{new Date(plan.updated_at).toLocaleDateString("zh-CN")}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 会员列表 */}
                <div>
                  <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2"><UsersIcon className="w-4 h-4 text-accent" />店铺会员列表</h4>
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-accent mr-2" /><span className="text-sm text-muted-foreground">加载中...</span></div>
                  ) : detailMembers.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">暂无关联会员</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">姓名</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">电话</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">性别</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">色彩季型</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">主风格</th>
                            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">VIP等级</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailMembers.map((m) => (
                            <tr key={m.id} className="border-b border-gray-50 hover:bg-muted/30">
                              <td className="py-2 px-3 font-medium">{m.name}</td>
                              <td className="py-2 px-3 text-muted-foreground">{m.phone || "-"}</td>
                              <td className="py-2 px-3">{m.gender === "female" ? "女" : m.gender === "male" ? "男" : "-"}</td>
                              <td className="py-2 px-3"><span className="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full">{(m.color_season && COLOR_SEASON_LABELS[m.color_season]) || m.color_season || "未测试"}</span></td>
                              <td className="py-2 px-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{(m.main_style && STYLE_LABELS[m.main_style]) || m.main_style || "未测试"}</span></td>
                              <td className="py-2 px-3">{m.vip_level}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

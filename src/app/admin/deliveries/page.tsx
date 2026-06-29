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
    if (typeof document !== "undefined") {
      setSupabase(createClient());
    }
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  /* 获取店铺列表 */
  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name, city").eq("status", "active").order("name");
    if (data) setStoreOptions(data as StoreOption[]);
  };

  useEffect(() => { fetchStores(); }, []);

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
    fetchPlans();
  }, [filterStatus, filterService, filterStore]);

  const resetForm = () => {
    setForm({
      customer_name: "",
      customer_phone: "",
      customer_wechat: "",
      vip_level: "V1",
      service_type: "select",
      title: "",
      description: "",
      price: "",
      notes: "",
      store_id: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.title.trim()) {
      alert("请填写客户姓名和方案标题");
      return;
    }
    const payload = {
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      customer_wechat: form.customer_wechat.trim() || null,
      vip_level: form.vip_level,
      service_type: form.service_type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: form.price ? parseInt(form.price) * 100 : null,
      notes: form.notes.trim() || null,
      store_id: form.store_id || null,
    };

    if (editingPlan) {
      const { error } = await supabase.from("delivery_plans").update(payload).eq("id", editingPlan.id);
      if (error) showToast("error", "更新失败");
      else { showToast("success", "方案已更新"); setShowForm(false); setEditingPlan(null); resetForm(); fetchPlans(); }
    } else {
      const { error } = await supabase.from("delivery_plans").insert([payload]);
      if (error) showToast("error", "创建失败");
      else { showToast("success", "方案已创建"); setShowForm(false); resetForm(); fetchPlans(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此交付方案？")) return;
    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "delivery_plans" }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      showToast("success", "已删除");
      fetchPlans();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("delivery_plans").update({ status: newStatus }).eq("id", id);
    if (error) showToast("error", "状态更新失败");
    else { showToast("success", "状态已更新"); fetchPlans(); }
  };

  const openEdit = (plan: DeliveryPlan) => {
    setEditingPlan(plan);
    setForm({
      customer_name: plan.customer_name,
      customer_phone: plan.customer_phone || "",
      customer_wechat: plan.customer_wechat || "",
      vip_level: plan.vip_level,
      service_type: plan.service_type,
      title: plan.title,
      description: plan.description || "",
      price: plan.price ? (plan.price / 100).toString() : "",
      notes: plan.notes || "",
      store_id: plan.store_id || "",
    });
    setShowForm(true);
  };

  const getStoreName = (storeId: string | null) => {
    if (!storeId) return null;
    const store = storeOptions.find((s) => s.id === storeId);
    return store ? store.name : "未知店铺";
  };

  const filteredPlans = plans.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.customer_name.toLowerCase().includes(term) ||
      p.title.toLowerCase().includes(term) ||
      (p.customer_phone && p.customer_phone.includes(term)) ||
      (getStoreName(p.store_id) || "").toLowerCase().includes(term)
    );
  });

  const formatPrice = (price: number | null) => price ? `¥${(price / 100).toFixed(0)}` : "—";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-primary" : "bg-red-500"}`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">交付方案管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理店铺选品、陈列、企划等交付方案，追踪服务进度</p>
        </div>
        <button
          onClick={() => { setEditingPlan(null); resetForm(); setShowForm(true); }}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl"
        >
          <Plus className="w-4 h-4" />
          新建方案
        </button>
      </div>

      {/* 服务进度总览 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-accent" />
            服务交付流程
          </h3>
          <div className="flex items-center justify-between gap-1">
            {SERVICE_STAGES.map((stage, i) => (
              <div key={stage.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    i === 0 ? "bg-accent text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    <stage.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${i === 0 ? "text-accent" : "text-gray-400"}`}>
                    {stage.label}
                  </span>
                </div>
                {i < SERVICE_STAGES.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i === 0 ? "bg-accent/40" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="max-w-7xl mx-auto mb-4 space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索客户姓名、方案标题、手机号、店铺名..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-colors ${showFilters ? "border-primary text-primary bg-primary/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <Filter className="w-4 h-4" />
            筛选
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>
        {showFilters && (
          <div className="flex gap-3 flex-wrap">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="in_progress">进行中</option>
              <option value="delivered">已交付</option>
              <option value="confirmed">已确认</option>
            </select>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部类型</option>
              <option value="select">选品方案</option>
              <option value="display">陈列方案</option>
              <option value="planning">企划方案</option>
              <option value="full">全案服务</option>
            </select>
            <select
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部店铺</option>
              {storeOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ""}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto mb-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "全部方案", value: plans.length, color: "bg-primary/10 text-primary" },
          { label: "进行中", value: plans.filter((p) => p.status === "in_progress").length, color: "bg-amber-50 text-amber-600" },
          { label: "已交付", value: plans.filter((p) => p.status === "delivered").length, color: "bg-blue-50 text-blue-600" },
          { label: "已确认", value: plans.filter((p) => p.status === "confirmed").length, color: "bg-green-50 text-green-600" },
          { label: "关联店铺", value: new Set(plans.filter((p) => p.store_id).map((p) => p.store_id)).size, color: "bg-purple-50 text-purple-600" },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl p-4 ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-70 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <p className="mt-3 text-sm">加载中...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            {searchTerm || filterStatus || filterService || filterStore ? "没有匹配的交付方案" : "暂无交付方案，点击上方按钮创建"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3 font-medium">客户</th>
                  <th className="px-5 py-3 font-medium">所属店铺</th>
                  <th className="px-5 py-3 font-medium">方案</th>
                  <th className="px-5 py-3 font-medium">类型</th>
                  <th className="px-5 py-3 font-medium">金额</th>
                  <th className="px-5 py-3 font-medium">状态</th>
                  <th className="px-5 py-3 font-medium">更新时间</th>
                  <th className="px-5 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPlans.map((plan) => {
                  const serviceInfo = serviceTypeMap[plan.service_type] || serviceTypeMap.select;
                  const statusInfo = statusMap[plan.status] || statusMap.draft;
                  const ServiceIcon = serviceInfo.icon;
                  const storeName = getStoreName(plan.store_id);
                  return (
                    <tr key={plan.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{plan.customer_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {plan.customer_phone || "—"} · VIP{plan.vip_level}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {storeName ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                            <Store className="w-3 h-3" />
                            {storeName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">未关联</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{plan.title}</div>
                        {plan.description && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${serviceInfo.color}`}>
                          <ServiceIcon className="w-3 h-3" />
                          {serviceInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-accent">{formatPrice(plan.price)}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={plan.status}
                          onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusInfo.color}`}
                        >
                          <option value="draft">草稿</option>
                          <option value="in_progress">进行中</option>
                          <option value="delivered">已交付</option>
                          <option value="confirmed">已确认</option>
                        </select>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {new Date(plan.updated_at).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(plan)} className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors" title="编辑">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(plan.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="删除">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-primary mb-6">{editingPlan ? "编辑交付方案" : "新建交付方案"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
                  <input type="text" required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="客户姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">VIP等级</label>
                  <select value={form.vip_level} onChange={(e) => setForm({ ...form, vip_level: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="V1">V1</option>
                    <option value="V2">V2</option>
                    <option value="V3">V3</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input type="tel" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="手机号" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">微信号</label>
                  <input type="text" value={form.customer_wechat} onChange={(e) => setForm({ ...form, customer_wechat: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="微信号" />
                </div>
              </div>
              {/* 关联店铺 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Store className="w-3.5 h-3.5 inline mr-1" />
                  关联店铺
                </label>
                <select value={form.store_id} onChange={(e) => setForm({ ...form, store_id: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">不关联店铺</option>
                  {storeOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务类型 *</label>
                  <select value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="select">选品方案</option>
                    <option value="display">陈列方案</option>
                    <option value="planning">企划方案</option>
                    <option value="full">全案服务</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金额（元）</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="如 99" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">方案标题 *</label>
                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="如：2025春季选品方案" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">方案描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="方案详细描述..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="内部备注..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingPlan(null); }} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">{editingPlan ? "保存修改" : "创建方案"}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

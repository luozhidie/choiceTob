"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FEMALE_STYLES, MALE_STYLES, getStyleLabel, getStyleGroup } from "@/lib/styles";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Search,
  Loader2,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface VipCustomer {
  id: string;
  name: string;
  phone: string;
  wechat: string;
  company: string;
  gender: string;
  color_season: string;
  main_style: string;
  sub_style: string;
  vip_level: string;
  notes: string;
  is_active: boolean;
  store_id: string | null;
  created_at: string;
}

interface StoreOption {
  id: string;
  name: string;
  city: string | null;
}

const COLOR_SEASONS = [
  "深秋", "浅秋", "净秋", "柔秋",
  "深春", "浅春", "净春", "柔春",
  "深冬", "浅冬", "净冬", "柔冬",
];

const STYLE_TYPES = [
  ...FEMALE_STYLES.map(s => s.label),
  ...MALE_STYLES.map(s => s.label),
];

const VIP_LEVELS = [
  { value: "V1", label: "V1银卡" },
  { value: "V2", label: "V2金卡" },
  { value: "V3", label: "V3黑卡" },
];

const PAGE_SIZE = 10;

const emptyForm = {
  name: "",
  phone: "",
  wechat: "",
  company: "",
  gender: "女",
  color_season: "",
  main_style: "",
  sub_style: "",
  vip_level: "V1",
  notes: "",
  is_active: true,
  store_id: "" as string,
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<VipCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<VipCustomer | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVipLevel, setFilterVipLevel] = useState("");
  const [filterColorSeason, setFilterColorSeason] = useState("");
  const [filterMainStyle, setFilterMainStyle] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [storeOptions, setStoreOptions] = useState<StoreOption[]>([]);
  const [filterStore, setFilterStore] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkUser();
    fetchStores();
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchQuery, filterVipLevel, filterColorSeason, filterMainStyle, filterStore]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/admin/login");
    }
  };

  const fetchStores = async () => {
    const { data } = await supabase.from("stores").select("id, name, city").eq("status", "active").order("name");
    if (data) setStoreOptions(data as StoreOption[]);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("vip_customers")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery.trim()}%,phone.ilike.%${searchQuery.trim()}%`);
    }
    if (filterVipLevel) {
      query = query.eq("vip_level", filterVipLevel);
    }
    if (filterColorSeason) {
      query = query.eq("color_season", filterColorSeason);
    }
    if (filterMainStyle) {
      query = query.eq("main_style", filterMainStyle);
    }
    if (filterStore) {
      query = query.eq("store_id", filterStore);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error fetching customers:", error);
    } else {
      setCustomers(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = { ...formData, store_id: formData.store_id || null };

    if (editingCustomer) {
      const { error } = await supabase
        .from("vip_customers")
        .update(submitData)
        .eq("id", editingCustomer.id);

      if (error) {
        alert("更新失败：" + error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("vip_customers")
        .insert([submitData]);

      if (error) {
        alert("创建失败：" + error.message);
        return;
      }
    }

    // 刷新关联店铺的聚合统计
    if (submitData.store_id) {
      await supabase.rpc("refresh_store_member_stats", { p_store_id: submitData.store_id });
    }

    closeModal();
    fetchCustomers();
  };

  const handleEdit = (customer: VipCustomer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      wechat: customer.wechat || "",
      company: customer.company || "",
      gender: customer.gender || "女",
      color_season: customer.color_season || "",
      main_style: customer.main_style || "",
      sub_style: customer.sub_style || "",
      vip_level: customer.vip_level || "V1",
      notes: customer.notes || "",
      is_active: customer.is_active,
      store_id: customer.store_id || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该客户吗？删除后无法恢复。")) return;

    const { error } = await supabase
      .from("vip_customers")
      .delete()
      .eq("id", id);

    if (error) {
      alert("删除失败：" + error.message);
      return;
    }

    fetchCustomers();
  };

  const toggleActive = async (customer: VipCustomer) => {
    const { error } = await supabase
      .from("vip_customers")
      .update({ is_active: !customer.is_active })
      .eq("id", customer.id);

    if (error) {
      alert("操作失败：" + error.message);
      return;
    }

    fetchCustomers();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setFormData(emptyForm);
  };

  const getVipLevelBadge = (level: string) => {
    switch (level) {
      case "V1": return "bg-gray-100 text-gray-800";
      case "V2": return "bg-amber-100 text-amber-800";
      case "V3": return "bg-gray-900 text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getVipLevelLabel = (level: string) => {
    return VIP_LEVELS.find(v => v.value === level)?.label || level;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">VIP客户管理</h1>
          <p className="text-muted-foreground mt-1">管理客户档案与VIP信息</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData(emptyForm);
            setShowModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新增客户
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="搜索姓名/手机号..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm"
            />
          </div>
          <select
            value={filterVipLevel}
            onChange={(e) => { setFilterVipLevel(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          >
            <option value="">全部VIP等级</option>
            {VIP_LEVELS.map(v => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <select
            value={filterColorSeason}
            onChange={(e) => { setFilterColorSeason(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          >
            <option value="">全部色彩季型</option>
            {COLOR_SEASONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterMainStyle}
            onChange={(e) => { setFilterMainStyle(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          >
            <option value="">全部风格类型</option>
            <optgroup label="── 女士八大风格 ──">
              {FEMALE_STYLES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
            </optgroup>
            <optgroup label="── 男士五大风格 ──">
              {MALE_STYLES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
            </optgroup>
          </select>
          <select
            value={filterStore}
            onChange={(e) => { setFilterStore(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
          >
            <option value="">全部店铺</option>
            {storeOptions.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ""}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无客户数据，点击"新增客户"开始添加</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">姓名</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">手机号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">微信</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">所属企业</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">所属店铺</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">性别</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">色彩季型</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">主风格</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">VIP等级</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">状态</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-primary text-sm">{customer.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{customer.wechat || "-"}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{customer.company || "-"}</td>
                      <td className="px-4 py-3 text-sm">{customer.store_id ? (storeOptions.find(s => s.id === customer.store_id)?.name || customer.store_id) : "-"}</td>
                      <td className="px-4 py-3 text-sm">{customer.gender || "-"}</td>
                      <td className="px-4 py-3 text-sm">{customer.color_season || "-"}</td>
                      <td className="px-4 py-3 text-sm">{customer.main_style || "-"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getVipLevelBadge(customer.vip_level)}`}>
                          {getVipLevelLabel(customer.vip_level)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(customer)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${customer.is_active ? "bg-green-100 text-green-800 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                          {customer.is_active ? "活跃" : "停用"}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleEdit(customer)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="编辑"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(customer.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              共 {totalCount} 条记录，第 {currentPage}/{totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === currentPage ? "bg-accent text-white" : "hover:bg-gray-50 text-gray-600"}`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editingCustomer ? "编辑客户" : "新增客户"}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">姓名 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="客户姓名" />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">性别</label>
                  <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="女">女</option>
                    <option value="男">男</option>
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">手机号</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="手机号码" />
                </div>

                {/* WeChat */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">微信号</label>
                  <input type="text" value={formData.wechat} onChange={(e) => setFormData({ ...formData, wechat: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="微信号" />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">所属企业/店铺</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors" placeholder="企业或店铺名称" />
                </div>

                {/* Store */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">关联店铺</label>
                  <select value={formData.store_id} onChange={(e) => setFormData({ ...formData, store_id: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="">未关联店铺</option>
                    {storeOptions.map(s => (
                      <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ""}</option>
                    ))}
                  </select>
                </div>

                {/* VIP Level */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">VIP等级</label>
                  <select value={formData.vip_level} onChange={(e) => setFormData({ ...formData, vip_level: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    {VIP_LEVELS.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>

                {/* Color Season */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">色彩季型</label>
                  <select value={formData.color_season} onChange={(e) => setFormData({ ...formData, color_season: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="">请选择</option>
                    {COLOR_SEASONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Main Style */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">主风格</label>
                  <select value={formData.main_style} onChange={(e) => setFormData({ ...formData, main_style: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                    <option value="">请选择</option>
                    <optgroup label="── 女士八大风格 ──">
                      {FEMALE_STYLES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                    </optgroup>
                    <optgroup label="── 男士五大风格 ──">
                      {MALE_STYLES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Sub Style - full width */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">副风格（选填）</label>
                <select value={formData.sub_style} onChange={(e) => setFormData({ ...formData, sub_style: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors">
                  <option value="">请选择</option>
                  <optgroup label="── 女士八大风格 ──">
                    {FEMALE_STYLES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                  </optgroup>
                  <optgroup label="── 男士五大风格 ──">
                    {MALE_STYLES.map(s => <option key={s.label} value={s.label}>{s.label}</option>)}
                  </optgroup>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">备注</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors resize-none" placeholder="备注信息" />
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? "bg-accent" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <label className="text-sm font-medium text-primary cursor-pointer">是否活跃</label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingCustomer ? "保存修改" : "新增客户"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

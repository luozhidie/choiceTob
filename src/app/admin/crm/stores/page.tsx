"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Pencil, Trash2, Save, X, Loader2, Search,
  ChevronLeft, ChevronRight, Phone, MapPin, Store as StoreIcon,
  Upload, Download, Eye, Building2, Clock, Tag, Filter,
} from "lucide-react";

interface CrmStore {
  id: string;
  name: string;
  address: string | null;
  owner_phone: string;
  owner_name: string | null;
  industry: string | null;
  landline: string | null;
  email: string | null;
  business_hours: string | null;
  business_scope: string | null;
  source: string;
  source_detail: string | null;
  status: string;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  // 关联
  contact_count?: number;
  latest_follow_up_at?: string | null;
}

const SOURCE_MAP: Record<string, string> = {
  manual: "手动录入",
  import: "批量导入",
  scrape: "公开采集",
};

const STATUS_MAP: Record<string, string> = {
  active: "在营",
  inactive: "暂停",
  closed: "已关闭",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-100 text-gray-600",
};

const INDUSTRY_OPTIONS = ["服装店", "轮胎店", "滋补行", "其他"];

const PAGE_SIZE = 15;

const emptyForm = {
  name: "",
  address: "",
  owner_phone: "",
  owner_name: "",
  industry: "服装店",
  landline: "",
  email: "",
  business_hours: "",
  business_scope: "",
  source: "manual" as CrmStore["source"],
  source_detail: "",
  status: "active" as CrmStore["status"],
  tags: [] as string[],
  notes: "",
};

export default function CrmStoresPage() {
  const [stores, setStores] = useState<CrmStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<CrmStore | null>(null);
  const [editingStore, setEditingStore] = useState<CrmStore | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { fetchStores(); }, [page, search, filterSource, filterIndustry, filterStatus]);

  const fetchStores = async () => {
    setLoading(true);
    let query = supabase
      .from("crm_stores")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,owner_phone.ilike.%${search}%,owner_name.ilike.%${search}%,address.ilike.%${search}%`);
    }
    if (filterSource) query = query.eq("source", filterSource);
    if (filterIndustry) query = query.eq("industry", filterIndustry);
    if (filterStatus) query = query.eq("status", filterStatus);

    const from = (page - 1) * PAGE_SIZE;
    query = query.range(from, from + PAGE_SIZE - 1);

    const { data, error, count } = await query;
    if (!error && data) {
      // 获取每个门店的联系人数和最近跟进
      const storeIds = data.map(s => s.id);
      const [contactRes, followRes] = await Promise.all([
        supabase.from("crm_contacts").select("store_id").is("deleted_at", null).in("store_id", storeIds),
        supabase.from("crm_follow_ups").select("store_id, follow_time").in("store_id", storeIds).order("follow_time", { ascending: false }),
      ]);

      const contactCounts: Record<string, number> = {};
      (contactRes.data || []).forEach(c => { contactCounts[c.store_id] = (contactCounts[c.store_id] || 0) + 1; });

      const latestFollow: Record<string, string> = {};
      (followRes.data || []).forEach(f => { if (!latestFollow[f.store_id]) latestFollow[f.store_id] = f.follow_time; });

      const enriched = data.map(s => ({
        ...s,
        contact_count: contactCounts[s.id] || 0,
        latest_follow_up_at: latestFollow[s.id] || null,
      }));
      setStores(enriched);
      setTotal(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStore) {
      const { error } = await supabase.from("crm_stores").update(formData).eq("id", editingStore.id);
      if (error) { alert("更新失败：" + error.message); return; }
    } else {
      const { error } = await supabase.from("crm_stores").insert([formData]);
      if (error) { alert("创建失败：" + error.message); return; }
    }
    setShowModal(false);
    setEditingStore(null);
    setFormData(emptyForm);
    fetchStores();
  };

  const handleEdit = (store: CrmStore) => {
    setEditingStore(store);
    setFormData({
      name: store.name || "",
      address: store.address || "",
      owner_phone: store.owner_phone || "",
      owner_name: store.owner_name || "",
      industry: store.industry || "服装",
      landline: store.landline || "",
      email: store.email || "",
      business_hours: store.business_hours || "",
      business_scope: store.business_scope || "",
      source: store.source,
      source_detail: store.source_detail || "",
      status: store.status,
      tags: store.tags || [],
      notes: store.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这家门店吗？")) return;
    const { error } = await supabase.from("crm_stores").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) { alert("删除失败：" + error.message); return; }
    fetchStores();
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  // CSV/Excel导入
  const handleImport = async () => {
    if (!importText.trim()) { alert("请粘贴数据"); return; }
    setImporting(true);
    try {
      const lines = importText.trim().split("\n");
      const records: any[] = [];
      for (let i = 0; i < lines.length; i++) {
        const cols = lines[i].split(/[,\t]/).map(s => s.trim().replace(/^["']|["']$/g, ""));
        if (i === 0 && (cols[0] === "店名" || cols[0] === "name" || cols[0] === "门店名称")) continue; // 跳过表头
        if (cols.length < 2) continue;
        records.push({
          name: cols[0] || "",
          owner_phone: cols[1] || "",
          address: cols[2] || "",
          owner_name: cols[3] || "",
          industry: cols[4] || "其他",
          source: "import",
          status: "active",
        });
      }
      if (records.length === 0) { alert("未解析到有效数据，请检查格式"); setImporting(false); return; }
      const { error } = await supabase.from("crm_stores").insert(records);
      if (error) { alert("导入失败：" + error.message); } else {
        alert(`成功导入 ${records.length} 条门店数据`);
        setShowImportModal(false);
        setImportText("");
        fetchStores();
      }
    } catch (err) { alert("解析出错，请检查数据格式"); }
    setImporting(false);
  };

  // 导出模板
  const downloadTemplate = () => {
    const csv = "店名,手机号(必填),地址,联系人,行业\n示例服装店,13800138000,杭州市西湖区xx路,张三,服装";
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "门店导入模板.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // 导出当前筛选后的门店数据
  const handleExport = () => {
    if (stores.length === 0) { alert("没有可导出的数据"); return; }
    const headers = ["店名", "手机号", "地址", "联系人", "行业", "来源", "状态", "备注"];
    const rows = stores.map(s => [
      s.name,
      s.owner_phone,
      s.address || "",
      s.owner_name || "",
      s.industry || "",
      SOURCE_MAP[s.source] || s.source,
      STATUS_MAP[s.status] || s.status,
      s.notes || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `门店名单_${new Date().toLocaleDateString("zh-CN")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">门店信息管理</h1>
          <p className="text-muted-foreground mt-1">管理B端服装门店客户，支持手动录入、批量导入和公开采集</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> 导出名单
          </button>
          <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> 批量导入
          </button>
          <button onClick={() => { setEditingStore(null); setFormData(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新增门店
          </button>
        </div>
      </div>

      {/* 搜索 & 筛选 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="搜索店名/手机号/联系人/地址..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm" />
        </div>
        <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部来源</option>
          <option value="manual">手动录入</option>
          <option value="import">批量导入</option>
          <option value="scrape">公开采集</option>
        </select>
        <select value={filterIndustry} onChange={(e) => { setFilterIndustry(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部行业</option>
          {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
          <option value="">全部状态</option>
          <option value="active">在营</option>
          <option value="inactive">暂停</option>
          <option value="closed">已关闭</option>
        </select>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground mb-1">门店总数</div>
          <div className="text-2xl font-bold text-primary">{total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground mb-1">在营门店</div>
          <div className="text-2xl font-bold text-green-600">{stores.filter(s => s.status === "active").length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground mb-1">手动录入</div>
          <div className="text-2xl font-bold text-blue-600">{stores.filter(s => s.source === "manual").length}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="text-xs text-muted-foreground mb-1">批量导入</div>
          <div className="text-2xl font-bold text-purple-600">{stores.filter(s => s.source === "import").length}</div>
        </div>
      </div>

      {/* 表格 */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" /><p className="text-muted-foreground">加载中...</p></div>
      ) : stores.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <StoreIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-muted-foreground">暂无门店数据，点击"新增门店"或"批量导入"开始</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">店名</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">手机号</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">联系人</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">行业</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">来源</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">联系人</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">最近跟进</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stores.map((store) => (
                    <tr key={store.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-accent flex-shrink-0" />
                          <div>
                            <div className="font-medium text-primary text-sm">{store.name}</div>
                            {store.address && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{store.address}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm"><Phone className="w-3 h-3 inline mr-1 text-muted-foreground" />{store.owner_phone}</td>
                      <td className="px-4 py-3 text-sm">{store.owner_name || "-"}</td>
                      <td className="px-4 py-3 text-sm">{store.industry || "-"}</td>
                      <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{SOURCE_MAP[store.source] || store.source}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[store.status]}`}>{STATUS_MAP[store.status]}</span></td>
                      <td className="px-4 py-3 text-sm">{store.contact_count || 0}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{store.latest_follow_up_at ? new Date(store.latest_follow_up_at).toLocaleDateString("zh-CN") : "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setShowDetail(store)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg" title="详情"><Eye className="w-4 h-4" /></button>
                          <Link href={`/admin/crm/contacts?storeId=${store.id}`} className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="联系人"><Phone className="w-4 h-4" /></Link>
                          <button onClick={() => handleEdit(store)} className="p-2 text-gray-600 hover:text-accent hover:bg-accent/10 rounded-lg" title="编辑"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(store.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg" title="删除"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">共 {total} 条，第 {page}/{totalPages} 页</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 门店详情抽屉 */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">门店详情</h2>
              <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-accent" /></div>
                <div>
                  <h3 className="text-xl font-bold text-primary">{showDetail.name}</h3>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[showDetail.status]}`}>{STATUS_MAP[showDetail.status]}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">手机号：</span><span className="font-medium">{showDetail.owner_phone}</span></div>
                <div><span className="text-muted-foreground">联系人：</span><span className="font-medium">{showDetail.owner_name || "-"}</span></div>
                <div><span className="text-muted-foreground">行业：</span><span className="font-medium">{showDetail.industry || "-"}</span></div>
                <div><span className="text-muted-foreground">来源：</span><span className="font-medium">{SOURCE_MAP[showDetail.source]}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">地址：</span><span className="font-medium">{showDetail.address || "-"}</span></div>
                {showDetail.landline && <div><span className="text-muted-foreground">座机：</span><span className="font-medium">{showDetail.landline}</span></div>}
                {showDetail.email && <div><span className="text-muted-foreground">邮箱：</span><span className="font-medium">{showDetail.email}</span></div>}
                {showDetail.business_hours && <div className="col-span-2"><span className="text-muted-foreground">营业时间：</span><span className="font-medium">{showDetail.business_hours}</span></div>}
                {showDetail.business_scope && <div className="col-span-2"><span className="text-muted-foreground">经营范围：</span><span className="font-medium">{showDetail.business_scope}</span></div>}
              </div>
              {showDetail.tags && showDetail.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">{showDetail.tags.map(t => <span key={t} className="px-2 py-1 bg-accent/10 text-accent rounded-md text-xs">{t}</span>)}</div>
              )}
              {showDetail.notes && (
                <div><div className="text-xs text-muted-foreground mb-1">备注</div><div className="bg-gray-50 rounded-lg p-3 text-sm">{showDetail.notes}</div></div>
              )}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Link href={`/admin/crm/contacts?storeId=${showDetail.id}`} className="btn-primary flex-1 text-center">管理联系人</Link>
                <Link href={`/admin/crm/follow-ups?storeId=${showDetail.id}`} className="btn-secondary flex-1 text-center">跟进记录</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增/编辑门店弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">{editingStore ? "编辑门店" : "新增门店"}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">店名 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm" placeholder="门店名称" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">手机号 <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.owner_phone} onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm" placeholder="老板手机号（必填）" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">联系人姓名</label>
                  <input type="text" value={formData.owner_name} onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm" placeholder="老板/负责人姓名" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">行业</label>
                  <select value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm">
                    {INDUSTRY_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">地址</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm" placeholder="门店地址" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">座机</label>
                  <input type="text" value={formData.landline} onChange={(e) => setFormData({ ...formData, landline: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="座机号码" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">邮箱</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="邮箱" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">营业时间</label>
                  <input type="text" value={formData.business_hours} onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="如 9:00-21:00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">状态</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <option value="active">在营</option>
                    <option value="inactive">暂停</option>
                    <option value="closed">已关闭</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">经营范围</label>
                <input type="text" value={formData.business_scope} onChange={(e) => setFormData({ ...formData, business_scope: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="如：女装、连衣裙、外套" />
              </div>
              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">标签</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-md text-xs">
                      {t}<button type="button" onClick={() => removeTag(t)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" placeholder="输入标签后回车" />
                  <button type="button" onClick={addTag} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">添加</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">备注</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm resize-none" placeholder="备注信息" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4" />{editingStore ? "保存修改" : "创建门店"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 批量导入弹窗 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">批量导入门店</h2>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">导入格式说明</p>
                <p>每行一条门店数据，字段之间用逗号或Tab分隔：</p>
                <code className="block mt-2 bg-white px-3 py-2 rounded text-xs">店名,手机号(必填),地址,联系人,行业</code>
                <p className="mt-2 text-xs text-blue-600">第一行如果是表头会自动跳过</p>
              </div>
              <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2 text-sm">
                <Download className="w-4 h-4" /> 下载导入模板
              </button>
              <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={10}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono resize-none"
                placeholder="粘贴数据到此处，每行一条..." />
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowImportModal(false)} className="btn-secondary">取消</button>
                <button onClick={handleImport} disabled={importing} className="btn-primary flex items-center gap-2">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? "导入中..." : "开始导入"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

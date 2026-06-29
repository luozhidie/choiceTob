"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, Plus, Trash2, Edit2, Search, CheckCircle, Clock, Send } from "lucide-react";

const PLATFORMS = ["小红书", "微信公众号", "抖音", "微博", "其他"];
const CONTENT_TYPES = ["新品预告", "穿搭指南", "变装视频", "客户案例", "促销海报", "品牌故事"];
const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft:       { label: "草稿", color: "text-gray-600",  bg: "bg-gray-100", icon: Edit2 },
  scheduled:   { label: "已排期", color: "text-blue-600", bg: "bg-blue-100", icon: Clock },
  published:   { label: "已发布", color: "text-green-600", bg: "bg-green-100", icon: Send },
};

interface Post {
  id?: string;
  store_id: string;
  post_date: string;
  platform: string;
  content_type: string;
  title: string;
  notes?: string;
  status: string;
  performance_notes?: string;
}

export default function ContentCalendarPage() {
  const supabase = createClient();
  const [storeId, setStoreId] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Post | null>(null);
  const [search, setSearch] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    post_date: new Date().toISOString().slice(0, 10),
    platform: "小红书",
    content_type: "新品预告",
    title: "",
    notes: "",
    status: "draft",
    performance_notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("stores").select("id, name").order("name");
      setStores(data || []);
      if (data?.[0]) setStoreId(data[0].id);
    })();
  }, []);

  const load = async () => {
    if (!storeId) return;
    const { data } = await supabase.from("content_calendar").select("*").eq("store_id", storeId).order("post_date");
    setPosts(data || []);
  };
  useEffect(() => { load(); }, [storeId]);

  const save = async () => {
    if (!form.title.trim()) { alert("请填写标题"); return; }
    const payload = { store_id: storeId, ...form };
    if (editing?.id) await supabase.from("content_calendar").update(payload).eq("id", editing.id);
    else await supabase.from("content_calendar").insert(payload);
    setShowForm(false); setEditing(null);
    resetForm(); load();
  };

  const del = async (id: string) => {
    if (!confirm("确定删除？")) return;
    await supabase.from("content_calendar").delete().eq("id", id);
    load();
  };

  const resetForm = () => setForm({
    post_date: new Date().toISOString().slice(0, 10),
    platform: "小红书", content_type: "新品预告",
    title: "", notes: "", status: "draft", performance_notes: "",
  });

  const openEdit = (p: Post) => {
    setForm({
      post_date: p.post_date, platform: p.platform, content_type: p.content_type,
      title: p.title, notes: p.notes || "", status: p.status,
      performance_notes: p.performance_notes || "",
    });
    setEditing(p); setShowForm(true);
  };

  const filtered = posts.filter(p => {
    const m = p.title.includes(search) || p.notes?.includes(search);
    return m && (filterPlatform ? p.platform === filterPlatform : true) && (filterStatus ? p.status === filterStatus : true);
  });

  const stats = {
    total: posts.length,
    draft: posts.filter(p => p.status === "draft").length,
    scheduled: posts.filter(p => p.status === "scheduled").length,
    published: posts.filter(p => p.status === "published").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6"><div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">内容日历</h1>
          <p className="text-sm text-gray-500 mt-1">内容排期管理 · 小红书 / 微信 / 抖音</p>
        </div>
        <div className="flex gap-3">
          <select value={storeId} onChange={e => setStoreId(e.target.value)} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm">
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> 新建排期
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "全部内容", value: stats.total, color: "text-gray-800", bg: "bg-white" },
          { label: "草稿", value: stats.draft, color: "text-gray-600", bg: "bg-gray-100" },
          { label: "已排期", value: stats.scheduled, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "已发布", value: stats.published, color: "text-green-600", bg: "bg-green-50" },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl shadow-sm border border-gray-100 p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-4">
        <Search className="w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索标题或备注..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="">全部平台</option>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm"><option value="">全部状态</option>{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
      </div>

      {/* 弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-bold mb-4">{editing ? "编辑" : "新建"}内容排期</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">发布日期</label>
                  <input type="date" value={form.post_date} onChange={e => setForm({ ...form, post_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">平台</label>
                  <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">内容类型</label>
                  <select value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">{CONTENT_TYPES.map(c => <option key={c}>{c}</option>)}</select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">状态</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">{Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">标题 *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="内容标题" />
              </div>
              <div>
                <label className="text-xs text-gray-500">备注</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="可选" />
              </div>
              {form.status === "published" && (
                <div>
                  <label className="text-xs text-gray-500">发布表现（阅读/点赞/转化等）</label>
                  <textarea value={form.performance_notes} onChange={e => setForm({ ...form, performance_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="可选" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">保存</button>
                <button onClick={() => { setShowForm(false); setEditing(null); }} className="flex-1 py-2.5 bg-gray-200 rounded-xl text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 数据表格 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-3 text-left">发布日期</th>
              <th className="p-3 text-left">平台</th>
              <th className="p-3 text-left">类型</th>
              <th className="p-3 text-left">标题</th>
              <th className="p-3 text-center">状态</th>
              <th className="p-3 text-left">表现</th>
              <th className="p-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const s = STATUS_MAP[p.status] || STATUS_MAP.draft;
              return (
                <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{p.post_date}</td>
                  <td className="p-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{p.platform}</span></td>
                  <td className="p-3 text-gray-600">{p.content_type}</td>
                  <td className="p-3 font-semibold">{p.title}</td>
                  <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.bg} ${s.color}`}>{s.label}</span></td>
                  <td className="p-3 text-xs text-gray-500 max-w-xs truncate">{p.performance_notes || "—"}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-800 mr-3 text-xs">编辑</button>
                    <button onClick={() => del(p.id!)} className="text-red-500 hover:text-red-700 text-xs">删除</button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">暂无数据</td></tr>}
          </tbody>
        </table>
      </div>
    </div></div>
  );
}

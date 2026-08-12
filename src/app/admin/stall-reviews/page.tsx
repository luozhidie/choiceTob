"use client";

import { useEffect, useState } from "react";
import { Plus, Edit3, Trash2, Save, X, Star, MessageSquare, Loader2 } from "lucide-react";

interface Review {
  id: string;
  stall_id: string;
  user_name?: string | null;
  content?: string | null;
  rating?: number;
  created_at: string;
  peer_stalls?: { name: string } | null;
}

interface StallOpt { id: string; name: string; }

const EMPTY = { stall_id: "", user_name: "", content: "", rating: 5 };

export default function StallReviewsAdmin() {
  const [list, setList] = useState<Review[]>([]);
  const [stalls, setStalls] = useState<StallOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStall, setFilterStall] = useState("");
  const [form, setForm] = useState<any>({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/stall-reviews" + (filterStall ? "?stall_id=" + filterStall : ""), { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setList(j.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/admin/stalls", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setStalls((j.data || []).map((s: any) => ({ id: s.id, name: s.name }))); })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [filterStall]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  };

  const openEdit = (rv: Review) => {
    setEditingId(rv.id);
    setForm({
      stall_id: rv.stall_id || "",
      user_name: rv.user_name || "",
      content: rv.content || "",
      rating: rv.rating ?? 5,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.stall_id) { alert("请选择所属档口"); return; }
    if (!form.content || !form.content.trim()) { alert("请输入评价内容"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stall-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editingId || undefined, ...form }),
      });
      const j = await res.json();
      if (j.success) { setShowForm(false); load(); }
      else alert("保存失败：" + (j.error || ""));
    } catch (e: any) { alert("保存失败：" + e.message); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("确认删除该评价？")) return;
    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "stall_reviews" }),
      });
      const j = await res.json();
      if (j.success) load();
      else alert("删除失败：" + (j.error || ""));
    } catch (e: any) { alert("删除失败：" + e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> 档口评价管理
        </h1>
        {!showForm && (
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> 新增评价
          </button>
        )}
      </div>

      {/* 按档口筛选 */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-gray-500">按档口筛选：</label>
        <select value={filterStall}
          onChange={(e) => setFilterStall(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white">
          <option value="">全部档口</option>
          {stalls.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">{editingId ? "编辑评价" : "新增评价"}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">所属档口 *</label>
              <select value={form.stall_id}
                onChange={(e) => setForm({ ...form, stall_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none bg-white">
                <option value="">请选择档口</option>
                {stalls.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">评价人昵称（留空为「匿名买手」）</label>
              <input value={form.user_name}
                onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                placeholder="如：广州-张姐"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">评分（0-5）</label>
              <input type="number" step="0.1" min="0" max="5" value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">评价内容 *</label>
              <textarea value={form.content} rows={3}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="如：版型正、发货快、客服靠谱，老顾客返单多"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none" />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">取消</button>
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 保存
            </button>
          </div>
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">加载中…</div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">暂无评价，点击右上角新增</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3">档口</th>
                <th className="text-left px-4 py-3">评价人</th>
                <th className="text-left px-4 py-3">评分</th>
                <th className="text-left px-4 py-3">内容</th>
                <th className="text-left px-4 py-3">时间</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((rv) => (
                <tr key={rv.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-800">{rv.peer_stalls?.name || rv.stall_id || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{rv.user_name || "匿名买手"}</td>
                  <td className="px-4 py-3 text-gray-600 flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {rv.rating ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[260px]">
                    <span className="line-clamp-2">{rv.content}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{(rv.created_at || "").slice(0, 10)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(rv)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit3 className="w-4 h-4 inline" /> 编辑
                    </button>
                    <button onClick={() => remove(rv.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4 inline" /> 删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

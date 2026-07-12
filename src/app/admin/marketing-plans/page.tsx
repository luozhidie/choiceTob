"use client";

import { useEffect, useState } from "react";

interface Plan {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function AdminMarketingPlansPage() {
  const [list, setList] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ title: "", description: "", price: 0, image_url: "", is_active: true, sort_order: 0 });
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2500);
  };

  const api = (url: string, opts?: RequestInit) =>
    fetch(url, { credentials: "include", ...opts }).then((r) => r.json());

  const load = async () => {
    setLoading(true);
    const data = await api("/api/admin/marketing-plans");
    setList(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", price: 0, image_url: "", is_active: true, sort_order: 0 });
    setShowForm(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description || "", price: p.price, image_url: p.image_url || "", is_active: p.is_active, sort_order: p.sort_order });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return showToast("请填写标题");
    const payload = { ...form, price: Number(form.price) || 0, sort_order: Number(form.sort_order) || 0 };
    if (editing) {
      await api("/api/admin/marketing-plans", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
    } else {
      await api("/api/admin/marketing-plans", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false);
    showToast("已保存");
    load();
  };

  const del = async (id: string) => {
    if (!confirm("确定删除该方案？")) return;
    await api("/api/admin/marketing-plans?delete&id=" + id, { method: "DELETE" });
    showToast("已删除");
    load();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">营销方案管理</h1>
        <button onClick={openAdd} className="bg-[#2d1b2e] text-white px-4 py-2 rounded-lg">+ 新增方案</button>
      </div>

      {loading ? (
        <div className="text-gray-400">加载中…</div>
      ) : (
        <div className="grid gap-4">
          {list.map((p) => (
            <div key={p.id} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
              <img src={p.image_url || "/placeholder.png"} alt="" className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
              <div className="flex-1">
                <div className="font-semibold text-lg">{p.title}</div>
                <div className="text-sm text-gray-500 line-clamp-1">{p.description}</div>
                <div className="text-sm text-[#C9A24B] font-semibold mt-1">¥{p.price}</div>
              </div>
              <button onClick={() => openEdit(p)} className="text-sm text-gray-600 px-3 py-1 border rounded">编辑</button>
              <button onClick={() => del(p.id)} className="text-sm text-red-500 px-3 py-1 border rounded">删除</button>
            </div>
          ))}
          {list.length === 0 && <div className="text-gray-400">暂无方案。</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editing ? "编辑方案" : "新增方案"}</h2>
            <label className="block text-sm mb-1">标题 *</label>
            <input className="w-full border rounded-lg px-3 py-2 mb-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <label className="block text-sm mb-1">描述</label>
            <textarea className="w-full border rounded-lg px-3 py-2 mb-3 h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="block text-sm mb-1">价格</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2 mb-3" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <label className="block text-sm mb-1">图片 URL</label>
            <input className="w-full border rounded-lg px-3 py-2 mb-3" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            <label className="block text-sm mb-1">排序</label>
            <input type="number" className="w-full border rounded-lg px-3 py-2 mb-3" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
            <label className="flex items-center gap-2 mb-4">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
              <span className="text-sm">前台展示</span>
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border">取消</button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-[#C9A24B] text-[#2d1b2e] font-semibold">保存</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-lg z-[60]">{toast}</div>}
    </div>
  );
}

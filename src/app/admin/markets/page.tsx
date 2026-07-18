"use client";

import { useEffect, useState } from "react";
import {
  Plus, Edit3, Trash2, Save, X, Upload, Loader2, Store,
} from "lucide-react";

interface Market {
  id: string;
  name: string;
  location?: string | null;
  cover_image?: string | null;
  avatar?: string | null;
  intro?: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

const EMPTY = {
  name: "",
  location: "",
  cover_image: "",
  avatar: "",
  intro: "",
  is_published: false,
  sort_order: 0,
};

export default function MarketsAdmin() {
  const [list, setList] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/markets", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => { if (j.success) setList(j.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  };

  const openEdit = (m: Market) => {
    setEditingId(m.id);
    setForm({
      name: m.name || "",
      location: m.location || "",
      cover_image: m.cover_image || "",
      avatar: m.avatar || "",
      intro: m.intro || "",
      is_published: m.is_published,
      sort_order: m.sort_order || 0,
    });
    setShowForm(true);
  };

  const uploadImage = async (file: File, field: "avatar" | "cover_image") => {
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "stalls");
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const j = await res.json();
      if (j.url) setForm((f: any) => ({ ...f, [field]: j.url }));
      else alert("上传失败：" + (j.error || "未知错误"));
    } catch (e: any) {
      alert("上传失败：" + e.message);
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!form.name) { alert("请填写市场名称"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: editingId || undefined, ...form }),
      });
      const j = await res.json();
      if (j.success) {
        setShowForm(false);
        load();
      } else alert("保存失败：" + (j.error || "未知错误"));
    } catch (e: any) {
      alert("保存失败：" + e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("确认删除该市场？")) return;
    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "markets" }),
      });
      const j = await res.json();
      if (j.success) load();
      else alert("删除失败：" + (j.error || ""));
    } catch (e: any) {
      alert("删除失败：" + e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" /> 市场/商圈管理
        </h1>
        {!showForm && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> 新增市场
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">
              {editingId ? "编辑市场" : "新增市场"}
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">市场名称 *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：十三行 / 沙河 / 杭州"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">所在地区</label>
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="如：广州市荔湾区"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">圆形头像</label>
              <div className="flex items-center gap-2">
                {form.avatar && (
                  <img src={form.avatar} alt="" className="w-12 h-12 rounded-full object-cover border" />
                )}
                <input
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  placeholder="图片 URL（或上传）"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                />
                <label className="relative cursor-pointer px-2 py-2 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200">
                  {uploading === "avatar" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">市场头图</label>
              <div className="flex items-center gap-2">
                {form.cover_image && (
                  <img src={form.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                )}
                <input
                  value={form.cover_image}
                  onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                  placeholder="图片 URL（或上传）"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
                />
                <label className="relative cursor-pointer px-2 py-2 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200">
                  {uploading === "cover_image" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover_image")} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">排序</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                id="mkt-pub"
              />
              <label htmlFor="mkt-pub" className="text-sm text-gray-600">发布（勾选后前端可见）</label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">特色介绍</label>
              <textarea
                value={form.intro}
                onChange={(e) => setForm({ ...form, intro: e.target.value })}
                rows={3}
                placeholder="市场定位、特色、拿货建议…"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              取消
            </button>
            <button onClick={save} disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存
            </button>
          </div>
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">加载中…</div>
      ) : list.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">暂无市场，点击右上角新增</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3">头像</th>
                <th className="text-left px-4 py-3">名称</th>
                <th className="text-left px-4 py-3">地区</th>
                <th className="text-left px-4 py-3">状态</th>
                <th className="text-left px-4 py-3">排序</th>
                <th className="text-right px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    {m.avatar
                      ? <img src={m.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : <span className="w-9 h-9 rounded-full bg-gray-100 inline-block" />}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.location || "-"}</td>
                  <td className="px-4 py-3">
                    {m.is_published
                      ? <span className="text-green-600 text-xs">已发布</span>
                      : <span className="text-gray-400 text-xs">草稿</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.sort_order}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(m)} className="text-blue-600 hover:text-blue-800 mr-3">
                      <Edit3 className="w-4 h-4 inline" /> 编辑
                    </button>
                    <button onClick={() => remove(m.id)} className="text-red-500 hover:text-red-700">
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

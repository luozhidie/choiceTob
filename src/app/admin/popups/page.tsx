"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus, Edit3, Trash2, Eye, EyeOff, Loader2, X, Save, Image as ImageIcon, Link as LinkIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Popup {
  id: string;
  title: string;
  keywords: string | null;
  image_url: string | null;
  link_url: string | null;
  show_on_home: boolean;
  is_published: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function PopupsAdminPage() {
  const supabase = createClient();
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    keywords: "",
    image_url: "",
    link_url: "",
    show_on_home: false,
    is_published: false,
    start_at: "",
    end_at: "",
  });

  const fetchPopups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/popups", { credentials: "include" });
      const json = await res.json();
      if (json.success && json.data) setPopups(json.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPopups(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", keywords: "", image_url: "", link_url: "", show_on_home: false, is_published: false, start_at: "", end_at: "" });
    setShowForm(true);
  };

  const openEdit = (p: Popup) => {
    setEditing(p);
    setForm({
      title: p.title,
      keywords: p.keywords || "",
      image_url: p.image_url || "",
      link_url: p.link_url || "",
      show_on_home: p.show_on_home,
      is_published: p.is_published,
      start_at: p.start_at ? p.start_at.slice(0, 16) : "",
      end_at: p.end_at ? p.end_at.slice(0, 16) : "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const body: any = {
        title: form.title,
        keywords: form.keywords || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        show_on_home: form.show_on_home,
        is_published: form.is_published,
        start_at: form.start_at ? new Date(form.start_at).toISOString() : null,
        end_at: form.end_at ? new Date(form.end_at).toISOString() : null,
      };
      if (editing) body.id = editing.id;

      const res = await fetch("/api/admin/popups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "保存失败");
      await fetchPopups();
      setShowForm(false);
    } catch (e: any) {
      alert("保存失败：" + e.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除该弹窗？")) return;
    try {
      await fetch(`/api/admin/popups?id=${id}`, { method: "DELETE", credentials: "include" });
      await fetchPopups();
    } catch (e) { alert("删除失败"); }
  };

  const togglePublish = async (p: Popup) => {
    try {
      await fetch("/api/admin/popups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: p.id, title: p.title, is_published: !p.is_published }),
      });
      await fetchPopups();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              📢 弹窗管理
            </h1>
            <p className="text-gray-500 mt-1">配置首页弹窗，支持图片+关键词，勾选"首页弹窗"后生效</p>
          </div>
          <button
            onClick={openNew}
            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> 新建弹窗
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        ) : (
          <div className="space-y-4">
            {popups.map((p) => (
              <div key={p.id} className={`bg-white rounded-xl border p-4 flex items-center gap-4 ${p.is_published ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
                <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                    {p.show_on_home && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">首页弹窗</span>
                    )}
                    {!p.is_published && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">未发布</span>
                    )}
                  </div>
                  {p.keywords && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.keywords}</p>}
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    {p.start_at && <span>开始：{new Date(p.start_at).toLocaleDateString()}</span>}
                    {p.end_at && <span>结束：{new Date(p.end_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePublish(p)} className={`p-2 rounded-lg ${p.is_published ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}>
                    {p.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {popups.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无弹窗</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editing ? "编辑弹窗" : "新建弹窗"}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">弹窗标题 *</label>
                  <input
                    type="text" value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="如：新品上市、限时优惠"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </div>

                {/* 关键词内容 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">关键词内容</label>
                  <textarea
                    value={form.keywords}
                    onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    placeholder="每行一个关键词，或输入弹窗展示的文字内容"
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm resize-none"
                  />
                </div>

                {/* 图片URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">弹窗图片 URL</label>
                  <input
                    type="text" value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                  {form.image_url && (
                    <div className="mt-2 rounded-lg overflow-hidden h-32 bg-gray-50">
                      <img src={form.image_url} alt="预览" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* 跳转链接 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">点击跳转链接（可选）</label>
                  <input
                    type="text" value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    placeholder="/buyer 或 https://..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                  />
                </div>

                {/* 有效期 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间（可选）</label>
                    <input
                      type="datetime-local" value={form.start_at}
                      onChange={(e) => setForm({ ...form, start_at: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">结束时间（可选）</label>
                    <input
                      type="datetime-local" value={form.end_at}
                      onChange={(e) => setForm({ ...form, end_at: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* 开关 */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={form.show_on_home} onChange={(e) => setForm({ ...form, show_on_home: e.target.checked })} className="w-4 h-4 text-primary rounded" />
                    <span className="text-sm text-gray-700">作为首页弹窗显示</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="w-4 h-4 text-primary rounded" />
                    <span className="text-sm text-gray-700">立即发布</span>
                  </label>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50">取消</button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</> : <><Save className="w-4 h-4" /> 保存</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

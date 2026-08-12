"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Inspiration {
  id: string;
  title: string;
  style_tags: string[] | null;
  is_published: boolean;
}

export default function AdminInspirationsPage() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInspiration, setEditingInspiration] = useState<Inspiration | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    style_tags: "",
    is_published: true,
  });

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 加载搭配灵感列表
  const fetchInspirations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("outfit_matches")
        .select("id, title, style_tags, is_published")
        .order("id", { ascending: false });
      if (error) throw error;
      setInspirations(data || []);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInspirations(); }, []);

  // 打开新增/编辑表单
  const openForm = (inspiration?: Inspiration) => {
    if (inspiration) {
      setEditingInspiration(inspiration);
      setForm({
        title: inspiration.title || "",
        style_tags: inspiration.style_tags?.join(", ") || "",
        is_published: inspiration.is_published,
      });
    } else {
      setEditingInspiration(null);
      setForm({ title: "", style_tags: "", is_published: true });
    }
    setShowForm(true);
  };

  // 关闭表单
  const closeForm = () => {
    setShowForm(false);
    setEditingInspiration(null);
    setForm({ title: "", style_tags: "", is_published: true });
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = form.style_tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: form.title,
        style_tags: tags.length > 0 ? tags : null,
        is_published: form.is_published,
      };

      let error;
      if (editingInspiration) {
        ({ error } = await supabase
          .from("outfit_matches")
          .update(payload)
          .eq("id", editingInspiration.id));
      } else {
        ({ error } = await supabase
          .from("outfit_matches")
          .insert([{ ...payload, product_ids: [], season_tags: null, occasion: null, match_rule_code: null }]));
      }

      if (error) throw error;
      showToast("success", editingInspiration ? "更新成功！" : "创建成功！");
      closeForm();
      fetchInspirations();
    } catch (err: any) {
      showToast("error", "操作失败：" + err.message);
    }
  };

  // 删除搭配灵感
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个搭配灵感吗？")) return;
    try {
      const res = await fetch("/api/admin/common/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, table: "outfit_matches" }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      showToast("success", "删除成功！");
      fetchInspirations();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    }
  };

  // 切换启用/禁用
  const togglePublished = async (inspiration: Inspiration) => {
    try {
      const { error } = await supabase
        .from("outfit_matches")
        .update({ is_published: !inspiration.is_published })
        .eq("id", inspiration.id);
      if (error) throw error;
      fetchInspirations();
    } catch (err: any) {
      showToast("error", "操作失败：" + err.message);
    }
  };

  return (
    <div className="min-h-screen">
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

      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">搭配灵感管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理首页搭配灵感，设置风格标签
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchInspirations}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
          <button
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-md shadow-accent/20"
          >
            <Plus className="w-4 h-4" />
            新增灵感
          </button>
        </div>
      </div>

      {/* 搭配灵感列表 */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent mb-4" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : inspirations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无搭配灵感</h3>
          <p className="text-sm text-muted-foreground mb-6">点击「新增灵感」开始添加搭配灵感</p>
          <button
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            新增灵感
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inspirations.map((inspiration, index) => (
            <motion.div
              key={inspiration.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* 占位图区域 */}
              <div className="relative h-32 bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-300" />
                {/* 状态标签 */}
                <div className="absolute top-3 right-3">
                  {inspiration.is_published ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-green-500 text-white font-medium">已发布</span>
                  ) : (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-gray-500 text-white font-medium">草稿</span>
                  )}
                </div>
              </div>

              {/* 内容 */}
              <div className="p-4">
                <h3 className="font-semibold text-primary mb-2 truncate">{inspiration.title}</h3>

                {/* 风格标签 */}
                {inspiration.style_tags && inspiration.style_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {inspiration.style_tags.map((tag, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <button
                    onClick={() => togglePublished(inspiration)}
                    className={`p-2 rounded-lg transition-colors ${inspiration.is_published ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                    title={inspiration.is_published ? "下架" : "发布"}
                  >
                    {inspiration.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openForm(inspiration)}
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="编辑"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(inspiration.id)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 新增/编辑表单弹窗 */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeForm}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-primary">
                  {editingInspiration ? "编辑搭配灵感" : "新增搭配灵感"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">标题 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                    placeholder="搭配灵感标题"
                    required
                  />
                </div>

                {/* 风格标签 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">风格标签</label>
                  <input
                    type="text"
                    value={form.style_tags}
                    onChange={(e) => setForm((prev) => ({ ...prev, style_tags: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                    placeholder="用逗号分隔，如：休闲, 通勤, 简约"
                  />
                </div>

                {/* 发布状态 */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_published}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_published: e.target.checked }))}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30"
                    />
                    <span className="text-sm text-primary">发布（显示在首页）</span>
                  </label>
                </div>

                {/* 按钮 */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="px-5 py-2.5 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-medium text-white bg-accent rounded-lg hover:brightness-110 transition-all shadow-md shadow-accent/20"
                  >
                    {editingInspiration ? "保存修改" : "创建灵感"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

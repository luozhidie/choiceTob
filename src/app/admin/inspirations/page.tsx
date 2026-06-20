"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Image as ImageIcon,
  Upload,
  Eye,
  EyeOff,
  Tags,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Inspiration {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  style_tags: string[] | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminInspirationsPage() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInspiration, setEditingInspiration] = useState<Inspiration | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    style_tags: "",
    is_published: true,
  });

  const supabase = createClient();
  const router = useRouter();

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
        .select("id, title, description, image_url, style_tags, is_published, created_at, updated_at")
        .order("created_at", { ascending: false });
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
        description: inspiration.description || "",
        image_url: inspiration.image_url || "",
        style_tags: inspiration.style_tags?.join(", ") || "",
        is_published: inspiration.is_published,
      });
    } else {
      setEditingInspiration(null);
      setForm({ title: "", description: "", image_url: "", style_tags: "", is_published: true });
    }
    setShowForm(true);
  };

  // 关闭表单
  const closeForm = () => {
    setShowForm(false);
    setEditingInspiration(null);
    setForm({ title: "", description: "", image_url: "", style_tags: "", is_published: true });
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
        description: form.description || null,
        image_url: form.image_url || null,
        style_tags: tags.length > 0 ? tags : null,
        is_published: form.is_published,
        updated_at: new Date().toISOString(),
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
      const { error } = await supabase.from("outfit_matches").delete().eq("id", id);
      if (error) throw error;
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
        .update({ is_published: !inspiration.is_published, updated_at: new Date().toISOString() })
        .eq("id", inspiration.id);
      if (error) throw error;
      fetchInspirations();
    } catch (err: any) {
      showToast("error", "操作失败：" + err.message);
    }
  };

  // 上传图片
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "图片不能超过 10MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `inspirations/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(fileName, file);
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
      showToast("success", "上传成功！");
    } catch (err: any) {
      showToast("error", "上传失败：" + err.message);
    } finally {
      setUploading(false);
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
            管理首页搭配灵感，支持上传图片、设置风格标签
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
              {/* 图片 */}
              <div className="relative h-48 bg-gray-100">
                {inspiration.image_url ? (
                  <img src={inspiration.image_url} alt={inspiration.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
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
                <h3 className="font-semibold text-primary mb-1 truncate">{inspiration.title}</h3>
                {inspiration.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{inspiration.description}</p>
                )}

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

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">描述</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm resize-none"
                    rows={3}
                    placeholder="搭配灵感描述（可选）"
                  />
                </div>

                {/* 图片上传 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">图片</label>
                  <div className="space-y-3">
                    {form.image_url && (
                      <div className="w-full h-40 rounded-lg overflow-hidden bg-gray-100">
                        <img src={form.image_url} alt="预览" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                            e.target.value = "";
                          }}
                          disabled={uploading}
                          className="hidden"
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {uploading ? "上传中..." : "上传图片"}
                        </span>
                      </label>
                      <span className="text-xs text-muted-foreground">或</span>
                      <input
                        type="text"
                        value={form.image_url}
                        onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                        className="flex-1 px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                        placeholder="输入图片 URL"
                      />
                    </div>
                  </div>
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

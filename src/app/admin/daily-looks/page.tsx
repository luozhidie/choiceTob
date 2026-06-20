"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Upload, X, Trash2, Eye, Plus, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DailyLook {
  id: string;
  title: string;
  colors: string[];
  image_url: string | null;
  style: string;
  description: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

export default function AdminDailyLooksPage() {
  const [looks, setLooks] = useState<DailyLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    colors: "",
    style: "",
    description: "",
    image_url: "",
    sort_order: 0,
  });

  const supabase = createClient();
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_looks")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setLooks((data || []).map((d: any) => ({
        ...d,
        colors: Array.isArray(d.colors) ? d.colors : JSON.parse(d.colors || "[]"),
      })));
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLooks(); }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("error", "图片不能超过5MB"); return; }
    setUploading(true);
    try {
      const fileName = `daily-looks/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("daily-looks").upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("daily-looks").getPublicUrl(fileName);
      setFormData(f => ({ ...f, image_url: urlData.publicUrl }));
      showToast("success", "图片上传成功");
    } catch (err: any) {
      showToast("error", "上传失败：" + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.style.trim()) {
      showToast("error", "标题和风格必填");
      return;
    }
    setSaving(true);
    try {
      const colorsArr = formData.colors.split(",").map(c => c.trim()).filter(Boolean);
      const payload = {
        title: formData.title,
        colors: colorsArr,
        style: formData.style,
        description: formData.description || null,
        image_url: formData.image_url || null,
        sort_order: formData.sort_order,
        is_published: true,
      };
      const { error } = await supabase.from("daily_looks").insert([payload]);
      if (error) throw error;
      showToast("success", "添加成功");
      setShowForm(false);
      setFormData({ title: "", colors: "", style: "", description: "", image_url: "", sort_order: 0 });
      fetchLooks();
    } catch (err: any) {
      showToast("error", "保存失败：" + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此搭配？")) return;
    try {
      const { error } = await supabase.from("daily_looks").delete().eq("id", id);
      if (error) throw error;
      showToast("success", "已删除");
      fetchLooks();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    }
  };

  const handleTogglePublish = async (look: DailyLook) => {
    try {
      const { error } = await supabase
        .from("daily_looks")
        .update({ is_published: !look.is_published })
        .eq("id", look.id);
      if (error) throw error;
      fetchLooks();
    } catch (err: any) {
      showToast("error", "更新失败：" + err.message);
    }
  };

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

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">每日搭配灵感管理</h1>
            <p className="text-sm text-muted-foreground mt-1">上传实物搭配照片，管理前台展示内容</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "取消" : "新增搭配"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6"
          >
            <h3 className="font-bold text-primary mb-4">新增搭配方案</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">搭配名称</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="例如：暖杏+咖啡"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">风格标签</label>
                <input
                  type="text"
                  value={formData.style}
                  onChange={(e) => setFormData(f => ({ ...f, style: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="例如：温柔知性"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">色值（逗号分隔，如 #D4A574,#8B6914,#F5E6D3）</label>
                <input
                  type="text"
                  value={formData.colors}
                  onChange={(e) => setFormData(f => ({ ...f, colors: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="#D4A574,#8B6914,#F5E6D3"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">排序</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="适合职场通勤，显白提气色"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">实物搭配照片</label>
                {formData.image_url ? (
                  <div className="relative inline-block">
                    <img src={formData.image_url} alt="preview" className="w-32 h-24 object-cover rounded-lg" />
                    <button
                      onClick={() => setFormData(f => ({ ...f, image_url: "" }))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">点击上传实物搭配照片</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
          </div>
        ) : looks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm bg-white rounded-2xl">暂无搭配方案</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {looks.map((look) => (
              <div key={look.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                {look.image_url ? (
                  <div className="relative aspect-[4/3]">
                    <img src={look.image_url} alt={look.title} className="w-full h-full object-cover" />
                    <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                      {look.colors.map((c: string) => (
                        <div key={c} className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    {!look.is_published && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded">未发布</div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50">
                    <div className="flex gap-1.5 mb-2">
                      {look.colors.map((c: string) => (
                        <div key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="p-3">
                  <h3 className="text-sm font-bold text-primary">{look.title}</h3>
                  <p className="text-xs text-accent mt-0.5">{look.style}</p>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{look.description}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <button
                      onClick={() => handleTogglePublish(look)}
                      className={`text-[10px] px-2 py-1 rounded ${look.is_published ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      {look.is_published ? "已发布" : "未发布"}
                    </button>
                    <button onClick={() => handleDelete(look.id)} className="p-1 text-red-400 hover:text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

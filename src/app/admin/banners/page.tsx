"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Upload,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Banner {
  id: string;
  key: string;
  image_url: string | null;
  title: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    sort_order: "0",
    is_active: true,
  });

  const supabase = createClient();
  const router = useRouter();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 加载 Banner 列表
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_assets")
        .select("*")
        .like("key", "home_banner%")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setBanners(data || []);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBanners(); }, []);

  // 打开新增/编辑表单
  const openForm = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setForm({
        title: banner.title || "",
        image_url: banner.image_url || "",
        link_url: banner.link_url || "",
        sort_order: String(banner.sort_order),
        is_active: banner.is_active,
      });
    } else {
      setEditingBanner(null);
      setForm({ title: "", image_url: "", link_url: "", sort_order: String(banners.length), is_active: true });
    }
    setShowForm(true);
  };

  // 关闭表单
  const closeForm = () => {
    setShowForm(false);
    setEditingBanner(null);
    setForm({ title: "", image_url: "", link_url: "", sort_order: "0", is_active: true });
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title || null,
        image_url: form.image_url || null,
        link_url: form.link_url || null,
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (editingBanner) {
        ({ error } = await supabase
          .from("site_assets")
          .update(payload)
          .eq("id", editingBanner.id));
      } else {
        const key = `home_banner_${Date.now()}`;
        ({ error } = await supabase
          .from("site_assets")
          .insert([{ ...payload, key, image_url: payload.image_url || "" }]));
      }

      if (error) throw error;
      showToast("success", editingBanner ? "更新成功！" : "创建成功！");
      closeForm();
      fetchBanners();
    } catch (err: any) {
      showToast("error", "操作失败：" + err.message);
    }
  };

  // 删除 Banner
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个 Banner 吗？")) return;
    try {
      const { error } = await supabase.from("site_assets").delete().eq("id", id);
      if (error) throw error;
      showToast("success", "删除成功！");
      fetchBanners();
    } catch (err: any) {
      showToast("error", "删除失败：" + err.message);
    }
  };

  // 切换启用/禁用
  const toggleActive = async (banner: Banner) => {
    try {
      const { error } = await supabase
        .from("site_assets")
        .update({ is_active: !banner.is_active, updated_at: new Date().toISOString() })
        .eq("id", banner.id);
      if (error) throw error;
      fetchBanners();
    } catch (err: any) {
      showToast("error", "操作失败：" + err.message);
    }
  };

  // 排序调整
  const moveBanner = async (index: number, direction: "up" | "down") => {
    const newBanners = [...banners];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];

    // 更新 sort_order
    const updates = newBanners.map((b, i) => ({
      id: b.id,
      sort_order: i,
    }));

    try {
      for (const u of updates) {
        await supabase
          .from("site_assets")
          .update({ sort_order: u.sort_order, updated_at: new Date().toISOString() })
          .eq("id", u.id);
      }
      fetchBanners();
    } catch (err: any) {
      showToast("error", "排序失败：" + err.message);
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
      const fileName = `banners/${Date.now()}.${ext}`;
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
          <h1 className="text-2xl font-bold text-primary">Banner 轮播图管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理首页轮播图，支持上传、排序、启用/禁用
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchBanners}
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
            新增 Banner
          </button>
        </div>
      </div>

      {/* Banner 列表 */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent mb-4" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">暂无 Banner</h3>
          <p className="text-sm text-muted-foreground mb-6">点击「新增 Banner」开始添加首页轮播图</p>
          <button
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all"
          >
            <Plus className="w-4 h-4" />
            新增 Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              {/* 排序手柄 */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveBanner(index, "up")}
                  disabled={index === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => moveBanner(index, "down")}
                  disabled={index === banners.length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* 图片预览 */}
              <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {banner.image_url ? (
                  <img src={banner.image_url} alt={banner.title || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>

              {/* 信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-primary truncate">{banner.title || "未命名"}</h3>
                  {banner.is_active ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">启用</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">禁用</span>
                  )}
                </div>
                {banner.link_url && (
                  <p className="text-xs text-muted-foreground truncate">{banner.link_url}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-1">排序: {banner.sort_order}</p>
              </div>

              {/* 操作 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(banner)}
                  className={`p-2 rounded-lg transition-colors ${banner.is_active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                  title={banner.is_active ? "禁用" : "启用"}
                >
                  {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openForm(banner)}
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  title="编辑"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                  {editingBanner ? "编辑 Banner" : "新增 Banner"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">标题</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                    placeholder="Banner 标题（可选）"
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

                {/* 跳转链接 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">跳转链接</label>
                  <input
                    type="text"
                    value={form.link_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, link_url: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                    placeholder="点击 Banner 后跳转的链接（可选）"
                  />
                </div>

                {/* 排序 */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">排序</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 text-sm"
                    placeholder="数字越小越靠前"
                  />
                </div>

                {/* 启用状态 */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent/30"
                    />
                    <span className="text-sm text-primary">启用</span>
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
                    {editingBanner ? "保存修改" : "创建 Banner"}
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

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Banner {
  id: string;
  key: string;
  image_url: string;
  link_url: string | null;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function BannersAdminPage() {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // 加载轮播图配置
  const loadBanners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_assets")
        .select("*")
        .like("key", "hero_banner%")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      showToast("error", "加载失败：" + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  // 新增轮播图
  const addBanner = async () => {
    try {
      const newKey = `hero_banner_${Date.now()}`;
      const { data, error } = await supabase
        .from("site_assets")
        .insert({
          key: newKey,
          image_url: "",
          link_url: null,
          title: "",
          subtitle: "",
          sort_order: banners.length,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setBanners([...banners, data]);
      showToast("success", "已添加，请填写信息并上传图片");
    } catch (error: any) {
      showToast("error", "添加失败：" + error.message);
    }
  };

  // 更新轮播图
  const updateBanner = async (id: string, updates: Partial<Banner>) => {
    try {
      const { error } = await supabase
        .from("site_assets")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      setBanners(banners.map(b => b.id === id ? { ...b, ...updates } : b));
    } catch (error: any) {
      showToast("error", "更新失败：" + error.message);
    }
  };

  // 删除轮播图
  const deleteBanner = async (id: string) => {
    if (!confirm("确定要删除这张轮播图吗？")) return;
    try {
      const { error } = await supabase
        .from("site_assets")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setBanners(banners.filter(b => b.id !== id));
      showToast("success", "删除成功");
    } catch (error: any) {
      showToast("error", "删除失败：" + error.message);
    }
  };

  // 上传图片
  const uploadImage = async (bannerId: string, file: File) => {
    setSaving(true);
    try {
      const filePath = `banners/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("products")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      await updateBanner(bannerId, { image_url: urlData.publicUrl });
      showToast("success", "图片上传成功！");
    } catch (error: any) {
      showToast("error", "上传失败：" + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 上移/下移
  const moveBanner = async (index: number, direction: "up" | "down") => {
    const newBanners = [...banners];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBanners.length) return;

    // 交换顺序
    [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]];

    // 更新 sort_order
    const updates = newBanners.map((b, i) => ({ ...b, sort_order: i }));
    setBanners(updates);

    // 保存到数据库
    for (const banner of updates) {
      await supabase
        .from("site_assets")
        .update({ sort_order: banner.sort_order })
        .eq("id", banner.id);
    }
  };

  // 显示提示
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ImageIcon className="w-7 h-7 text-primary" />
              轮播图管理
            </h1>
            <p className="text-gray-500 mt-2">配置首页大图区域的轮播广告图</p>
          </div>
          <button
            onClick={addBanner}
            className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新增轮播图
          </button>
        </div>

        {/* 轮播图列表 */}
        {banners.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无轮播图</p>
            <button
              onClick={addBanner}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              新增第一张轮播图
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    {/* 图片预览/上传 */}
                    <div className="shrink-0">
                      {banner.image_url ? (
                        <div className="relative w-64 h-36 rounded-xl overflow-hidden bg-gray-100">
                          <img
                            src={banner.image_url}
                            alt="轮播图"
                            className="w-full h-full object-cover"
                          />
                          <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  uploadImage(banner.id, e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                            <span className="text-white text-sm font-medium">点击更换图片</span>
                          </label>
                        </div>
                      ) : (
                        <label className="w-64 h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                uploadImage(banner.id, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                          <div className="text-center">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <span className="text-sm text-gray-500">点击上传图片</span>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* 配置信息 */}
                    <div className="flex-1 space-y-4">
                      {/* 启用/停用 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateBanner(banner.id, { is_active: !banner.is_active })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              banner.is_active
                                ? "bg-green-50 text-green-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {banner.is_active ? (
                              <>
                                <Eye className="w-4 h-4" />
                                已启用
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-4 h-4" />
                                已停用
                              </>
                            )}
                          </button>
                          <span className="text-xs text-gray-400">排序：{index + 1}</span>
                        </div>

                        {/* 排序按钮 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveBanner(index, "up")}
                            disabled={index === 0}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveBanner(index, "down")}
                            disabled={index === banners.length - 1}
                            className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteBanner(banner.id)}
                            className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 标题 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">标题（选填）</label>
                        <input
                          type="text"
                          value={banner.title || ""}
                          onChange={(e) => updateBanner(banner.id, { title: e.target.value })}
                          placeholder="例如：爆款选品"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                      </div>

                      {/* 副标题 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">副标题（选填）</label>
                        <input
                          type="text"
                          value={banner.subtitle || ""}
                          onChange={(e) => updateBanner(banner.id, { subtitle: e.target.value })}
                          placeholder="例如：拿货精选"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                      </div>

                      {/* 跳转链接 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">跳转链接（选填）</label>
                        <input
                          type="text"
                          value={banner.link_url || ""}
                          onChange={(e) => updateBanner(banner.id, { link_url: e.target.value || null })}
                          placeholder="例如：/buyer 或 https://..."
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-bold text-blue-900 mb-3">💡 使用说明</h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li><strong>图片尺寸</strong>：建议 1600×500px 或 16:5 比例，保证清晰度</li>
            <li><strong>多张轮播</strong>：新增多张后，首页会自动轮播展示（4秒切换）</li>
            <li><strong>跳转链接</strong>：可以填站内路径（如 /buyer）或完整 URL</li>
            <li><strong>排序</strong>：用上下箭头调整展示顺序</li>
            <li><strong>停用</strong>：不需要展示的轮播图可以暂停，不会删除</li>
          </ul>
        </div>

        {/* Toast 提示 */}
        {toast && (
          <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg z-50 flex items-center gap-2 ${
            toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
          }`}>
            {toast.type === "success" ? "✅" : "❌"} {toast.message}
          </div>
        )}

        {/* 上传 loading */}
        {saving && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 flex items-center gap-4">
              <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-700 font-medium">上传中...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

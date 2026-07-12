"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload, Check, Image as ImageIcon, Save } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminStyleTestPage() {
  const [heroUrl, setHeroUrl] = useState<string>("");
  const [blocks, setBlocks] = useState<string[]>([]);
  const [uploading, setUploading] = useState<string | null>(null); // 'hero' | 'block'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: hero } = await supabase
          .from("site_assets")
          .select("image_url")
          .eq("key", "style_test_hero")
          .maybeSingle();
        if (hero?.image_url) setHeroUrl(hero.image_url);

        const res = await fetch("/api/admin/style-test");
        if (res.ok) {
          const d = await res.json();
          if (d.success && Array.isArray(d.blocks)) setBlocks(d.blocks);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleImageUpload = async (type: "hero" | "block", file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("error", "图片不能超过10MB"); return; }
    setUploading(type);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", type === "hero" ? "style_test_hero" : `style_test_block_${Date.now()}`);
      const res = await fetch("/api/admin/site-assets", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "上传失败");
      if (type === "hero") setHeroUrl(result.url);
      else setBlocks((p) => [...p, result.url]);
      showToast("success", type === "hero" ? "大图上传成功！" : "图片模块上传成功！");
    } catch (err: any) {
      showToast("error", "上传失败：" + err.message);
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/style-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "保存失败");
      showToast("success", "图片模块已保存！");
    } catch (err: any) {
      showToast("error", "保存失败：" + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
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

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">智能形象诊断</h1>
          <p className="text-sm text-muted-foreground mt-1">
            上传「智能形象诊断」页大图，前台仅保留付费入口，下方展示此处配置的图片模块。
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent mb-4" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero 大图上传 */}
          <div className="fashion-card p-6">
            <h2 className="font-bold text-primary text-lg mb-1 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-accent" /> 页面 Hero 大图
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              建议尺寸 1440×600px 以上，展示在付费入口上方。不上传则不显示。
            </p>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-[360px] shrink-0">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 aspect-video flex items-center justify-center border border-border">
                  {heroUrl ? (
                    <img src={heroUrl} alt="Hero 大图" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-10 h-10 opacity-30 mb-2" />
                      <span className="text-xs">暂未上传</span>
                    </div>
                  )}
                  {uploading === "hero" && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-accent" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <label className="inline-flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload("hero", f);
                      e.target.value = "";
                    }}
                    disabled={!!uploading}
                    className="hidden"
                  />
                  <span className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${heroUrl ? "border border-border text-foreground hover:bg-muted" : "bg-accent text-white hover:brightness-110 shadow-md shadow-accent/20"} ${uploading === "hero" ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploading === "hero" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {heroUrl ? "更换大图" : "上传大图"}
                  </span>
                </label>
                {heroUrl && (
                  <p className="text-xs text-gray-400 truncate font-mono bg-muted/50 px-2 py-1 rounded max-w-md mt-3">
                    {heroUrl}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 图片模块（满框大图片） */}
          <div className="fashion-card p-6">
            <h2 className="font-bold text-primary text-lg mb-1 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-accent" /> 页面图片模块
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              像同行一样上传满框大图片，一块一块展示在付费入口下方。可上传多张，前台按顺序排列展示。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {blocks.map((url, i) => (
                <div key={url + i} className="relative group overflow-hidden rounded-xl border border-border aspect-[3/4] bg-muted">
                  <img src={url} alt={`图片模块 ${i + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => setBlocks((p) => p.filter((_, idx) => idx !== i))}
                      className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-red-500"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
              <label className="relative overflow-hidden rounded-xl border-2 border-dashed border-border aspect-[3/4] bg-muted flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload("block", f);
                    e.target.value = "";
                  }}
                  disabled={uploading === "block"}
                  className="hidden"
                />
                {uploading === "block" ? (
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">添加图片</span>
                  </>
                )}
              </label>
            </div>
            <p className="text-xs text-muted-foreground">• 建议单张宽度 1440px 以上，高度不限；保存后前台立即展示</p>
          </div>

          {/* 保存 */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "保存中..." : "保存图片模块"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

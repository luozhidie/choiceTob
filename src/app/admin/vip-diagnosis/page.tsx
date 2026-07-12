"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Upload, Check, Image as ImageIcon, Save, Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

interface BookingConfig {
  title: string;
  subtitle: string;
  price: number;
  desc: string;
  wechat: string;
  outline: string[];
}

export default function AdminVipDiagnosisPage() {
  const [heroUrl, setHeroUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [config, setConfig] = useState<BookingConfig>({
    title: "整体形象诊断",
    subtitle: "一次诊断 终身受益",
    price: 190,
    desc: "专业形象顾问一对一定制，找准显白本命色，锁定高级风格。",
    wechat: "luozhidie",
    outline: ["风格诊断", "色彩诊断", "身材诊断", "生成报告"],
  });

  const supabase = createClient();

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 加载 Hero 大图 + 预约配置
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: hero } = await supabase
          .from("site_assets")
          .select("image_url")
          .eq("key", "diagnosis_hero")
          .maybeSingle();
        if (hero?.image_url) setHeroUrl(hero.image_url);

        const res = await fetch("/api/admin/vip-diagnosis");
        if (res.ok) {
          const d = await res.json();
          if (d.success && d.config) setConfig(d.config);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 上传 Hero 大图（复用 /api/admin/site-assets）
  const handleHeroUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("error", "图片不能超过10MB"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", "diagnosis_hero");
      const res = await fetch("/api/admin/site-assets", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "上传失败");
      setHeroUrl(result.url);
      showToast("success", "大图上传成功！");
    } catch (err: any) {
      showToast("error", "上传失败：" + err.message);
    } finally {
      setUploading(false);
    }
  };

  const updateField = (k: keyof BookingConfig, v: any) =>
    setConfig((p) => ({ ...p, [k]: v }));

  const updateOutline = (idx: number, v: string) =>
    setConfig((p) => ({ ...p, outline: p.outline.map((x, i) => (i === idx ? v : x)) }));

  const addOutline = () =>
    setConfig((p) => ({ ...p, outline: [...p.outline, ""] }));

  const removeOutline = (idx: number) =>
    setConfig((p) => ({ ...p, outline: p.outline.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/vip-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "保存失败");
      showToast("success", "配置已保存！");
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
          <h1 className="text-2xl font-bold text-primary">形象诊断管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            上传个人形象诊断落地页大图，并配置「形象诊断预约」（¥190）展示内容
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
          {/* ① Hero 大图上传 */}
          <div className="fashion-card p-6">
            <h2 className="font-bold text-primary text-lg mb-1 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-accent" /> 落地页 Hero 大图
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              建议尺寸 1440×600px 以上，展示在「个人形象诊断」落地页顶部。不上传则使用默认品牌渐变。
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
                  {uploading && (
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
                      if (f) handleHeroUpload(f);
                      e.target.value = "";
                    }}
                    disabled={uploading}
                    className="hidden"
                  />
                  <span className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${heroUrl ? "border border-border text-foreground hover:bg-muted" : "bg-accent text-white hover:brightness-110 shadow-md shadow-accent/20"} ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
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

          {/* ② 形象诊断预约配置 */}
          <div className="fashion-card p-6">
            <h2 className="font-bold text-primary text-lg mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" /> 形象诊断预约（¥190）配置
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              该内容将展示在落地页「整体形象诊断」跳转的预约页，以及小程序「形象诊断预约」页。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="标题">
                <input value={config.title} onChange={(e) => updateField("title", e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </Field>
              <Field label="副标题">
                <input value={config.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </Field>
              <Field label="价格（元）">
                <input type="number" value={config.price} onChange={(e) => updateField("price", Number(e.target.value))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </Field>
              <Field label="预约微信号">
                <input value={config.wechat} onChange={(e) => updateField("wechat", e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </Field>
            </div>

            <Field label="简介">
              <textarea value={config.desc} onChange={(e) => updateField("desc", e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </Field>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">服务大纲（每行一条）</span>
                <button onClick={addOutline} className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent font-medium hover:bg-accent/20 transition-colors">
                  + 添加
                </button>
              </div>
              <div className="space-y-2">
                {config.outline.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={item}
                      onChange={(e) => updateOutline(i, e.target.value)}
                      className="input flex-1"
                      placeholder={`第 ${i + 1} 条`}
                    />
                    <button
                      onClick={() => removeOutline(i)}
                      className="px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 text-sm"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "保存中..." : "保存配置"}
              </button>
            </div>
          </div>

          {/* 预览提示 */}
          <div className="p-6 bg-accent-light/30 rounded-2xl border border-accent/15">
            <h4 className="font-bold text-primary text-sm mb-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" /> 生效说明
            </h4>
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-muted-foreground leading-relaxed">
              <li>• 保存后立即生效，无需重新部署</li>
              <li>• 落地页「整体形象诊断」跳转至形象诊断预约页</li>
              <li>• 配置同步到网站与微信小程序两端</li>
              <li>• 如需恢复默认，清空对应字段即可</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2, Upload, X, Image as ImageIcon, RefreshCw, Check,
  Camera, Sparkles, Newspaper, Megaphone,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SiteAsset {
  id: string;
  key: string;
  title: string | null;
  image_url: string;
  alt_text: string | null;
  is_active: boolean;
  updated_at: string;
}

/* 预定义的图片位置配置 */
const ASSET_CONFIGS = [
  {
    key: "hero_bg",
    title: "🏠 首页 Hero 大背景",
    desc: "建议尺寸 1440×900px，用于首页顶部主视觉区域",
    icon: Camera,
    sizeHint: "1440 × 900",
    required: true,
  },
  {
    key: "magazine_1",
    title: "📰 杂志封面 — 流行趋势",
    desc: "建议比例 4:3，用于首页「时尚前沿」区域第一张卡片",
    icon: Newspaper,
    sizeHint: "800 × 600",
    required: false,
  },
  {
    key: "magazine_2",
    title: "📰 杂志封面 — 搭配灵感",
    desc: "建议比例 4:3，第二张杂志卡片封面图",
    icon: ImageIcon,
    sizeHint: "800 × 600",
    required: false,
  },
  {
    key: "magazine_3",
    title: "📰 杂志封面 — 行业洞察",
    desc: "建议比例 4:3，第三张杂志卡片封面图",
    icon: ImageIcon,
    sizeHint: "800 × 600",
    required: false,
  },
  {
    key: "cta_bg",
    title: "🚀 CTA 行动号召区背景",
    desc: "建议尺寸 1200×500px，底部「预约演示」区域背景图",
    icon: Megaphone,
    sizeHint: "1200 × 500",
    required: false,
  },
  {
    key: "pay_wechat_qr",
    title: "💚 微信收款二维码",
    desc: "微信收款码原始图片（打开微信 → 我 → 服务 → 收付款 → 收款码 → 保存图片），用于VIP/每日搭配/爆款样衣等支付弹窗",
    icon: ImageIcon,
    sizeHint: "正方形，建议 ≥ 500×500",
    required: true,
  },
  {
    key: "pay_alipay_qr",
    title: "💙 支付宝收款二维码",
    desc: "支付宝收款码原始图片（打开支付宝 → 收付款 → 收款 → 保存图片），用于VIP/每日搭配/爆款样衣等支付弹窗",
    icon: ImageIcon,
    sizeHint: "正方形，建议 ≥ 500×500",
    required: true,
  },
  {
    key: "wechat_work_qr",
    title: "💬 企业微信二维码",
    desc: "企业微信二维码图片，用于前台「联系我们」页面展示，客户扫码添加企微",
    icon: ImageIcon,
    sizeHint: "正方形，建议 ≥ 400×400",
    required: false,
  },
];

export default function AdminSiteAssetsPage() {
  const [assets, setAssets] = useState<Record<string, SiteAsset>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  // 登录检查
  useEffect(() => {
    const check = async () => {
    check();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 加载所有资源
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_assets")
        .select("*");
      if (error) throw error;
      const map: Record<string, SiteAsset> = {};
      (data || []).forEach((a: any) => { map[a.key] = a; });
      setAssets(map);
    } catch (err: any) {
      showToast("error", "加载失败：" + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  // 上传图片
  const handleUpload = async (key: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("error", "图片不能超过10MB");
      return;
    }

    setUploadingKey(key);
    try {
      // 1. 上传到 Storage
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `site-assets/${key}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(fileName, file);
      if (upErr) throw upErr;

      // 2. 获取公开URL
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(fileName);

      // 3. 更新或插入数据库
      const existing = assets[key];
      let error;
      if (existing) {
        ({ error } = await supabase
          .from("site_assets")
          .update({ image_url: urlData.publicUrl, updated_at: new Date().toISOString() })
          .eq("id", existing.id));
      } else {
        const config = ASSET_CONFIGS.find(c => c.key === key);
        ({ error } = await supabase
          .from("site_assets")
          .insert([{
            key,
            title: config?.title || key,
            image_url: urlData.publicUrl,
            is_active: true,
          }]));
      }
      if (error) throw error;

      showToast("success", "上传成功！");
      fetchAssets();
    } catch (err: any) {
      showToast("error", "上传失败：" + err.message);
    } finally {
      setUploadingKey(null);
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

      {/* 标题 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary">站点图片管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            上传首页、杂志等关键位置的展示图片，替换默认渐变/占位符
          </p>
        </div>
        <button
          onClick={fetchAssets}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-border rounded-lg hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* 图片卡片列表 */}
      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-accent mb-4" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {ASSET_CONFIGS.map((config) => {
            const asset = assets[config.key];
            const ConfigIcon = config.icon;

            return (
              <motion.div
                key={config.key}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * ASSET_CONFIGS.indexOf(config) }}
                className="fashion-card p-6"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* 左侧：预览 */}
                  <div className="lg:w-[360px] shrink-0">
                    <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 aspect-video flex items-center justify-center border border-border">
                      {asset?.image_url ? (
                        <>
                          <img
                            src={asset.image_url}
                            alt={asset.alt_text || config.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-medium text-primary">
                              ✅ 已设置
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <ConfigIcon className="w-10 h-10 opacity-30 mb-2" />
                          <span className="text-xs">暂未上传</span>
                          <span className="text-[11px] opacity-50">{config.sizeHint}</span>
                        </div>
                      )}

                      {/* 上传中遮罩 */}
                      {uploadingKey === config.key && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-accent" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右侧：信息 + 操作 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-primary text-base">{config.title}</h3>
                        {asset?.image_url && (
                          <Check className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{config.desc}</p>

                      {/* 技术信息 */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-[11px] px-2 py-1 rounded-full bg-muted text-muted-foreground font-mono">
                          {config.sizeHint}
                        </span>
                        {asset?.updated_at && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-green-50 text-green-600">
                            更新于 {new Date(asset.updated_at).toLocaleDateString("zh-CN")}
                          </span>
                        )}
                      </div>

                      {asset?.image_url && (
                        <div className="text-xs text-gray-400 truncate font-mono bg-muted/50 px-2 py-1 rounded max-w-md">
                          {asset.image_url}
                        </div>
                      )}
                    </div>

                    {/* 上传按钮 */}
                    <div className="mt-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(config.key, file);
                            e.target.value = "";
                          }}
                          disabled={!!uploadingKey}
                          className="hidden"
                        />
                        <span
                          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                            asset?.image_url
                              ? "border border-border text-foreground hover:bg-muted"
                              : "bg-accent text-white hover:brightness-110 shadow-md shadow-accent/20"
                          } ${uploadingKey === config.key ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          {uploadingKey === config.key ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {asset?.image_url ? "更换图片" : "上传图片"}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-10 p-6 bg-accent-light/30 rounded-2xl border border-accent/15">
        <h4 className="font-bold text-primary text-sm mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          使用提示
        </h4>
        <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-muted-foreground leading-relaxed">
          <li>• 支持 JPG / PNG / WebP / GIF，单张不超过 10MB</li>
          <li>• Hero 背景建议使用高质感品牌大片或秀场图</li>
          <li>• 杂志封面对应首页「时尚前沿」三张卡片</li>
          <li>• 上传后立即生效，无需重新部署</li>
          <li>• 建议图片压缩后上传以提升加载速度</li>
          <li>• 如需恢复默认效果，删除图片即可</li>
        </ul>
      </div>
    </div>
  );
}

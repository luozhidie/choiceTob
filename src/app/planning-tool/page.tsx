"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Eye, Sparkles, ChevronRight,
  CheckCircle2, Loader2, Wand2, ArrowRight, Store,
  Ruler, MessageSquare, CreditCard, Check,
} from "lucide-react";
import AdBanner from "@/components/AdBanner";
import { PaywallModal } from "@/components/PaywallModal";
import { createClient } from "@/lib/supabase/client";

/* ==================== 选项数据 ==================== */

const SEASONS = ["春夏", "夏秋", "秋冬", "冬春"];

const COLOR_PREFERENCES = [
  { value: "warm", label: "暖色系", desc: "红/橙/黄/棕" },
  { value: "cool", label: "冷色系", desc: "蓝/绿/紫/灰" },
  { value: "neutral", label: "中性色", desc: "黑/白/灰/米/驼" },
  { value: "morandi", label: "莫兰迪色系", desc: "低饱和高级灰调" },
  { value: "earth", label: "大地色系", desc: "卡其/驼色/咖啡" },
  { value: "pastel", label: "马卡龙色系", desc: "柔和粉彩调" },
  { value: "vintage", label: "复古色系", desc: "酒红/墨绿/藏蓝" },
  { value: "monochrome", label: "黑白极简", desc: "纯黑/纯白/黑白配" },
];

const MARKET_STYLES = [
  { value: "shao_nv", label: "淑女风", group: "女士八大风格" },
  { value: "you_ya", label: "知性风", group: "女士八大风格" },
  { value: "lang_man_f", label: "名媛风", group: "女士八大风格" },
  { value: "shao_nian_f", label: "中性风", group: "女士八大风格" },
  { value: "shi_shang_f", label: "潮牌风", group: "女士八大风格" },
  { value: "gu_dian_f", label: "职业风", group: "女士八大风格" },
  { value: "zi_ran_f", label: "休闲风", group: "女士八大风格" },
  { value: "xi_ju_f", label: "大牌风", group: "女士八大风格" },
  { value: "xi_ju_m", label: "气场型男", group: "男士五大风格" },
  { value: "zi_ran_m", label: "随性达人", group: "男士五大风格" },
  { value: "gu_dian_m", label: "精英绅士", group: "男士五大风格" },
  { value: "lang_man_m", label: "优雅先生", group: "男士五大风格" },
  { value: "shi_shang_m", label: "潮流先锋", group: "男士五大风格" },
];

const PRICE_BANDS = [
  "99-199元",
  "199-399元",
  "399-699元",
  "699元+",
];

const STORE_TYPES = [
  { value: "women", label: "女装店", desc: "专注女装品类" },
  { value: "men", label: "男装店", desc: "专注男装品类" },
  { value: "children", label: "童装店", desc: "专注童装品类" },
  { value: "multi", label: "集合店", desc: "多品类综合经营" },
  { value: "boutique", label: "买手店", desc: "设计师品牌/精品" },
  { value: "online", label: "线上店铺", desc: "纯电商/直播" },
];

const STORE_SCALES = [
  { value: "small", label: "小型店", desc: "30-50㎡，1-2人", range: "月销5-15万" },
  { value: "medium", label: "中型店", desc: "50-100㎡，2-4人", range: "月销15-30万" },
  { value: "large", label: "大型店", desc: "100-200㎡，4-6人", range: "月销30-60万" },
  { value: "flagship", label: "旗舰店", desc: "200㎡+，6人以上", range: "月销60万+" },
];

/* ==================== 类型 ==================== */
interface PlanningReport {
  brandName: string;
  season: string;
  summary: string;
  colorPlan: { type: string; ratio: string; colors: string[] }[];
  stylePlan: { style: string; trafficRatio: string; profitRatio: string }[];
  productStructure: { type: string; ratio: string; desc: string }[];
  pricePlan: { band: string; range: string; ratio: string; strategy: string }[];
  quartersPlan: { phase: string; items: string[] }[];
}

/* ==================== 页面 ==================== */
export default function PlanningToolPage() {
  const [step, setStep] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<PlanningReport | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [storeOptions, setStoreOptions] = useState<{ id: string; name: string; city: string | null; style_position: string | null; target_age: string | null; price_range: string | null; shop_size: string | null }[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");

  const [formData, setFormData] = useState({
    brandName: "",
    season: "春夏",
    colorPref: "",
    marketStyle: "",
    priceBand: "199-399元",
    targetAge: "",
    shopSize: "",
    storeType: "",
    storeScale: "",
    problems: "",
    contact: "",
    notes: "",
  });

  const supabase = createClient();

  useEffect(() => {
    supabase.from("stores").select("id, name, city, style_position, target_age, price_range, shop_size").eq("status", "active").order("name")
      .then(({ data }) => { if (data) setStoreOptions(data as any[]); });
  }, []);

  const handleSelectStore = (storeId: string) => {
    setSelectedStoreId(storeId);
    if (!storeId) return;
    const store = storeOptions.find(s => s.id === storeId);
    if (!store) return;
    setFormData(f => ({
      ...f,
      brandName: f.brandName || store.name,
      marketStyle: f.marketStyle || store.style_position || "",
      targetAge: f.targetAge || store.target_age || "",
      priceBand: f.priceBand || store.price_range || "199-399元",
      shopSize: f.shopSize || store.shop_size || "",
    }));
  };

  const getColorLabel = (v: string) => COLOR_PREFERENCES.find(c => c.value === v)?.label || v;
  const getStyleLabel = (v: string) => MARKET_STYLES.find(s => s.value === v)?.label || v;

  /* 提交需求并进入支付 */
  const handleSubmit = async () => {
    setGenerating(true);

    try {
      // 保存需求到 planning_requests 表
      const { error } = await supabase.from("planning_requests").insert([{
        store_type: formData.storeType,
        store_scale: formData.storeScale,
        style_preference: formData.marketStyle,
        season: formData.season,
        budget_range: formData.priceBand,
        contact: formData.contact,
      }]);

      if (error) {
        console.error("保存需求失败:", error);
      }
    } catch (err) {
      console.error("提交失败:", err);
    }

    setGenerating(false);
    setStep(2);
  };

  const handlePay = async () => {
    setSubmitted(true);
    setStep(3);
  };

  /* 如果正在生成，显示动画 */
  if (generating) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-6">
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">正在生成企划初稿...</h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            正在结合{getStyleLabel(formData.marketStyle)}风格定位与{getColorLabel(formData.colorPref)}色系偏好，生成个性化商品企划初稿
          </p>
          <div className="mt-8 max-w-sm mx-auto space-y-2 text-left">
            {[
              "分析市场趋势与竞品动态",
              "匹配色系偏好与风格定位",
              "规划商品结构与价格带分布",
              "生成波段上新建议",
              "输出初稿企划框架",
            ].map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.5 }}
                className="flex items-center gap-3 text-sm"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i < 4 ? "bg-accent/20 text-accent" : "bg-gray-100 text-gray-400"}`}>
                  {i < 4 ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                </div>
                <span className={i < 4 ? "text-primary font-medium" : "text-gray-400"}>{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="完整Word报告"
        description="付费后可下载完整Word版企划报告（含详细数据与分析）"
        type="single"
      />

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <Sparkles className="w-4 h-4" />
              AI 智能企划报告
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              定制您的专属企划报告
            </h1>
            <p className="mt-3 text-white/80 leading-relaxed">
              填写店铺信息，精准匹配类型+体量+风格，仅需 ¥9.9 获取完整商品企划报告，1-2个工作日交付。
            </p>
            {/* 定位说明 */}
            <div className="mt-6 inline-flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5" />
                精准匹配 · 专业定制
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                完整报告 · 可落地执行
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== 主内容 ====== */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

          {/* Step 指示器 */}
          <div className="flex items-center justify-center gap-4 mb-10">
            {["填写需求", "确认支付", "提交成功"].map((label, i) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step > i + 1 ? "bg-accent text-white" : step === i + 1 ? "bg-primary text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className={`text-sm ${step === i + 1 ? "text-primary font-semibold" : "text-gray-400"}`}>
                  {label}
                </span>
                {i < 2 && <div className="w-12 h-0.5 bg-gray-200" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ====== Step 1: 填写信息 ====== */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-primary">填写店铺需求</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    精准匹配：类型 + 体量 + 风格，为您定制专属企划报告
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* 店铺类型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Store className="w-3.5 h-3.5 inline mr-1" />
                      店铺类型 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {STORE_TYPES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, storeType: f.storeType === t.value ? "" : t.value }))}
                          className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors border text-left ${
                            formData.storeType === t.value
                              ? "bg-primary text-white border-primary"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30"
                          }`}
                        >
                          <span className="block font-semibold">{t.label}</span>
                          <span className={`text-[10px] ${formData.storeType === t.value ? "text-white/70" : "text-muted-foreground"}`}>{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 店铺体量 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <Ruler className="w-3.5 h-3.5 inline mr-1" />
                      店铺体量 <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {STORE_SCALES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, storeScale: f.storeScale === s.value ? "" : s.value }))}
                          className={`w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-colors border text-left flex items-center justify-between ${
                            formData.storeScale === s.value
                              ? "bg-accent text-white border-accent"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-accent/30"
                          }`}
                        >
                          <div>
                            <span className="block font-semibold">{s.label}</span>
                            <span className={`text-[10px] ${formData.storeScale === s.value ? "text-white/70" : "text-muted-foreground"}`}>{s.desc}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${formData.storeScale === s.value ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>{s.range}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 品牌名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      品牌/店铺名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="请输入品牌或店铺名称"
                    />
                  </div>

                  {/* 目标季节 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      目标季节 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm bg-white"
                    >
                      {SEASONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* 风格定位 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      风格定位 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {MARKET_STYLES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, marketStyle: f.marketStyle === s.value ? "" : s.value }))}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                            formData.marketStyle === s.value
                              ? "bg-accent text-white border-accent"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-accent/30"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 色系偏好 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      色系偏好 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {COLOR_PREFERENCES.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, colorPref: f.colorPref === c.value ? "" : c.value }))}
                          className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border text-left ${
                            formData.colorPref === c.value
                              ? "bg-primary text-white border-primary"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30"
                          }`}
                        >
                          <span className="block font-semibold">{c.label}</span>
                          <span className={`text-[10px] ${formData.colorPref === c.value ? "text-white/70" : "text-muted-foreground"}`}>{c.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 主价格带 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      主价格带
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_BANDS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData(f => ({ ...f, priceBand: p }))}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            formData.priceBand === p
                              ? "bg-primary text-white border-primary"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30"
                          }`}
                        >
                          ¥{p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 联系方式 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      联系方式 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="手机号或微信，用于接收报告"
                    />
                  </div>
                </div>

                {/* 当前遇到的问题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                    当前遇到的问题（可选）
                  </label>
                  <textarea
                    value={formData.problems}
                    onChange={(e) => setFormData({ ...formData, problems: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                    placeholder="例如：库存积压、选品不准、陈列效果差、客流下降..."
                  />
                </div>

                {/* 补充说明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    补充说明（可选）
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                    placeholder="其他特殊需求或说明..."
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.brandName.trim() || !formData.storeType || !formData.storeScale || !formData.marketStyle || !formData.colorPref || !formData.contact.trim() || generating}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                  >
                    下一步：确认支付
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ====== Step 2: 确认支付 ====== */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-primary">确认需求并支付</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    核对您的需求信息，支付 ¥9.9 后我们将为您生成专属企划报告
                  </p>
                </div>

                {/* 需求确认卡片 */}
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-primary flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    需求信息
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">店铺类型</span>
                      <p className="font-medium text-primary">{STORE_TYPES.find(t => t.value === formData.storeType)?.label || formData.storeType}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">店铺体量</span>
                      <p className="font-medium text-primary">{STORE_SCALES.find(s => s.value === formData.storeScale)?.label || formData.storeScale}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">品牌名称</span>
                      <p className="font-medium text-primary">{formData.brandName}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">目标季节</span>
                      <p className="font-medium text-primary">{formData.season}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">风格定位</span>
                      <p className="font-medium text-primary">{getStyleLabel(formData.marketStyle)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">色系偏好</span>
                      <p className="font-medium text-primary">{getColorLabel(formData.colorPref)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">主价格带</span>
                      <p className="font-medium text-primary">{formData.priceBand}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">联系方式</span>
                      <p className="font-medium text-primary">{formData.contact}</p>
                    </div>
                  </div>
                  {formData.problems && (
                    <div className="bg-white rounded-lg p-3">
                      <span className="text-gray-400 text-xs">遇到的问题</span>
                      <p className="font-medium text-primary text-sm mt-1">{formData.problems}</p>
                    </div>
                  )}
                </div>

                {/* 支付卡片 */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-accent/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-primary flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        支付金额
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">专属企划报告 · 精准匹配定制</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-bold text-accent">¥9.9</span>
                      <span className="text-sm text-gray-400 line-through ml-2">¥99</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      <span>基于您的店铺类型、体量、风格精准匹配</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      <span>1-2个工作日内生成并发送至您的联系方式</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      <span>包含色彩企划、商品结构、价格带、波段规划</span>
                    </div>
                  </div>

                  {/* 支付方式 */}
                  <div className="mt-6 p-4 bg-white rounded-xl">
                    <p className="text-sm font-medium text-gray-700 mb-3">选择支付方式</p>
                    <div className="flex gap-3">
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-green-500 bg-green-50 text-green-700 font-medium text-sm">
                        <span>微信支付</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50">
                        <span>支付宝</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-xs text-amber-700">💡 当前为线下收款模式：支付后请截图联系客服确认，我们将尽快为您安排报告生成。</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    返回修改
                  </button>
                  <button
                    onClick={handlePay}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    确认支付 ¥9.9
                  </button>
                </div>
              </motion.div>
            )}

            {/* ====== Step 3: 提交成功 ====== */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary mb-2">需求提交成功！</h2>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    您的企划报告需求已收到，我们将在 <span className="font-bold text-accent">1-2个工作日</span> 内完成报告并发送至您的联系方式：{formData.contact}
                  </p>
                </div>

                {/* 后续流程 */}
                <div className="bg-gray-50 rounded-2xl p-6 max-w-lg mx-auto">
                  <h3 className="font-bold text-primary mb-4 text-center">接下来会发生什么？</h3>
                  <div className="space-y-4">
                    {[
                      { step: "1", title: "需求审核", desc: "专业顾问审核您的店铺信息与需求" },
                      { step: "2", title: "报告生成", desc: "基于类型+体量+风格，AI+人工定制企划报告" },
                      { step: "3", title: "报告交付", desc: "通过您预留的联系方式发送完整报告" },
                    ].map((item, i) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-accent text-white" : "bg-gray-200 text-gray-500"}`}>
                          {item.step}
                        </div>
                        <div>
                          <p className="font-medium text-primary text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => { setStep(1); setSubmitted(false); setFormData({ brandName: "", season: "春夏", colorPref: "", marketStyle: "", priceBand: "199-399元", targetAge: "", shopSize: "", storeType: "", storeScale: "", problems: "", contact: "", notes: "" }); }}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    再提交一个需求
                  </button>
                  <a
                    href="/buyer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    先去逛逛选品
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ====== 与人工企划的区别说明 ====== */}
      <section className="py-12 bg-muted/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h3 className="text-center text-lg font-bold text-primary mb-8">两种企划服务，如何选择？</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-accent/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-accent" />
                <h4 className="font-bold text-primary">AI 企划报告</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">本页</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />精准匹配：类型+体量+风格</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />1-2个工作日交付完整报告</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />包含色彩/结构/价格/波段规划</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />可下载Word/PDF完整版</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <span className="text-lg font-bold text-accent">¥9.9</span>
                <span className="text-xs text-muted-foreground line-through">¥99</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border-2 border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-primary">人工定制企划</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">/planning</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" />顾问对接，48小时出方案</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" />结合店铺实际数据定制</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" />完整方案，可落地执行</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary shrink-0" />含后续跟踪与动态调整</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
                <span className="text-lg font-bold text-primary">¥598</span>
                <span className="text-xs text-muted-foreground">/次起</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AdBanner position="inline" />
      </div>
    </>
  );
}

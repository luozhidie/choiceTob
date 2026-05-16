"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Eye, Sparkles, ChevronRight,
  CheckCircle2, Loader2, Wand2, ArrowRight,
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
  { value: "minimal_commute", label: "简约通勤" },
  { value: "french_elegant", label: "法式优雅" },
  { value: "korean_fresh", label: "韩系清新" },
  { value: "japanese_art", label: "日系文艺" },
  { value: "retro_vintage", label: "复古港风" },
  { value: "sport_casual", label: "运动休闲" },
  { value: "luxury_minimal", label: "轻奢极简" },
  { value: "street_trend", label: "街头潮牌" },
  { value: "chinese_style", label: "新中式" },
  { value: "bohemian", label: "波西米亚" },
];

const PRICE_BANDS = [
  "99-199元",
  "199-399元",
  "399-699元",
  "699元+",
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

  /* 生成报告（AI + Mock fallback） */
  const handleGenerate = async () => {
    setGenerating(true);

    const styleLabel = getStyleLabel(formData.marketStyle);
    const colorLabel = getColorLabel(formData.colorPref);

    let report: PlanningReport;

    try {
      // 调用 API Route 生成（有 AI Key 时走 AI，否则走 Mock）
      const res = await fetch("/api/generate-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: formData.brandName,
          season: formData.season,
          colorPref: formData.colorPref,
          colorLabel,
          marketStyle: formData.marketStyle,
          styleLabel,
          priceBand: formData.priceBand,
          targetAge: formData.targetAge,
          shopSize: formData.shopSize,
          notes: formData.notes,
          storeId: selectedStoreId || undefined,
        }),
      });

      if (!res.ok) throw new Error("API 请求失败");
      const data = await res.json();
      report = data.report as PlanningReport;
    } catch (err) {
      console.error("AI 生成失败，使用 Mock:", err);
      // Fallback：本地 Mock
      report = {
        brandName: formData.brandName || "示例品牌",
        season: formData.season,
        summary: `基于${colorLabel}偏好和${styleLabel}定位，为${formData.brandName || "贵品牌"}量身定制的${formData.season}商品企划初稿。本企划结合市场趋势与品牌调性，可作为选品与铺货的参考框架。\n\n（提示：此为基础初稿，如需结合店铺实际数据定制完整方案，可申请人工企划服务）`,
        colorPlan: [
          { type: "基础色", ratio: "40%", colors: ["黑", "白", "灰", "藏青"] },
          { type: "主题色", ratio: "35%", colors: [colorLabel + "主调", "米白", "灰粉"] },
          { type: "点缀色", ratio: "15%", colors: ["珊瑚橘", "丁香紫"] },
          { type: "流行色", ratio: "10%", colors: ["数字薰衣草", "薄荷绿"] },
        ],
        stylePlan: MARKET_STYLES.map((s) => ({
          style: s.label,
          trafficRatio: s.value === formData.marketStyle ? "30%" : `${Math.round(70 / 9)}%`,
          profitRatio: s.value === formData.marketStyle ? "60%" : `${Math.round(40 / 9)}%`,
        })),
        productStructure: [
          { type: "引流款", ratio: "15%", desc: "低毛利高流量，吸引新客进店" },
          { type: "利润款", ratio: "50%", desc: "核心利润来源，保证经营健康" },
          { type: "形象款", ratio: "20%", desc: "品牌调性展示，提升品牌溢价" },
          { type: "搭配款", ratio: "15%", desc: "提升连带率，拉高客单价" },
        ],
        pricePlan: [
          { band: "入门款", range: "99-199元", ratio: "20%", strategy: "低价引流，降低新客决策门槛" },
          { band: "主销款", range: "199-399元", ratio: "45%", strategy: "量价平衡，贡献核心销量与利润" },
          { band: "品质款", range: "399-699元", ratio: "25%", strategy: "提升品牌形象，拉高客单价" },
          { band: "旗舰款", range: "699元+", ratio: "10%", strategy: "品牌标杆，彰显品牌实力与调性" },
        ],
        quartersPlan: [
          { phase: "第一波段（上半月）", items: [`${styleLabel}风格商品结构规划`, `${colorLabel}色彩企划矩阵`, "价格带分布策略", "核心品类确定"] },
          { phase: "第二波段（下半月）", items: ["爆款预测与选品参考", "门店陈列建议", "库存周转提示", "营销活动建议"] },
          { phase: "第三波段（次月补充）", items: ["销售跟踪建议", "补货追单参考", "滞销款处理建议", "下一季企划预研"] },
        ],
      };
    }

    setReport(report);
    setGenerating(false);
    setStep(3);

    // 自动保存报告到 planning_reports 表（后台可管理）
    try {
      const supabase = createClient();
      await supabase.from("planning_reports").insert([{
        title: `${report.brandName} · ${report.season}商品企划初稿`,
        category: "AI智能初稿",
        content: report.summary,
        images: [],
        color_season: formData.colorPref || null,
        style_type: formData.marketStyle || null,
        is_published: false,
        is_template: false,
      }]);
    } catch (saveErr) {
      console.error("报告自动保存失败（不影响展示）:", saveErr);
    }
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
              AI 智能企划初稿生成器
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              快速生成企划初稿
            </h1>
            <p className="mt-3 text-white/80 leading-relaxed">
              输入店铺定位信息，即时生成商品企划框架初稿，免费使用。如需定制完整方案，可同步申请人工企划服务。
            </p>
            {/* 定位说明 */}
            <div className="mt-6 inline-flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1">
                <Wand2 className="w-3.5 h-3.5" />
                自助AI生成 · 即时出稿
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                可作为人工企划的参考基础
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
            {["填写信息", "生成报告", "预览初稿"].map((label, i) => (
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
                  <h2 className="text-2xl font-bold text-primary">填写店铺信息</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    填写以下信息，AI将为您生成个性化的商品企划初稿
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* 导入店铺数据 */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      导入店铺数据（可选）
                    </label>
                    <select
                      value={selectedStoreId}
                      onChange={(e) => handleSelectStore(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm bg-white"
                    >
                      <option value="">手动填写信息</option>
                      {storeOptions.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}{s.city ? ` (${s.city})` : ""}</option>
                      ))}
                    </select>
                    {selectedStoreId && (
                      <p className="mt-1.5 text-xs text-accent">已选择店铺，AI 将基于该店铺的经营数据与会员统计生成更精准的企划方案</p>
                    )}
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

                  {/* 市场风格定位 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      风格定位 <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
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

                  {/* 目标价格带 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      主价格带 <span className="text-red-500">*</span>
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

                  {/* 目标客群年龄 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      目标客群年龄段
                    </label>
                    <input
                      type="text"
                      value={formData.targetAge}
                      onChange={(e) => setFormData({ ...formData, targetAge: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="例如：25-35岁"
                    />
                  </div>
                </div>

                {/* 补充说明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    补充说明（可选）
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                    placeholder="其他特殊需求或说明..."
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={!formData.brandName.trim() || !formData.colorPref || !formData.marketStyle || generating}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                  >
                    生成企划初稿
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ====== Step 3: 报告预览 ====== */}
            {step === 3 && report && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* 头部 */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    AI 初稿已生成
                  </div>
                  <h2 className="text-2xl font-bold text-primary">{report.brandName} · {report.season}商品企划初稿</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto whitespace-pre-wrap leading-relaxed">
                    {report.summary}
                  </p>
                </div>

                {/* 色彩企划矩阵 */}
                <section className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-primary mb-4">色彩企划矩阵</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {report.colorPlan.map((c) => (
                      <div key={c.type} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-primary text-sm">{c.type}</span>
                          <span className="text-xs text-accent font-bold">{c.ratio}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.colors.map((color) => (
                            <span key={color} className="px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600">{color}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 商品结构规划 */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-primary mb-4">商品结构规划</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {report.productStructure.map((p) => (
                      <div key={p.type} className="bg-muted/30 rounded-xl p-4">
                        <div className="text-2xl font-bold text-accent">{p.ratio}</div>
                        <div className="font-semibold text-primary mt-1 text-sm">{p.type}</div>
                        <p className="text-xs text-muted-foreground mt-1.5">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 价格带企划 */}
                <section className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-primary mb-4">价格带企划</h3>
                  <div className="space-y-3">
                    {report.pricePlan.map((p) => (
                      <div key={p.band} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                          <div className="font-semibold text-primary text-sm">{p.band}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{p.strategy}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-accent">{p.range}</div>
                          <div className="text-xs text-muted-foreground">{p.ratio}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 两条路径 CTA */}
                <div className="grid md:grid-cols-2 gap-5 pt-4">
                  {/* 路径1：升级完整企划 */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-accent/20">
                    <h4 className="font-bold text-primary">需要完整企划方案？</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      初稿仅供参考，申请人工企划服务，结合您的店铺实际数据定制完整方案
                    </p>
                    <a
                      href="/planning"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      前往人工企划服务
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>

                  {/* 路径2：去选品 */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-accent/5 to-primary/5 border border-primary/20">
                    <h4 className="font-bold text-primary">有方向了？直接选品</h4>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      根据初稿框架，直接跳转买手选品，按风格、色系筛选优质货源
                    </p>
                    <a
                      href="/buyer"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                    >
                      进入买手选品
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* 底部操作 */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    onClick={() => { setStep(1); setReport(null); }}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    重新生成
                  </button>
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                  >
                    <Download className="w-4 h-4" />
                    下载完整Word报告
                  </button>
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
                <h4 className="font-bold text-primary">AI 快速初稿</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">本页</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />即时生成，免费使用</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />基于通用市场数据</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />框架型初稿，供参考</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />可下载简化版报告</li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="text-lg font-bold text-accent">免费</span>
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

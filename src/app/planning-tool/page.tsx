"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import AdBanner from "@/components/AdBanner";
import { PaywallModal } from "@/components/PaywallModal";

const seasons = ["春夏", "夏秋", "秋冬", "冬春"];
const styleTypes = [
  "少女型",
  "优雅型",
  "浪漫型",
  "少年型",
  "时尚型",
  "古典型",
  "自然型",
  "戏剧型",
];
const colorSeasons = [
  "春季型",
  "夏季型",
  "秋季型",
  "冬季型",
];
const priceBands = [
  "入门款（99-199元）",
  "主销款（199-399元）",
  "品质款（399-699元）",
  "旗舰款（699元+）",
];

export default function PlanningToolPage() {
  const [step, setStep] = useState(1);
  const [showPaywall, setShowPaywall] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<null | PlanningReport>(null);
  const [formData, setFormData] = useState({
    brandName: "",
    season: "春夏",
    colorSeason: "春季型",
    mainStyle: "优雅型",
    priceBand: "主销款（199-399元）",
    targetAge: "25-35岁",
    brandPositioning: "",
    customerProfile: "",
  });

  type PlanningReport = {
    brandName: string;
    season: string;
    summary: string;
    colorPlan: { type: string; ratio: string; colors: string[] }[];
    stylePlan: { style: string; trafficRatio: string; profitRatio: string }[];
    productStructure: { type: string; ratio: string; desc: string }[];
    pricePlan: { band: string; range: string; ratio: string; strategy: string }[];
    quartersPlan: { phase: string; items: string[] }[];
  };

  const handleGenerate = async () => {
    setGenerating(true);
    // MVP: 用faker逻辑生成本地报告
    // 正式版：对接AI API
    await new Promise((r) => setTimeout(r, 2000)); // 模拟2秒

    const mockReport: PlanningReport = {
      brandName: formData.brandName || "示例品牌",
      season: formData.season,
      summary: `基于${formData.colorSeason}色彩季型和${formData.mainStyle}风格定位，为${formData.brandName || "贵品牌"}量身定制的${formData.season}商品企划方案。本企划充分结合市场趋势与品牌调性，实现科学选品与利润最大化。`,      colorPlan: [
        { type: "基础色", ratio: "40%", colors: ["黑", "白", "灰", "藏青"] },
        { type: "主题色", ratio: "35%", colors: ["雾霾蓝", "米白", "灰粉"] },
        { type: "点缀色", ratio: "15%", colors: ["珊瑚橘", "丁香紫"] },
        { type: "流行色", ratio: "10%", colors: ["数字薰衣草", "薄荷绿"] },
      ],
      stylePlan: styleTypes.map((s) => ({
        style: s,
        trafficRatio: s === formData.mainStyle ? "25%" : `${Math.round(75 / 7)}%`,
        profitRatio: s === formData.mainStyle ? "55%" : `${Math.round(45 / 7)}%`,
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
        { phase: "第一波段（上半月）", items: ["2021春夏流行趋势分析", `${formData.mainStyle}风格商品结构规划`, "色彩企划矩阵（${formData.colorSeason}）", "价格带分布策略"] },
        { phase: "第二波段（下半月）", items: ["爆款预测与选品清单", "供应商匹配与议价方案", "库存周转计划", "营销活动配合"] },
        { phase: "第三波段（次月补充）", items: ["销售数据跟踪与动态调整", "补货追单建议", "滞销款处理方案", "下一季企划预研"] },
      ],
    };

    setReport(mockReport);
    setGenerating(false);
    setStep(3);
  };

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="完整企划报告"
        description="付费后可下载完整Word版企划报告（含12个模块、50+数据分析维度）"
        type="single"
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <FileText className="w-4 h-4" />
              AI商品企划工具
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              智能商品企划生成器
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed max-w-2xl">
              输入品牌关键信息，一键生成专业商品企划报告。基于色彩季型、风格定位与价格带策略，
              结合市场趋势数据，输出科学、可落地的企划方案。
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {["填写信息", "生成报告", "预览下载"].map((label, i) => (
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

          {/* Step 1: 填写表单 */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-primary">填写品牌信息</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    请填写以下信息，系统将为您生成个性化的商品企划报告
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      品牌名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm"
                      placeholder="请输入品牌名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      目标季节 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm bg-white"
                    >
                      {seasons.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      客户色彩季型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.colorSeason}
                      onChange={(e) => setFormData({ ...formData, colorSeason: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm bg-white"
                    >
                      {colorSeasons.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      主风格定位 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.mainStyle}
                      onChange={(e) => setFormData({ ...formData, mainStyle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm bg-white"
                    >
                      {styleTypes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      主价格带 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.priceBand}
                      onChange={(e) => setFormData({ ...formData, priceBand: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm bg-white"
                    >
                      {priceBands.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      目标客群年龄
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

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    品牌定位描述（可选）
                  </label>
                  <textarea
                    value={formData.brandPositioning}
                    onChange={(e) => setFormData({ ...formData, brandPositioning: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-sm resize-none"
                    placeholder="请描述您的品牌定位、风格主张等（选填）"
                  />
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => formData.brandName.trim() && setStep(2)}
                    disabled={!formData.brandName.trim()}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    生成企划报告
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Generating */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
                  <Loader2 className="w-8 h-8 text-accent animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-primary mb-2">正在生成企划报告...</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  正在结合{formData.colorSeason}色彩季型与{formData.mainStyle}风格定位，
                  生成个性化的商品企划方案，预计需要10-15秒。
                </p>

                {/* Progress Steps */}
                <div className="mt-10 max-w-md mx-auto space-y-3 text-left">
                  {[
                    "分析市场趋势与竞品动态",
                    "匹配色彩季型与风格定位",
                    "规划商品结构与价格带分布",
                    "生成波段上新计划",
                    "输出完整企划报告",
                  ].map((item, i) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.5 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        i < 3 ? "bg-accent/20 text-accent" : "bg-gray-100 text-gray-400"
                      }`}>
                        {i < 3 ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                      </div>
                      <span className={i < 3 ? "text-primary font-medium" : "text-gray-400"}>
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Report Preview */}
            {step === 3 && report && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    企划报告已生成
                  </div>
                  <h2 className="text-2xl font-bold text-primary">{report.brandName} · {report.season}商品企划</h2>
                  <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
                    {report.summary}
                  </p>
                </div>

                {/* Color Plan */}
                <section className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-primary mb-4">色彩企划矩阵</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {report.colorPlan.map((c) => (
                      <div key={c.type} className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-primary">{c.type}</span>
                          <span className="text-xs text-accent font-bold">{c.ratio}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {c.colors.map((color) => (
                            <span
                              key={color}
                              className="px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600"
                            >
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Product Structure */}
                <section className="bg-white rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-primary mb-4">商品结构规划</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {report.productStructure.map((p) => (
                      <div key={p.type} className="bg-muted/30 rounded-xl p-4">
                        <div className="text-2xl font-bold text-accent">{p.ratio}</div>
                        <div className="font-semibold text-primary mt-1">{p.type}</div>
                        <p className="text-xs text-muted-foreground mt-1.5">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Price Plan */}
                <section className="bg-muted/30 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-primary mb-4">价格带企划</h3>
                  <div className="space-y-3">
                    {report.pricePlan.map((p) => (
                      <div key={p.band} className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                          <div className="font-semibold text-primary">{p.band}</div>
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

                {/* Download CTA */}
                <div className="text-center py-6">
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                  >
                    <Download className="w-4 h-4" />
                    下载完整Word报告
                  </button>
                  <p className="mt-3 text-xs text-muted-foreground">
                    付费后可下载完整版Word文档（含12个模块、50+数据分析维度）
                  </p>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => { setStep(1); setReport(null); }}
                    className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    重新生成
                  </button>
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    升级完整版
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <AdBanner position="inline" />
      </div>
    </>
  );
}

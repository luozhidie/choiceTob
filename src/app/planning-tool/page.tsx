"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Download, Eye, Sparkles, ChevronRight,
  CheckCircle2, Loader2, Wand2, ArrowRight, Store,
  Ruler, MessageSquare, CreditCard, Check, LogIn, UserPlus,
} from "lucide-react";
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
/* 价格配置 */
const AI_REPORT_PRICE = 2980; // 非会员价（分）
const AI_REPORT_MEMBER_PRICE = 980; // 基础会员价（分）
const AI_REPORT_ORIGINAL_PRICE = 3980; // 划线原价（分）

export default function PlanningToolPage() {
  const [step, setStep] = useState<"landing" | "form" | "generating" | "done">("landing");
  const [user, setUser] = useState<any>(null);
  const [isBasicMember, setIsBasicMember] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

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

  // 初始化：检测登录状态 + 会员状态 + 是否已付费
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 检测是否基础会员
        const { data: membership } = await supabase
          .from("memberships")
          .select("type, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (membership && (membership.type === "basic" || membership.type === "pro" || membership.type === "premium")) {
          setIsBasicMember(true);
        }

        // 检测是否已付费（查看 planning_payments 表有无 paid 记录）
        const { data: payments } = await supabase
          .from("planning_payments")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("status", "paid")
          .limit(1);
        if (payments && payments.length > 0) {
          setHasPaid(true);
          setStep("form"); // 已付费，直接进入填资料
        } else {
          setStep("landing"); // 未付费，显示介绍+支付按钮
        }
      } else {
        setStep("landing"); // 未登录，显示介绍+登录按钮
      }
    };
    init();
  }, []);

  const getColorLabel = (v: string) => COLOR_PREFERENCES.find(c => c.value === v)?.label || v;
  const getStyleLabel = (v: string) => MARKET_STYLES.find(s => s.value === v)?.label || v;

  /* 模拟支付 */
  const handlePay = async () => {
    if (!user) return;
    const amount = isBasicMember ? AI_REPORT_MEMBER_PRICE : AI_REPORT_PRICE;
    try {
      // 创建支付记录（模拟支付，直接标记paid）
      const { data: payment, error } = await supabase
        .from("planning_payments")
        .insert([{
          user_id: user.id,
          amount,
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "mock",
          mock_paid: true,
        }])
        .select("id")
        .single();

      if (error) {
        console.error("支付失败:", error);
        alert("支付失败，请重试");
        return;
      }

      setHasPaid(true);
      setStep("form");
    } catch (err) {
      console.error("支付异常:", err);
      alert("支付异常，请重试");
    }
  };

  /* 提交资料 → 调用AI生成报告 */
  const handleSubmit = async () => {
    if (!user) return;
    setGenerating(true);
    setStep("generating");

    try {
      // 1. 保存需求到 planning_requests 表
      const { data: req, error: reqError } = await supabase
        .from("planning_requests")
        .insert([{
          user_id: user.id,
          user_email: user.email,
          store_name: formData.brandName,
          store_type: formData.storeType,
          store_scale: formData.storeScale,
          style_preference: formData.marketStyle,
          season: formData.season,
          budget_range: formData.priceBand,
          contact: formData.contact,
          status: "paid",
          paid_amount: isBasicMember ? AI_REPORT_MEMBER_PRICE : AI_REPORT_PRICE,
          paid_at: new Date().toISOString(),
          problems: formData.problems || null,
          notes: formData.notes || null,
        }])
        .select("id")
        .single();

      if (reqError || !req) {
        console.error("保存需求失败:", reqError);
        alert("提交失败，请重试");
        setGenerating(false);
        setStep("form");
        return;
      }

      setRequestId(req.id);

      // 2. 调用 /api/generate-planning 生成AI报告
      const colorLabel = getColorLabel(formData.colorPref);
      const styleLabel = getStyleLabel(formData.marketStyle);

      const aiRes = await fetch("/api/generate-planning", {
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
        }),
      });

      let reportJson = null;
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        reportJson = aiData.report;
      }

      // 3. 保存报告到 planning_reports 表
      const { data: report, error: reportError } = await supabase
        .from("planning_reports")
        .insert([{
          user_id: user.id,
          request_id: req.id,
          title: `${formData.brandName} · ${formData.season}企划报告`,
          report_json: reportJson,
          amount: isBasicMember ? AI_REPORT_MEMBER_PRICE : AI_REPORT_PRICE,
          status: "draft",
          category: "ai_generated",
        }])
        .select("id")
        .single();

      if (reportError || !report) {
        console.error("保存报告失败:", reportError);
      } else {
        // 4. 更新 planning_requests 的 report_id
        await supabase
          .from("planning_requests")
          .update({ report_id: report.id, status: "completed" })
          .eq("id", req.id);
      }

      setStep("done");
    } catch (err) {
      console.error("提交生成失败:", err);
      alert("生成失败，请重试");
      setStep("form");
    } finally {
      setGenerating(false);
    }
  };

  /* 跳转登录 */
  const goLogin = () => {
    window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
  };

  /* ======== 渲染：生成中动画 ======== */
  if (step === "generating") {
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
          <h2 className="text-2xl font-bold text-primary mb-2">AI正在生成企划报告...</h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            正在结合{getStyleLabel(formData.marketStyle)}风格定位与{getColorLabel(formData.colorPref)}色系偏好，生成个性化商品企划报告
          </p>
          <div className="mt-8 max-w-sm mx-auto space-y-2 text-left">
            {[
              "分析市场趋势与竞品动态",
              "匹配色系偏好与风格定位",
              "规划商品结构与价格带分布",
              "生成波段上新建议",
              "输出完整企划报告",
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

  /* ======== 渲染：着陆页（未登录/未付费） ======== */
  if (step === "landing") {
    const price = isBasicMember ? AI_REPORT_MEMBER_PRICE : AI_REPORT_PRICE;
    const originalPrice = AI_REPORT_ORIGINAL_PRICE;

    return (
      <section className="min-h-screen bg-white">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          </div>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
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
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                ¥{price / 100} 获取专属<br />商品企划报告
              </h1>
              <p className="mt-4 text-white/80 leading-relaxed text-lg">
                填写店铺信息，AI精准匹配类型+体量+风格，1-2个工作日交付完整报告。
              </p>
              <div className="mt-8 flex items-center gap-4">
                {!user ? (
                  <button
                    onClick={goLogin}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/30 text-base"
                  >
                    <LogIn className="w-5 h-5" />
                    登录后购买
                  </button>
                ) : (
                  <button
                    onClick={handlePay}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors shadow-lg shadow-accent/30 text-base"
                  >
                    <CreditCard className="w-5 h-5" />
                    立即支付 ¥{price / 100}
                  </button>
                )}
                <span className="text-white/50 text-sm line-through">原价 ¥{originalPrice / 100}</span>
                {isBasicMember && (
                  <span className="text-[11px] font-bold text-green-300 bg-green-500/20 px-2 py-1 rounded-full">基础会员价</span>
                )}
              </div>
              {!user && (
                <p className="mt-3 text-white/50 text-xs">新用户请先注册登录，支付后即刻进入企划工具</p>
              )}
            </motion.div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl font-bold text-primary text-center mb-10">报告包含哪些内容？</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: "🎨", title: "色彩企划", desc: "基础色/主题色/点缀色/流行色四层配比，精准匹配VIP色彩季型分布" },
              { icon: "👗", title: "风格企划", desc: "4-6个主流风格组合，每个含场合/氛围/流量占比/利润占比" },
              { icon: "📦", title: "商品结构", desc: "引流款/利润款/形象款/搭配款合理配比，直接指导采购" },
              { icon: "💰", title: "价格带策略", desc: "基于你的主力价格带拆分4档，含定价策略和毛利测算" },
              { icon: "📅", title: "波段上新计划", desc: "3个波段具体事项，含爆款预测/陈列建议/补货策略" },
              { icon: "📊", title: "货盘建议", desc: "核心SKU清单+避坑清单+库存策略，可落地执行" },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-primary mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* ======== 渲染：填资料表单（已付费） ======== */
  if (step === "form") {
    return (
      <section className="min-h-screen bg-white">
        {/* Hero */}
        <div className="bg-primary text-white py-8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold">填写店铺资料</h1>
            <p className="mt-1 text-white/70 text-sm">精准匹配：类型 + 体量 + 风格，AI为您定制专属企划报告</p>
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
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
                  提交并生成报告
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    );
  }

  /* ======== 渲染：完成页 ======== */
  if (step === "done") {
    return (
      <section className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-2">报告已生成！</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            您的AI企划报告已生成完毕，点击下方按钮查看完整报告。如需调整，可在报告中申请人工审核。
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/my-reports"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              <FileText className="w-5 h-5" />
              查看我的报告
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              返回首页
            </a>
          </div>
        </motion.div>
      </section>
    );
  }

  return null;
}

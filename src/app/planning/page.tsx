"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PaywallModal } from "@/components/PaywallModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, ArrowRight, Database, FileOutput, Activity,
  PieChart, FileText, CheckCircle2, Home, X, Loader2,
  Palette, Sparkles, Eye, Wand2, LayoutGrid, Layers,
  DollarSign, Calendar, Filter, Zap, Phone, ShoppingBag,
  MapPin, Ruler, Users, Tag, MessageSquare,
} from "lucide-react";

/* ===================== 12季色彩（仅案例模板筛选用） ===================== */
const COLOR_SEASONS = [
  { value: "light_warm", label: "浅暖型", group: "春" },
  { value: "warm_bright", label: "暖亮型", group: "春" },
  { value: "clear_warm", label: "净暖型", group: "春" },
  { value: "light_cool", label: "浅冷型", group: "夏" },
  { value: "soft_cool", label: "柔冷型", group: "夏" },
  { value: "cool_soft", label: "冷柔型", group: "夏" },
  { value: "warm_soft", label: "暖柔型", group: "秋" },
  { value: "soft_warm", label: "柔暖型", group: "秋" },
  { value: "deep_warm", label: "深暖型", group: "秋" },
  { value: "clear_cool", label: "净冷型", group: "冬" },
  { value: "cool_bright", label: "冷亮型", group: "冬" },
  { value: "deep_cool", label: "深冷型", group: "冬" },
];

const STYLES = [
  { value: "shao_nv", label: "少女型" },
  { value: "you_ya", label: "优雅型" },
  { value: "lang_man_f", label: "浪漫型" },
  { value: "shao_nian_f", label: "少年型" },
  { value: "shi_shang_f", label: "时尚型" },
  { value: "gu_dian_f", label: "古典型" },
  { value: "zi_ran_f", label: "自然型" },
  { value: "xi_ju_f", label: "戏剧型" },
];

/* ===================== 企划分类 ===================== */
const PLAN_TYPES = [
  { value: "structure", label: "商品结构企划", icon: Layers, desc: "引流款/利润款/形象款比例规划", price: 59800 },
  { value: "style", label: "风格企划", icon: Palette, desc: "基于风格类型的商品组合规划", price: 59800 },
  { value: "color", label: "色彩企划", icon: Sparkles, desc: "基于色彩季型的色彩组合规划", price: 59800 },
  { value: "price", label: "价格带企划", icon: DollarSign, desc: "价格带分布与商品定价策略", price: 59800 },
  { value: "quarter", label: "季度企划书", icon: Calendar, desc: "完整的季度企划书输出", price: 59800 },
  { value: "full", label: "全案企划", icon: Wand2, desc: "包含以上所有企划内容的完整方案", price: 99800 },
];

/* ===================== 市场风格定位（用户友好的商业表达） ===================== */
const MARKET_STYLES = [
  { value: "minimal_commute", label: "简约通勤", desc: "干练利落，适合职场" },
  { value: "french_elegant", label: "法式优雅", desc: "浪漫精致，高级感" },
  { value: "korean_fresh", label: "韩系清新", desc: "温柔甜美，减龄感" },
  { value: "japanese_art", label: "日系文艺", desc: "自然随性，层次感" },
  { value: "retro_vintage", label: "复古港风", desc: "经典怀旧，氛围感" },
  { value: "sport_casual", label: "运动休闲", desc: "舒适活力，年轻化" },
  { value: "luxury_minimal", label: "轻奢极简", desc: "低调奢华，品质感" },
  { value: "street_trend", label: "街头潮牌", desc: "个性张扬，潮流感" },
  { value: "chinese_style", label: "新中式", desc: "传统现代，东方美学" },
  { value: "bohemian", label: "波西米亚", desc: "自由浪漫，异域风" },
];

/* ===================== 色系偏好 ===================== */
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

/* ===================== 企划报告接口 ===================== */
interface PlanningReport {
  id: string;
  title: string;
  category: string;
  content: string;
  images: string[];
  color_season: string | null;
  style_type: string | null;
  is_published: boolean;
  is_template: boolean;
  created_at: string;
}

/* ===================== 动画 ===================== */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ===================== 页面 ===================== */
export default function PlanningPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [reports, setReports] = useState<PlanningReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"templates" | "create">("templates");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterStyle, setFilterStyle] = useState("");

  // 创建企划表单 — 改用商业表达
  const [createForm, setCreateForm] = useState({
    plan_type: "full",
    market_style: "",      // 市场风格定位
    color_pref: "",        // 色系偏好
    brand_name: "",
    target_age: "",
    price_range: "",
    shop_size: "",         // 店铺面积
    location: "",          // 店铺位置/城市
    notes: "",
    contact_phone: "",     // 联系电话
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 企划详情灯箱
  const [selectedReport, setSelectedReport] = useState<PlanningReport | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const supabase = createClient();

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("planning_reports")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!error && data) setReports(data as PlanningReport[]);
    setLoading(false);
  };

  // 筛选案例
  const filteredReports = useMemo(() => {
    let list = [...reports];
    if (filterCategory) list = list.filter((r) => r.category === filterCategory);
    if (filterColor) list = list.filter((r) => r.color_season === filterColor);
    if (filterStyle) list = list.filter((r) => r.style_type === filterStyle);
    return list;
  }, [reports, filterCategory, filterColor, filterStyle]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // 检查登录状态
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setShowPaywall(true);
      setSubmitting(false);
      return;
    }

    // 创建企划订单记录
    const planType = PLAN_TYPES.find((p) => p.value === createForm.plan_type);
    const { error } = await supabase.from("planning_orders").insert([{
      user_id: user.id,
      plan_type: createForm.plan_type,
      color_season: createForm.color_pref || null,
      style_type: createForm.market_style || null,
      brand_name: createForm.brand_name || null,
      target_age: createForm.target_age || null,
      price_range: createForm.price_range || null,
      notes: `店铺面积: ${createForm.shop_size || '未填写'}; 店铺位置: ${createForm.location || '未填写'}; 联系电话: ${createForm.contact_phone || '未填写'}; 补充说明: ${createForm.notes || '无'}` || null,
      amount: planType?.price || 59800,
      status: "pending",
    }]);

    if (error) {
      alert("提交失败：" + error.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="创建商品企划"
        description="登录后付费即可创建专属企划方案"
        type="single"
      />

      {/* 企划详情灯箱 */}
      <AnimatePresence>
        {showDetail && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDetail(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-xs font-medium">
                    {selectedReport.category}
                  </span>
                  <h3 className="text-lg font-bold text-primary">{selectedReport.title}</h3>
                </div>
                <button onClick={() => setShowDetail(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  {selectedReport.color_season && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {COLOR_SEASONS.find(c => c.value === selectedReport.color_season)?.label || selectedReport.color_season}
                    </span>
                  )}
                  {selectedReport.style_type && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                      {STYLES.find(s => s.value === selectedReport.style_type)?.label || selectedReport.style_type}
                    </span>
                  )}
                  {selectedReport.is_template && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">模板案例</span>
                  )}
                </div>
                {selectedReport.images && selectedReport.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {selectedReport.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-[4/3] rounded-xl overflow-hidden">
                        <img src={url} alt={`${selectedReport.title} - ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {selectedReport.content && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedReport.content}</p>
                  </div>
                )}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">想要同类企划方案？</p>
                  <button
                    onClick={() => { setShowDetail(false); setActiveTab("create"); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    创建我的企划 <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">商品企划</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div className="max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <PieChart className="w-4 h-4" /> 科学企划，利润最大化
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">商品企划</h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              基于店铺定位与客群画像，为您定制专属商品企划方案。从风格定位到色彩规划，从商品结构到价格策略，全流程科学规划。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => setActiveTab("create")} className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                <Wand2 className="w-5 h-5" /> 创建企划方案 <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveTab("templates")} className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                <Eye className="w-5 h-5" /> 查看案例模板
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== Tab 切换 ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3">
            <button onClick={() => setActiveTab("templates")} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "templates" ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <LayoutGrid className="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> 企划案例模板
            </button>
            <button onClick={() => setActiveTab("create")} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === "create" ? "bg-accent text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <Wand2 className="w-4 h-4 inline-block mr-1.5 -mt-0.5" /> 创建企划方案
            </button>
          </div>
        </div>
      </section>

      {/* ====== 企划案例模板 Tab ====== */}
      <AnimatePresence mode="wait">
        {activeTab === "templates" && (
          <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            {/* 筛选栏 */}
            <section className="bg-white border-b border-gray-100 py-3">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center gap-3">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">全部分类</option>
                    <option value="商品结构">商品结构企划</option>
                    <option value="风格企划">风格企划</option>
                    <option value="色彩企划">色彩企划</option>
                    <option value="价格带企划">价格带企划</option>
                    <option value="季度企划">季度企划书</option>
                    <option value="全案企划">全案企划</option>
                  </select>
                  <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">全部色彩季型</option>
                    {COLOR_SEASONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.group}·{c.label}</option>
                    ))}
                  </select>
                  <select value={filterStyle} onChange={(e) => setFilterStyle(e.target.value)} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">全部风格</option>
                    {STYLES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  {(filterCategory || filterColor || filterStyle) && (
                    <button onClick={() => { setFilterCategory(""); setFilterColor(""); setFilterStyle(""); }} className="text-xs text-accent hover:underline">清除筛选</button>
                  )}
                </div>
              </div>
            </section>

            {/* 案例网格 */}
            <section className="py-12 md:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
                    <span className="text-muted-foreground">加载中...</span>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="text-center py-16">
                    <LayoutGrid className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">{(filterCategory || filterColor || filterStyle) ? "没有匹配的企划案例" : "暂无企划案例，敬请期待"}</p>
                    {!filterCategory && !filterColor && !filterStyle && (
                      <button onClick={() => setActiveTab("create")} className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors">
                        创建第一个企划 <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((report, i) => (
                      <motion.div key={report.id} variants={fadeUp} initial="hidden" animate="visible" custom={i} className="group cursor-pointer" onClick={() => { setSelectedReport(report); setShowDetail(true); }}>
                        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30">
                          <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                            {report.images && report.images.length > 0 ? (
                              <img src={report.images[0]} alt={report.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><FileText className="w-12 h-12 text-primary/20" /></div>
                            )}
                            <div className="absolute top-3 left-3 flex items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/90 text-white font-medium">{report.category}</span>
                              {report.is_template && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/90 text-white font-medium">模板</span>}
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">查看详情</span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex items-center gap-1.5 mb-2">
                              {report.color_season && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                  {COLOR_SEASONS.find(c => c.value === report.color_season)?.label || report.color_season}
                                </span>
                              )}
                              {report.style_type && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                                  {STYLES.find(s => s.value === report.style_type)?.label || report.style_type}
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">{report.title}</h4>
                            {report.content && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{report.content.substring(0, 80)}...</p>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 企划全流程说明 */}
            <section className="py-16 lg:py-24 bg-muted">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <motion.div className="text-center max-w-2xl mx-auto mb-14" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
                  <span className="text-accent font-semibold text-sm tracking-widest uppercase">企划全流程</span>
                  <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">商品企划全流程</h2>
                  <p className="mt-4 text-muted-foreground leading-relaxed">从数据到决策，从规划到执行，形成闭环的企划管理体系</p>
                </motion.div>
                <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
                  {[
                    { icon: Database, title: "数据输入", items: ["历史销售数据", "市场趋势数据", "客户画像数据", "库存结构数据"] },
                    { icon: FileOutput, title: "企划输出", items: ["商品结构规划", "色彩企划方案", "价格带分布", "季度企划书"] },
                    { icon: Activity, title: "执行跟踪", items: ["到货进度跟踪", "销售数据监控", "库存预警提醒", "方案动态调整"] },
                  ].map((step, i) => (
                    <motion.div key={step.title} variants={fadeUp} custom={i}>
                      <div className="flex flex-col h-full p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary"><step.icon className="w-6 h-6" /></div>
                          <div>
                            <span className="text-xs text-accent font-semibold">STEP {i + 1}</span>
                            <h3 className="text-lg font-bold text-primary">{step.title}</h3>
                          </div>
                        </div>
                        <ul className="flex flex-col gap-3">
                          {step.items.map((item) => (
                            <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-accent shrink-0" />{item}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 创建企划方案 Tab ====== */}
      <AnimatePresence mode="wait">
        {activeTab === "create" && (
          <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            {!submitted ? (
              <section className="py-12 md:py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="grid lg:grid-cols-5 gap-8">
                    {/* 左侧：企划类型选择 */}
                    <div className="lg:col-span-2">
                      <h2 className="text-2xl font-bold text-primary mb-2">选择企划类型</h2>
                      <p className="text-sm text-muted-foreground mb-6">根据您的需求选择企划类型，不同类型侧重不同维度</p>
                      <div className="space-y-3">
                        {PLAN_TYPES.map((plan) => (
                          <button
                            key={plan.value}
                            onClick={() => setCreateForm(f => ({ ...f, plan_type: plan.value }))}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                              createForm.plan_type === plan.value
                                ? "border-accent bg-accent/5 shadow-md"
                                : "border-gray-100 bg-white hover:border-accent/30 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${createForm.plan_type === plan.value ? "bg-accent text-white" : "bg-primary/10 text-primary"}`}>
                                <plan.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-primary text-sm">{plan.label}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                              </div>
                              <span className={`text-sm font-bold ${createForm.plan_type === plan.value ? "text-accent" : "text-primary"}`}>
                                ¥{(plan.price / 100).toFixed(0)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 右侧：企划配置表单 */}
                    <div className="lg:col-span-3">
                      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                        <h2 className="text-xl font-bold text-primary mb-6">配置您的企划方案</h2>

                        <form onSubmit={handleCreateSubmit} className="space-y-5">
                          {/* 风格定位 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                              <Tag className="w-4 h-4 inline-block mr-1 -mt-0.5 text-accent" />
                              店铺风格定位 <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {MARKET_STYLES.map((s) => (
                                <button
                                  key={s.value}
                                  type="button"
                                  onClick={() => setCreateForm(f => ({ ...f, market_style: f.market_style === s.value ? "" : s.value }))}
                                  className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors border text-left ${
                                    createForm.market_style === s.value
                                      ? "bg-accent text-white border-accent"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-accent/30"
                                  }`}
                                >
                                  <span className="block font-semibold">{s.label}</span>
                                  <span className={`text-[10px] ${createForm.market_style === s.value ? "text-white/70" : "text-muted-foreground"}`}>{s.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 色系偏好 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                              <Palette className="w-4 h-4 inline-block mr-1 -mt-0.5 text-accent" />
                              色系偏好 <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {COLOR_PREFERENCES.map((c) => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => setCreateForm(f => ({ ...f, color_pref: f.color_pref === c.value ? "" : c.value }))}
                                  className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors border text-left ${
                                    createForm.color_pref === c.value
                                      ? "bg-primary text-white border-primary"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30"
                                  }`}
                                >
                                  <span className="block font-semibold">{c.label}</span>
                                  <span className={`text-[10px] ${createForm.color_pref === c.value ? "text-white/70" : "text-muted-foreground"}`}>{c.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 品牌名称 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">品牌名称</label>
                            <input
                              type="text"
                              value={createForm.brand_name}
                              onChange={(e) => setCreateForm(f => ({ ...f, brand_name: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                              placeholder="输入品牌名称（如有）"
                            />
                          </div>

                          {/* 目标客群年龄 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                              <Users className="w-4 h-4 inline-block mr-1 -mt-0.5 text-accent" />
                              目标客群年龄段
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {["18-25", "25-35", "35-45", "45+"].map((age) => (
                                <button
                                  key={age}
                                  type="button"
                                  onClick={() => setCreateForm(f => ({ ...f, target_age: f.target_age === age ? "" : age }))}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                    createForm.target_age === age
                                      ? "bg-primary text-white border-primary"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30"
                                  }`}
                                >
                                  {age}岁
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 目标价格带 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                              <DollarSign className="w-4 h-4 inline-block mr-1 -mt-0.5 text-accent" />
                              目标价格带
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {["200-500", "500-1000", "1000-2000", "2000+"].map((range) => (
                                <button
                                  key={range}
                                  type="button"
                                  onClick={() => setCreateForm(f => ({ ...f, price_range: f.price_range === range ? "" : range }))}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                    createForm.price_range === range
                                      ? "bg-accent text-white border-accent"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-accent/30"
                                  }`}
                                >
                                  ¥{range}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 店铺面积 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                              <Ruler className="w-4 h-4 inline-block mr-1 -mt-0.5 text-accent" />
                              店铺面积
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {["30-50㎡", "50-80㎡", "80-120㎡", "120-200㎡", "200㎡+"].map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setCreateForm(f => ({ ...f, shop_size: f.shop_size === size ? "" : size }))}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                    createForm.shop_size === size
                                      ? "bg-primary text-white border-primary"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/30"
                                  }`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 店铺位置 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                              <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5 text-accent" />
                              店铺位置/城市
                            </label>
                            <input
                              type="text"
                              value={createForm.location}
                              onChange={(e) => setCreateForm(f => ({ ...f, location: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                              placeholder="如：杭州武林银泰、成都春熙路..."
                            />
                          </div>

                          {/* 联系电话 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                              <Phone className="w-4 h-4 inline-block mr-1 -mt-0.5 text-accent" />
                              联系电话 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              value={createForm.contact_phone}
                              onChange={(e) => setCreateForm(f => ({ ...f, contact_phone: e.target.value }))}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                              placeholder="请输入您的手机号码"
                            />
                          </div>

                          {/* 补充说明 */}
                          <div>
                            <label className="block text-sm font-medium text-primary mb-2">
                              <MessageSquare className="w-4 h-4 inline-block mr-1 -mt-0.5 text-accent" />
                              补充说明
                            </label>
                            <textarea
                              value={createForm.notes}
                              onChange={(e) => setCreateForm(f => ({ ...f, notes: e.target.value }))}
                              rows={3}
                              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                              placeholder="其他特殊需求或说明，如：希望重点规划哪个季节、是否有特定品类需求..."
                            />
                          </div>

                          {/* 价格与提交 */}
                          <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <span className="text-sm text-muted-foreground">企划费用</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-accent">
                                    ¥{(PLAN_TYPES.find(p => p.value === createForm.plan_type)?.price || 59800) / 100}
                                  </span>
                                  <span className="text-xs text-muted-foreground">/次</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <Zap className="w-3 h-3" /> 充值会员享专属折扣
                                </div>
                                <Link href="/buyer-center" className="text-xs text-primary hover:text-accent">了解充值档位 →</Link>
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={submitting || !createForm.market_style || !createForm.color_pref || !createForm.contact_phone}
                              className="w-full py-3 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                            >
                              {submitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />提交中...</>
                              ) : (
                                <>
                                  <Wand2 className="w-5 h-5" />
                                  提交企划需求
                                  <ChevronRight className="w-5 h-5" />
                                </>
                              )}
                            </button>
                            <p className="mt-2 text-xs text-center text-muted-foreground">提交后专业顾问将在48小时内联系您，确认需求后开始制作</p>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              /* 提交成功 — 三条路径 */
              <section className="py-16">
                <div className="mx-auto max-w-4xl px-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center mb-10"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary">企划需求已提交！</h2>
                    <p className="mt-3 text-muted-foreground leading-relaxed max-w-lg mx-auto">
                      您的商品企划需求已成功提交。专业顾问将在48小时内与您联系，确认需求后开始制作企划方案。
                    </p>
                  </motion.div>

                  {/* 三条路径卡片 */}
                  <motion.div
                    className="grid md:grid-cols-3 gap-5"
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                  >
                    {/* 路径1：等待出方案 */}
                    <motion.div variants={fadeUp} custom={0}>
                      <div className="h-full p-6 rounded-2xl bg-white border-2 border-accent/20 shadow-sm hover:shadow-lg hover:border-accent/40 transition-all duration-300 text-center">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                          <Wand2 className="w-6 h-6 text-accent" />
                        </div>
                        <h3 className="font-bold text-primary text-lg">等待出方案</h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          顾问确认需求后，为您定制专属企划方案，包含商品结构、色彩搭配、价格策略等完整内容
                        </p>
                        <div className="mt-4 px-3 py-2 bg-amber-50 rounded-lg">
                          <p className="text-xs text-amber-700">预计48小时内出初稿</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* 路径2：直接联系我 */}
                    <motion.div variants={fadeUp} custom={1}>
                      <div className="h-full p-6 rounded-2xl bg-white border-2 border-primary/20 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 text-center">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Phone className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-bold text-primary text-lg">直接联系我</h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          想更快沟通？直接联系我，一对一深度交流您的店铺需求
                        </p>
                        <a
                          href="mailto:luozhidie@live.cn"
                          className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          联系我
                        </a>
                      </div>
                    </motion.div>

                    {/* 路径3：跳转买手选品 */}
                    <motion.div variants={fadeUp} custom={2}>
                      <Link href="/buyer" className="block h-full">
                        <div className="h-full p-6 rounded-2xl bg-white border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300 text-center cursor-pointer">
                          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                            <ShoppingBag className="w-6 h-6 text-accent" />
                          </div>
                          <h3 className="font-bold text-primary text-lg">去选品</h3>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            已经有方向了？直接跳转买手选品，按风格、色系、价格带筛选优质货源
                          </p>
                          <span className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors">
                            进入买手选品 <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  </motion.div>

                  {/* 底部返回 */}
                  <div className="mt-10 text-center">
                    <button
                      onClick={() => { setSubmitted(false); setActiveTab("templates"); }}
                      className="text-sm text-primary hover:text-accent transition-colors"
                    >
                      ← 返回查看企划案例
                    </button>
                  </div>
                </div>
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== CTA ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 sm:px-12 lg:px-20 py-14 sm:py-20 text-center text-white"
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">开启科学企划之旅</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                从经验企划到数据企划，基于店铺定位与客群画像，一键生成季度企划方案
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => setActiveTab("create")} className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                  创建企划方案 <ChevronRight className="w-5 h-5" />
                </button>
                <Link href="/buyer" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                  了解选品服务 <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

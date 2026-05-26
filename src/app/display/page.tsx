"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { PaywallModal } from "@/components/PaywallModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { COLOR_SEASONS_PRO, ALL_STYLES, STYLE_KEY_MAP } from "@/lib/styles";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  ChevronRight, ArrowRight, LayoutGrid, Eye, Shirt, Palette,
  Ruler, CheckCircle2, Home, Loader2, X, ZoomIn,
  Filter, Search, Grid3X3, List, Heart, Share2,
  ShoppingCart, Star, Info, Layers, Maximize2,
  Lock, MessageCircle, Smartphone, Copy, Check, Clock, CreditCard, Crown, Sparkles,
} from "lucide-react";

/* ==================== 色彩季型（用户端通俗色系名）=================== */
const COLOR_SEASONS = COLOR_SEASONS_PRO.map(c => ({
  value: c.value,
  label: c.marketLabel,
  group: c.group,
}));

/* ==================== 风格类型（用户端通俗风格名）=================== */
const STYLES = ALL_STYLES.map(s => ({ value: s.value, label: s.label }));

/* ==================== 用户端市场术语：色彩偏好 ==================== */
const DISPLAY_COLOR_OPTIONS = [
  { value: "warm", label: "暖色系" },
  { value: "cool", label: "冷色系" },
  { value: "neutral", label: "中性色" },
  { value: "morandi", label: "莫兰迪" },
  { value: "earth", label: "大地色" },
  { value: "pastel", label: "马卡龙" },
  { value: "vintage", label: "复古色" },
  { value: "monochrome", label: "黑白极简" },
];

/* 色彩偏好 → 12季型映射（用于筛选）*/
const DISPLAY_COLOR_TO_SEASONS: Record<string, string[]> = {
  warm: ["light_warm", "warm_bright", "clear_warm"],
  cool: ["light_cool", "soft_cool", "cool_soft"],
  neutral: ["warm_soft", "soft_warm"],
  morandi: ["soft_cool", "warm_soft", "soft_warm"],
  earth: ["deep_warm", "warm_soft", "soft_warm"],
  pastel: ["light_warm", "light_cool"],
  vintage: ["deep_warm", "deep_cool", "warm_bright"],
  monochrome: ["light_cool", "soft_cool", "cool_soft"],
};

/* ==================== 用户端市场术语：风格定位（女士八大+男士五大） ==================== */
const DISPLAY_STYLE_OPTIONS = [
  { value: "shao_nv", label: "淑女风" },
  { value: "you_ya", label: "知性风" },
  { value: "lang_man_f", label: "名媛风" },
  { value: "shao_nian_f", label: "中性风" },
  { value: "shi_shang_f", label: "潮牌风" },
  { value: "gu_dian_f", label: "职业风" },
  { value: "zi_ran_f", label: "休闲风" },
  { value: "xi_ju_f", label: "大牌风" },
  { value: "xi_ju_m", label: "气场型男" },
  { value: "zi_ran_m", label: "随性达人" },
  { value: "gu_dian_m", label: "精英绅士" },
  { value: "lang_man_m", label: "优雅先生" },
  { value: "shi_shang_m", label: "潮流先锋" },
];

/* ==================== 场景 ==================== */
const SCENARIOS = [
  { value: "workplace", label: "职场通勤" },
  { value: "date", label: "周末约会" },
  { value: "casual", label: "休闲出行" },
  { value: "party", label: "晚宴社交" },
  { value: "vacation", label: "度假旅行" },
];

/* ==================== 陈列分类 ==================== */
const DISPLAY_SECTIONS = [
  { value: "styles", label: "风格陈列", icon: Shirt, desc: "按风格类型分区陈列" },
  { value: "scenarios", label: "场景搭配", icon: LayoutGrid, desc: "场景化搭配推荐" },
  { value: "layouts", label: "门店布局", icon: Ruler, desc: "科学规划门店分区" },
];

/* ==================== 接口 ==================== */
interface DisplayItem {
  id: string;
  sort_order: number;
  title: string;
  label: string;
  image_url: string;
  section: string;
  color_season: string | null;
  style_type: string | null;
  scenario: string | null;
  description: string | null;
  is_published: boolean;
  created_at: string;
}

interface ProductItem {
  id: string;
  title: string;
  cover_image: string | null;
  price: number;
  category: string | null;
  subcategory: string | null;
  color_season: string | null;
  style_type: string | null;
}

/* ==================== 动画 ==================== */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ==================== 页面 ==================== */
export default function DisplayPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [recommendProducts, setRecommendProducts] = useState<ProductItem[]>([]);
  const [dailyLooks, setDailyLooks] = useState<{ id: string; title: string; colors: string[]; image_url: string | null; style: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选（专业值，用于实际过滤）
  const [filterColor, setFilterColor] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [filterScenario, setFilterScenario] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 用户端市场术语筛选
  const [filterUserColor, setFilterUserColor] = useState("");
  const [filterUserStyle, setFilterUserStyle] = useState("");

  // 灯箱
  const [lightboxItem, setLightboxItem] = useState<DisplayItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 收藏
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 当前陈列分类
  const [activeSection, setActiveSection] = useState("styles");

  /* ── 每日搭配订阅付费 ── */
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStep, setPayStep] = useState<"confirm" | "scan" | "pending">("confirm");
  const [payMethod, setPayMethod] = useState<"wechat" | "alipay">("wechat");
  const [selectedDailyPlan, setSelectedDailyPlan] = useState<"monthly" | "yearly">("yearly");
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subLoading, setSubLoading] = useState(true);

  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  const supabase = createClient();

  useEffect(() => { fetchAllData(); }, []);

  /* ── 检查每日搭配订阅状态 ── */
  useEffect(() => {
    const checkSubscription = async () => {
      setSubLoading(true);
      if (!user) { setIsSubscribed(false); setSubLoading(false); return; }
      try {
        // VIP会员自动有权限（会员免费看搭配）
        if (profile && profile.membership_type !== "none" && profile.membership_expires_at && new Date(profile.membership_expires_at) > new Date()) {
          setIsSubscribed(true);
          setSubLoading(false);
          return;
        }
        // 检查 daily_looks 订单
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data } = await supabase
          .from("membership_orders")
          .select("id")
          .eq("user_id", user.id)
          .eq("plan_id", "daily_looks")
          .eq("status", "confirmed")
          .gte("confirmed_at", thirtyDaysAgo.toISOString())
          .limit(1);
        setIsSubscribed(!!data && data.length > 0);
      } catch (err) {
        setIsSubscribed(false);
      } finally {
        setSubLoading(false);
      }
    };
    if (!authLoading) checkSubscription();
  }, [user, authLoading, profile]);

  /* ── 提交每日搭配付费订单 ── */
  const handleDailyLooksSubmit = async () => {
    if (!user) { router.push(`/login?redirect=/display`); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("membership_orders").insert([{
        user_id: user.id,
        plan_id: "daily_looks",
        plan_name: selectedDailyPlan === "yearly" ? "每日搭配灵感·年度订阅" : "每日搭配灵感·月度订阅",
        price: selectedDailyPlan === "yearly" ? 1198000 : 99900,
        payment_method: payMethod,
        status: "pending",
      }]);
      if (error) throw error;
      setPayStep("pending");
    } catch (err: any) {
      alert("提交失败：" + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [displayRes, productRes, looksRes] = await Promise.all([
        supabase.from("display_images").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
        supabase.from("buyer_products").select("id, title, cover_image, price, category, subcategory, color_season, style_type")
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .limit(8),
        supabase.from("daily_looks").select("*").eq("is_published", true).order("sort_order", { ascending: true }).limit(8),
      ]);

      if (!displayRes.error && displayRes.data) setItems(displayRes.data as DisplayItem[]);
      if (!productRes.error && productRes.data) setRecommendProducts(productRes.data as ProductItem[]);
      if (!looksRes.error && looksRes.data) {
        setDailyLooks(looksRes.data.map((d: any) => ({
          id: d.id,
          title: d.title,
          colors: Array.isArray(d.colors) ? d.colors : JSON.parse(d.colors || "[]"),
          image_url: d.image_url,
          style: d.style,
          description: d.description,
        })));
      } else if (looksRes.error) {
        console.error("daily_looks 查询失败:", looksRes.error);
      }
    } catch (err) {
      console.error("加载数据失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 按分类筛选
  const filteredItems = useMemo(() => {
    let list = items.filter((i) => i.section === activeSection);
    // 专业筛选（直接匹配数据库字段）
    if (filterColor) list = list.filter((i) => i.color_season === filterColor);
    if (filterStyle) list = list.filter((i) => i.style_type === filterStyle);
    // 用户端市场术语筛选（映射后匹配）
    if (filterUserColor && DISPLAY_COLOR_TO_SEASONS[filterUserColor]) {
      const matched = DISPLAY_COLOR_TO_SEASONS[filterUserColor];
      list = list.filter((i) => i.color_season && matched.includes(i.color_season));
    }
    // 用户端风格筛选：直接用拼音key匹配数据库style_type
    if (filterUserStyle) {
      list = list.filter((i) => i.style_type === filterUserStyle);
    }
    if (filterScenario) list = list.filter((i) => i.scenario === filterScenario);
    if (searchTerm.trim()) {
      const kw = searchTerm.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(kw) || (i.description || "").toLowerCase().includes(kw)
      );
    }
    return list;
  }, [items, activeSection, filterColor, filterStyle, filterUserColor, filterUserStyle, filterScenario, searchTerm]);

  const openLightbox = (item: DisplayItem) => {
    const idx = filteredItems.findIndex((i) => i.id === item.id);
    setLightboxItem(item);
    setLightboxIndex(idx >= 0 ? idx : 0);
  };

  const navigateLightbox = (direction: "prev" | "next") => {
    const newIdx = direction === "next"
      ? (lightboxIndex + 1) % filteredItems.length
      : (lightboxIndex - 1 + filteredItems.length) % filteredItems.length;
    setLightboxIndex(newIdx);
    setLightboxItem(filteredItems[newIdx]);
  };

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setFilterColor(""); setFilterStyle(""); setFilterUserColor(""); setFilterUserStyle("");
    setFilterScenario(""); setSearchTerm("");
  };

  const hasFilter = filterColor || filterStyle || filterUserColor || filterUserStyle || filterScenario || searchTerm;

  // 当前筛选提示文字
  const getFilterLabel = () => {
    if (filterUserStyle) return DISPLAY_STYLE_OPTIONS.find(s => s.value === filterUserStyle)?.label || "";
    if (filterStyle) return STYLES.find(s => s.value === filterStyle)?.label || "";
    return "";
  };
  const getColorLabel = () => {
    if (filterUserColor) return DISPLAY_COLOR_OPTIONS.find(c => c.value === filterUserColor)?.label || "";
    if (filterColor) return COLOR_SEASONS.find(c => c.value === filterColor)?.label || "";
    return "";
  };

  return (
    <>
      {/* 原有登录paywall（保留兼容） */}
      <PaywallModal
        isOpen={showPaywall && !user}
        onClose={() => setShowPaywall(false)}
        title="完整陈列方案"
        description="登录后购买会员或单次付费即可查看完整内容"
        type="single"
      />

      {/* ── 每日搭配付费弹窗 ── */}
      <AnimatePresence>
        {showPayModal && user && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowPayModal(false); setPayStep("confirm"); }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              <button onClick={() => { setShowPayModal(false); setPayStep("confirm"); }}
                className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>

              {/* Step 1: 确认 */}
              {payStep === "confirm" && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                      <Palette className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">解锁每日搭配灵感</h3>
                    <p className="mt-2 text-sm text-muted-foreground">VIP会员免费查看，非会员需订阅</p>
                  </div>
                  {/* 月/年选择 */}
                  <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                    <button onClick={() => setSelectedDailyPlan("yearly")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${selectedDailyPlan==="yearly"?"bg-white text-accent shadow-sm font-bold":"text-gray-500"}`}>年费 ¥11,980/年</button>
                    <button onClick={() => setSelectedDailyPlan("monthly")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${selectedDailyPlan==="monthly"?"bg-white text-accent shadow-sm font-bold":"text-gray-500"}`}>月费 ¥999/月</button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">套餐</span>
                      <span className="text-sm font-bold text-primary">{selectedDailyPlan==="yearly"?"每日搭配·年度订阅":"每日搭配·月度订阅"}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">有效期</span>
                      <span className="text-sm text-gray-700">{selectedDailyPlan==="yearly"?"自开通起 1 年":"自开通起 30 天"}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">应付金额</span>
                      <span className="text-2xl font-black text-accent">{selectedDailyPlan==="yearly"?"¥11,980":"¥999"}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-6">
                    {["每日更新搭配灵感完整查看", "色彩方案与单品推荐", "风格解析 + 搭配技巧"].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowPayModal(false); setPayStep("confirm"); }}
                      className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">取消</button>
                    <button onClick={() => setPayStep("scan")}
                      className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:brightness-110 shadow-md">去支付</button>
                  </div>
                </div>
              )}

              {/* Step 2: 扫码 */}
              {payStep === "scan" && (
                <div>
                  <div className="text-center mb-5">
                    <h3 className="text-lg font-bold text-primary">扫码支付</h3>
                    <p className="mt-1 text-sm text-muted-foreground">应付金额 <span className="text-xl font-black text-accent">{selectedDailyPlan==="yearly"?"¥11,980":"¥999"}</span></p>
                  </div>
                  <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
                    <button onClick={() => setPayMethod("wechat")} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${payMethod==="wechat"?"bg-white text-green-600 shadow-sm":"text-gray-500"}`}><MessageCircle className="w-4 h-4" /> 微信支付</button>
                    <button onClick={() => setPayMethod("alipay")} className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 ${payMethod==="alipay"?"bg-white text-blue-600 shadow-sm":"text-gray-500"}`}><Smartphone className="w-4 h-4" /> 支付宝</button>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-5 text-center mb-5">
                    {payMethod === "wechat" ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3"><MessageCircle className="w-8 h-8 text-green-500" /></div>
                        <p className="text-sm font-bold text-gray-700 mb-1">添加微信转账</p>
                        <p className="text-xs text-muted-foreground mb-3">打开微信 → 添加好友 → 转账</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-mono font-bold text-green-700">luozhidie666</span>
                          <button onClick={() => { navigator.clipboard.writeText("luozhidie666"); setCopiedAccount(true); setTimeout(()=>setCopiedAccount(false),2000); }} className="text-gray-400 hover:text-green-600">{copiedAccount?<Check className="w-3.5 h-3.5"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                        </div>
                        <div className="mt-4 w-36 h-36 mx-auto rounded-xl bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center"><p className="text-[10px] text-gray-400 text-center px-2">收款二维码<br/>（联系管理员配置）</p></div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3"><Smartphone className="w-8 h-8 text-blue-500" /></div>
                        <p className="text-sm font-bold text-gray-700 mb-1">支付宝转账</p>
                        <p className="text-xs text-muted-foreground mb-3">打开支付宝 → 转账到该账号</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-mono font-bold text-blue-700">13925997776</span>
                          <button onClick={() => { navigator.clipboard.writeText("13925997776"); setCopiedAccount(true); setTimeout(()=>setCopiedAccount(false),2000); }} className="text-gray-400 hover:text-blue-600">{copiedAccount?<Check className="w-3.5 h-3.5"/>:<Copy className="w-3.5 h-3.5"/>}</button>
                        </div>
                        <div className="mt-4 w-36 h-36 mx-auto rounded-xl bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center"><p className="text-[10px] text-gray-400 text-center px-2">收款二维码<br/>（联系管理员配置）</p></div>
                      </>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setPayStep("confirm")} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">上一步</button>
                    <button onClick={handleDailyLooksSubmit} disabled={submitting} className="flex-1 py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:brightness-110 shadow-md disabled:opacity-50 flex items-center justify-center gap-2">{submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<CheckCircle2 className="w-4 h-4"/>} 我已支付</button>
                  </div>
                  <p className="mt-3 text-[11px] text-gray-400 text-center">支付完成后点击"我已支付"，24小时内确认后即刻生效</p>
                </div>
              )}

              {/* Step 3: 待确认 */}
              {payStep === "pending" && (
                <div className="text-center py-6">
                  <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4"><Clock className="w-7 h-7 text-amber-500" /></div>
                  <h3 className="text-xl font-bold text-primary">支付已提交</h3>
                  <p className="mt-2 text-sm text-muted-foreground">您的每日搭配订阅订单已创建，等待后台确认</p>
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 text-left">
                    <div className="flex justify-between mb-2"><span className="text-xs text-gray-500">套餐</span><span className="text-sm font-bold text-primary">{selectedDailyPlan==="yearly"?"每日搭配·年度订阅":"每日搭配·月度订阅"}</span></div>
                    <div className="flex justify-between mb-2"><span className="text-xs text-gray-500">金额</span><span className="text-sm font-bold text-accent">{selectedDailyPlan==="yearly"?"¥11,980":"¥999"}</span></div>
                    <div className="flex justify-between"><span className="text-xs text-gray-500">状态</span><span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3"/>待确认</span></div>
                  </div>
                  <div className="mt-5 space-y-3">
                    <button onClick={() => { setShowPayModal(false); window.location.reload(); }} className="w-full py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90">知道了，去逛逛</button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">微信: luozhidie666 &nbsp; 支付宝: 13925997776</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 灯箱 */}
      <AnimatePresence mode="wait">
        {lightboxItem && !showPaywall && (
          <motion.div
            key="display-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setLightboxItem(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl"
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setLightboxItem(null)}
                className="absolute -top-12 right-0 text-white hover:text-accent transition-colors z-10"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 主图 */}
              {lightboxItem.image_url && (
                <div className="relative aspect-[16/9] bg-black rounded-xl overflow-hidden">
                  <img
                    src={lightboxItem.image_url}
                    alt={`${lightboxItem.title} - 图片${lightboxIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* 标题与描述 */}
              <div className="mt-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-3 py-1 bg-primary/80 text-white text-xs font-medium rounded-full">
                    {lightboxItem.section === "styles" ? "风格陈列" : lightboxItem.section === "scenarios" ? "场景搭配" : "门店布局"}
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{lightboxItem.title}</h2>
                {lightboxItem.description && (
                  <p className="mt-3 text-white/80 leading-relaxed whitespace-pre-wrap">{lightboxItem.description}</p>
                )}
                {/* 专业标签（后台显示）*/}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {lightboxItem.color_season && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-white/90">
                      {COLOR_SEASONS.find(c => c.value === lightboxItem.color_season)?.label || lightboxItem.color_season}
                    </span>
                  )}
                  {lightboxItem.style_type && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/20 text-white/90">
                      {STYLES.find(s => s.value === lightboxItem.style_type)?.label || lightboxItem.style_type}
                    </span>
                  )}
                  {lightboxItem.scenario && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-white/90">
                      {SCENARIOS.find(s => s.value === lightboxItem.scenario)?.label || lightboxItem.scenario}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">陈列搭配</span>
        </div>
      </nav>

      {/* ====== Hero ====== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <LayoutGrid className="w-4 h-4" />
              智能陈列，提升连带
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              陈列搭配
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              基于色彩季型、风格类型的科学陈列体系与搭配方案，让每一寸空间都产生价值
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== 每日色彩搭配推荐（付费内容） ====== */}
      <section className="py-8 bg-white border-b border-gray-100 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* 付费提示条 — 未订阅时显示 */}
          {!subLoading && !isSubscribed && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="flex items-center justify-between mb-4 p-3 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 border border-accent/20">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-primary">每日搭配灵感 · 会员专享</span>
                <span className="text-xs text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-full">¥999/月 ¥11,980/年</span>
              </div>
              <div className="flex items-center gap-2">
                {user ? (
                  <button onClick={() => setShowPayModal(true)} className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all shadow-sm flex items-center gap-1"><CreditCard className="w-3 h-3" /> 立即解锁</button>
                ) : (
                  <button onClick={() => router.push(`/login?redirect=/display`)} className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-1">登录解锁</button>
                )}
              </div>
            </motion.div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-primary">每日色彩搭配灵感</h2>
            <span className="text-xs text-gray-400 ml-1">{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })}</span>
          </div>

          {/* 模糊遮罩层 — 未订阅时覆盖 */}
          <div className={!subLoading && !isSubscribed ? "relative" : ""}>
            {!subLoading && !isSubscribed && (
              <div className="absolute inset-0 z-10 backdrop-blur-md bg-white/40 rounded-xl flex flex-col items-center justify-center cursor-pointer" onClick={() => user ? setShowPayModal(true) : router.push(`/login?redirect=/display`)}>
                <Lock className="w-8 h-8 text-accent mb-2" />
                <p className="text-sm font-bold text-primary">{user ? "订阅后查看完整搭配" : "登录后查看完整搭配"}</p>
                <p className="text-xs text-muted-foreground mt-1">¥999/月 · ¥11,980/年 · VIP免费</p>
              </div>
            )}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!subLoading && !isSubscribed ? "blur-sm select-none pointer-events-none" : ""}`}>
            {dailyLooks.length === 0 ? (
              // 默认加载中/空状态
              <div className="col-span-full text-center py-6 text-sm text-gray-400">加载搭配灵感中...</div>
            ) : (
              dailyLooks.map((combo) => (
                <motion.div
                  key={combo.id}
                  whileHover={{ y: -2 }}
                  className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:border-accent/30 hover:shadow-sm transition-all cursor-pointer"
                >
                  {/* 如果有实物照片就展示 */}
                  {combo.image_url ? (
                    <div className="relative aspect-[4/3] bg-gray-100">
                      <img src={combo.image_url} alt={combo.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                        {combo.colors.map((c: string) => (
                          <div key={c} className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3">
                      <div className="flex gap-1.5 mb-2">
                        {combo.colors.map((c: string) => (
                          <div key={c} className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className={combo.image_url ? "p-3 pt-2" : "px-3 pb-3 -mt-1"}>
                    <h3 className="text-sm font-bold text-primary">{combo.title}</h3>
                    <p className="text-xs text-accent font-medium mt-0.5">{combo.style}</p>
                    <p className="text-[11px] text-gray-500 mt-1">{combo.description}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          </div>
        </div>
      </section>

      {/* ====== 陈列分类 Tab ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3 overflow-x-auto">
            {DISPLAY_SECTIONS.map((sec) => (
              <button
                key={sec.value}
                onClick={() => { setActiveSection(sec.value); clearFilters(); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeSection === sec.value ? "bg-primary text-white" : "text-gray-700 hover:bg-primary/5"
                }`}
              >
                <sec.icon className="w-4 h-4" />
                {sec.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 筛选栏 ====== */}
      <section className="bg-white border-b border-gray-100 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            {/* 搜索 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索陈列案例..."
                className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* 用户端色彩偏好 */}
            <select
              value={filterUserColor}
              onChange={(e) => { setFilterUserColor(e.target.value); setFilterColor(""); }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部色彩</option>
              {DISPLAY_COLOR_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* 用户端风格定位 */}
            <select
              value={filterUserStyle}
              onChange={(e) => { setFilterUserStyle(e.target.value); setFilterStyle(""); }}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部风格</option>
              {DISPLAY_STYLE_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* 场景（仅场景搭配tab显示） */}
            {activeSection === "scenarios" && (
              <select
                value={filterScenario}
                onChange={(e) => setFilterScenario(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">全部场景</option>
                {SCENARIOS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            )}

            {/* 视图切换 */}
            <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-gray-400"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* 清除筛选 */}
            {hasFilter && (
              <button onClick={clearFilters} className="text-xs text-accent hover:underline">
                清除筛选
              </button>
            )}
          </div>

          {/* 筛选提示 */}
          {hasFilter && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>找到 {filteredItems.length} 个案例</span>
              {getColorLabel() && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{getColorLabel()}</span>}
              {getFilterLabel() && <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{getFilterLabel()}</span>}
            </div>
          )}
        </div>
      </section>

      {/* ====== 陈列案例内容 ====== */}
      <section className="py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <LayoutGrid className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {hasFilter ? "没有匹配的陈列案例，试试调整筛选条件" : "暂无陈列案例，敬请期待"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {filteredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  variants={fadeUp}
                  custom={i}
                  className="group cursor-pointer"
                  onClick={() => openLightbox(item)}
                >
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 bg-gray-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid className="w-10 h-10 text-primary/30" />
                      </div>
                    )}
                    {/* 渐变遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* hover 操作 */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openLightbox(item); }}
                          className="p-2.5 bg-white/90 text-primary rounded-lg hover:bg-white transition-colors shadow-md"
                          title="放大查看"
                        >
                          <ZoomIn className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                          className={`p-2.5 rounded-lg shadow-md transition-colors ${
                            favorites.has(item.id)
                              ? "bg-red-500 text-white"
                              : "bg-white/90 text-gray-600 hover:bg-white"
                          }`}
                          title="收藏"
                        >
                          <Heart className={`w-5 h-5 ${favorites.has(item.id) ? "fill-white" : ""}`} />
                        </button>
                      </div>
                    </div>
                    {/* 底部标签 */}
                    <div className="absolute bottom-3 left-3 flex gap-1 flex-wrap">
                      {item.color_season && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white">
                          {COLOR_SEASONS.find(c => c.value === item.color_season)?.label || item.color_season}
                        </span>
                      )}
                      {item.style_type && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/60 text-white">
                          {STYLES.find(s => s.value === item.style_type)?.label || item.style_type}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* 信息 */}
                  <div className="p-4">
                    <h4 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* 列表视图 */
            <div className="space-y-4">
              {filteredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="group flex gap-5 p-4 bg-white rounded-2xl border border-gray-100 hover:border-accent/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => openLightbox(item)}
                >
                  {/* 缩略图 */}
                  <div className="w-32 h-40 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid className="w-8 h-8 text-primary/30" />
                      </div>
                    )}
                  </div>
                  {/* 信息 */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="font-bold text-primary group-hover:text-accent transition-colors">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-auto pt-3 flex-wrap">
                      {item.color_season && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {COLOR_SEASONS.find(c => c.value === item.color_season)?.label || item.color_season}
                        </span>
                      )}
                      {item.style_type && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                          {STYLES.find(s => s.value === item.style_type)?.label || item.style_type}
                        </span>
                      )}
                      {item.scenario && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                          {SCENARIOS.find(s => s.value === item.scenario)?.label || item.scenario}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); openLightbox(item); }}
                        className="text-xs px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-medium"
                      >
                        <ZoomIn className="w-3 h-3 inline-block mr-1" />
                        查看大图
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          favorites.has(item.id)
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Heart className={`w-3 h-3 inline-block mr-1 ${favorites.has(item.id) ? "fill-red-500" : ""}`} />
                        {favorites.has(item.id) ? "已收藏" : "收藏"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ====== 推荐搭配商品 ====== */}
      {recommendProducts.length > 0 && (
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary">搭配推荐</h2>
                <p className="text-sm text-muted-foreground mt-1">这些商品与陈列搭配方案风格匹配</p>
              </div>
              <Link href="/buyer" className="text-sm text-primary hover:text-accent flex items-center gap-1">
                查看更多 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
              {recommendProducts.map((product) => (
                <Link key={product.id} href={`/buyer/${product.id}`} className="group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 mb-2">
                    {product.cover_image ? (
                      <img src={product.cover_image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt className="w-6 h-6 text-primary/30" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-primary line-clamp-1 group-hover:text-accent transition-colors">{product.title}</h4>
                  <span className="text-xs text-accent font-bold">¥{(product.price / 100).toFixed(0)}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== 陈列优化五步法 ====== */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center max-w-2xl mx-auto mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">优化方法</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">陈列优化五步法</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              系统化的陈列优化方法论，从数据到执行形成完整闭环
            </p>
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto space-y-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
          >
            {[
              { step: 1, title: "数据采集", desc: "收集门店基础数据，分析客群画像与色彩季型分布", icon: Ruler },
              { step: 2, title: "风格分区", desc: "按风格类型规划陈列分区与动线设计", icon: LayoutGrid },
              { step: 3, title: "搭配方案", desc: "基于色彩季型设计场景化搭配方案", icon: Shirt },
              { step: 4, title: "视觉陈列", desc: "打造视觉焦点与主题场景陈列", icon: Palette },
              { step: 5, title: "数据复盘", desc: "追踪效果数据并持续优化调整", icon: Eye },
            ].map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i}>
                <div className="group flex items-start gap-5 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-accent/30 transition-all duration-300">
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white font-bold text-sm">
                      {item.step}
                    </div>
                    {i < 4 && <div className="w-0.5 h-6 bg-gray-200" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-primary group-hover:text-accent transition-colors">{item.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 sm:px-12 lg:px-20 py-14 sm:py-20 text-center text-white"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
          >
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">
                掌握前沿趋势
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                从色彩预测到款式解读，全面把握下一季流行方向
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  咨询趋势报告
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/magazine"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  浏览杂志文章
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

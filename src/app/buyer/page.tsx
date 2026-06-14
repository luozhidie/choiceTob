"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search, X, TrendingUp, Truck, Star, CheckCircle2,
  FileCheck, Shield, Factory, Headphones, Landmark,
  Upload, ArrowRight, Building2, Package, Flame,
  ChevronRight, Home, ShoppingBag, Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { ALL_STYLES, COLOR_SEASONS_PRO, COLOR_SEASON_MARKET_MAP } from "@/lib/styles";
import { CATEGORY_MAP, SUBCATEGORY_MAP, CATEGORIES } from "@/lib/categories";
import { useBuyerPageData } from "@/hooks/useBuyerPageData";
import PaymentQRCode from "@/components/PaymentQRCode";

/* ==================== 品类选项（静态兜底 + 动态合并）==================== */
const STATIC_CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.key, label: c.label }));

/* ==================== 静态数据 ==================== */

const STYLE_OPTIONS = ALL_STYLES.map(s => ({ value: s.value, label: s.label }));

/* 用户端市场术语 —— 仅用于筛选器展示（与STYLE_OPTIONS相同，保持一致性） */
const USER_STYLE_OPTIONS = STYLE_OPTIONS;

const COLOR_SEASONS = COLOR_SEASONS_PRO.map(c => ({
  value: c.value,
  label: c.marketLabel,
}));

/* 用户端色彩选项 —— 通俗色系名 */
const USER_COLOR_OPTIONS = [
  { value: "deep",  label: "深色系" },
  { value: "light", label: "浅色系" },
  { value: "cool",  label: "冷色系" },
  { value: "warm",  label: "暖色系" },
  { value: "clear", label: "净色系" },
  { value: "soft",  label: "柔色系" },
];

/* 用户端色彩筛选 —— 色系映射到具体季型 */
const COLOR_SCHEME_TO_SEASONS: Record<string, string[]> = {
  deep:  ["deep_warm", "deep_cool"],
  light: ["light_warm", "light_cool"],
  cool:  ["cool_soft", "soft_cool"],
  warm:  ["warm_bright", "warm_soft"],
  clear: ["clear_warm", "clear_cool"],
  soft:  ["soft_warm", "cool_bright"],
};
const entryStandards = [
  { icon: FileCheck, title: "营业执照", desc: "合法有效的企业营业执照，经营范围涵盖服装生产或销售" },
  { icon: Shield, title: "质检报告", desc: "提供近一年内第三方权威机构出具的产品质检合格报告" },
  { icon: Factory, title: "产能证明", desc: "具备稳定的生产能力，年产能够满足平台最低合作标准" },
  { icon: Headphones, title: "售后体系", desc: "建立完善的售后服务体系，7天无理由退换，48小时响应" },
  { icon: Landmark, title: "保证金", desc: "按分级缴纳相应金额的履约保证金，保障交易安全" },
];

// 供应商分级
const supplierLevels = [
  {
    level: "A", label: "核心供应商", color: "from-amber-500 to-yellow-400",
    borderColor: "border-amber-400", bgLight: "bg-amber-50", textColor: "text-amber-700",
    benefits: ["优先展示与推荐权重", "专属客户经理1对1服务", "新品首发绿色通道", "大促活动优先入选", "平台数据看板权限"],
    threshold: "年供货额≥500万，综合评分≥90",
  },
  {
    level: "B", label: "补充供应商", color: "from-slate-400 to-slate-300",
    borderColor: "border-slate-300", bgLight: "bg-slate-50", textColor: "text-slate-700",
    benefits: ["常规展示位", "在线客服支持", "活动备选资格", "基础数据报表"],
    threshold: "年供货额≥100万，综合评分≥75",
  },
  {
    level: "C", label: "备用供应商", color: "from-orange-400 to-orange-300",
    borderColor: "border-orange-300", bgLight: "bg-orange-50", textColor: "text-orange-700",
    benefits: ["基础展示", "自主运营后台", "待升级观察期"],
    threshold: "年供货额<100万，综合评分≥60",
  },
];

/* ==================== 动画 ==================== */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ==================== 类型 ==================== */
interface MergedProduct {
  id: string; title: string; description: string | null;
  cover_image: string | null; price: number; original_price: number | null;
  cost_price: number | null; supplier: string | null;
  category: string | null; subcategory: string | null;
  color_season: string | null; style_type: string | null;
  stock: number; is_published: boolean; source: "platform" | "buyer" | "supplier_submit";
  created_at: string;
}

interface Supplier {
  id: string; name: string; level: string; rating: number;
  description: string; is_published: boolean;
}

interface HotPick {
  id: string; title: string; description: string | null;
  cover_image: string | null; price: number; category: string | null;
  is_published: boolean;
}

/* ==================== 页面 ==================== */
export default function BuyerPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<MergedProduct[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [hotPicks, setHotPicks] = useState<HotPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  /* 专业筛选（后台级，保留）*/
  const [activeStyle, setActiveStyle] = useState("");
  const [activeColor, setActiveColor] = useState("");
  /* 用户端市场术语筛选 */
  const [activeUserStyle, setActiveUserStyle] = useState("");
  const [activeUserColor, setActiveUserColor] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortBy, setSortBy] = useState("sort_order");
  const [selectedProduct, setSelectedProduct] = useState<MergedProduct | null>(null);
  const [visible, setVisible] = useState(false);
  const [showProductDetail, setShowProductDetail] = useState(false);
  const [showPurchaseIntent, setShowPurchaseIntent] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchaseNote, setPurchaseNote] = useState("");
  const [purchaseContact, setPurchaseContact] = useState("");
  const [purchaseAddress, setPurchaseAddress] = useState("");
  const [purchaseSubmitted, setPurchaseSubmitted] = useState(false);
  const [paymentType, setPaymentType] = useState<"wechat" | "alipay">("wechat");
  const [orderCreating, setOrderCreating] = useState(false);
  const [paymentQR, setPaymentQR] = useState<{ url_qrcode: string; url: string } | null>(null);
  const [currentOrderNo, setCurrentOrderNo] = useState<string>("");
  const [paymentChecking, setPaymentChecking] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showMemberPrompt, setShowMemberPrompt] = useState(false);

  // 供应商入驻表单
  const [supplierForm, setSupplierForm] = useState({
    company: "", contact: "", phone: "", category: "", brand: "", capacity: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();
  const { user, isMember } = useAuth();
  const {
    promotions,
    newProductCalendar,
    productTags,
    recommendations,
    loading: dataLoading,
    usingFallback,
    fetchProductTags,
    fetchRecommendations,
    trackPageView,
    updatePageViewDuration
  } = useBuyerPageData();

  useEffect(() => {
    setVisible(true);
    fetchAllData();
    
    // 获取用户推荐数据
    if (user?.id) {
      fetchRecommendations(user.id);
    }
    
    // 记录页面浏览
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    void (async () => {
      try {
        await trackPageView('/buyer', user?.id);
      } catch { /* 静默 */ }
    })();
  }, [user?.id]);

  const fetchAllData = async () => {
    setLoading(true);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const headers: Record<string, string> = {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
    };

    /* buyer_products 用原生 fetch 绕过 schema cache 问题 */
    const [buyerRes, platformRes, supplierRes, hotPickRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/buyer_products?is_published=eq.true&order=sort_order.asc&select=*`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
      supabase.from("products").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      supabase.from("suppliers").select("*").eq("is_published", true).order("rating", { ascending: false }),
      supabase.from("hot_picks").select("*").eq("is_published", true).order("sort_order", { ascending: true }).limit(8),
    ]);

    const merged: MergedProduct[] = [];
    /* buyerRes 是原生 fetch 返回的数组 */
    if (Array.isArray(buyerRes)) {
      buyerRes.forEach((p: any) => merged.push({
        id: p.id, title: p.title || p.name || "选品商品", description: p.description,
        cover_image: p.cover_image || p.image_url || null, price: p.price || 0,
        original_price: p.original_price || null, cost_price: p.cost_price || null,
        supplier: p.supplier || null, category: p.category || null,
        subcategory: p.subcategory || null, color_season: p.color_season || null,
        style_type: p.style_type || null, stock: p.stock || 0,
        is_published: p.is_published,
        source: p.source === "supplier_submit" ? "supplier_submit" : "buyer",
        created_at: p.created_at,
      }));
    }
    if (!platformRes.error && platformRes.data) {
      platformRes.data.forEach((p: any) => merged.push({
        id: p.id, title: p.title || "平台商品", description: p.description,
        cover_image: p.cover_image || null, price: p.price || 0,
        original_price: p.original_price || null, cost_price: null, supplier: null,
        category: p.category || null,
        subcategory: p.subcategory || null, color_season: null, style_type: null,
        stock: p.stock || 0, is_published: p.is_published, source: "platform", created_at: p.created_at,
      }));
    }
    setAllProducts(merged);
    if (!supplierRes.error && supplierRes.data) setSuppliers(supplierRes.data as Supplier[]);
    if (!hotPickRes.error && hotPickRes.data) setHotPicks(hotPickRes.data as HotPick[]);
    setLoading(false);
  };

  /* 品类选项：只显示标准分类（服装/配饰），不再动态加入自定义分类 */
  const categoryOptions = STATIC_CATEGORY_OPTIONS;

  /* 当前主分类的子分类列表 */
  const currentSubcategories = useMemo(() => {
    if (!activeCategory) return [];
    const cat = CATEGORIES.find(c => c.key === activeCategory);
    if (cat) return cat.subcategories;
    /* 自定义分类：从商品数据中提取子分类 */
    const subs = new Set<string>();
    allProducts.forEach(p => { if (p.category === activeCategory && p.subcategory) subs.add(p.subcategory); });
    return [...subs].map(s => ({ key: s, label: SUBCATEGORY_MAP[s] || s }));
  }, [activeCategory, allProducts]);

  const [activeSubcategory, setActiveSubcategory] = useState("");

  /* 切换主分类时重置子分类 */
  useEffect(() => { setActiveSubcategory(""); }, [activeCategory]);

  const filteredProducts = useMemo(() => {
    let list = [...allProducts];
    /* 排除色彩工具/书籍资料/专业工具（这些属于线上课程） */
    list = list.filter((p) => !["color_tools", "book", "pro_tool"].includes(p.category || ""));
    /* 只显示有分类的商品 */
    list = list.filter((p) => !!p.category);
    if (sourceFilter) list = list.filter((p) => p.source === sourceFilter);
    if (searchTerm.trim()) {
      const kw = searchTerm.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(kw) || (p.description || "").toLowerCase().includes(kw));
    }
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (activeSubcategory) list = list.filter((p) => p.subcategory === activeSubcategory);
    /* 用户端风格筛选：直接匹配 style_type */
    if (activeUserStyle) list = list.filter((p) => p.style_type === activeUserStyle);
    /* 用户端色彩筛选：兼容通俗色系名(warm/cool) + 旧季型名(light_warm) */
    if (activeUserColor && COLOR_SCHEME_TO_SEASONS[activeUserColor]) {
      const seasons = COLOR_SCHEME_TO_SEASONS[activeUserColor];
      list = list.filter((p) => p.color_season && (seasons.includes(p.color_season) || p.color_season === activeUserColor));
    }
    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [allProducts, searchTerm, activeCategory, activeSubcategory, activeUserStyle, activeUserColor, sourceFilter, sortBy]);

  const handleBuy = (product: MergedProduct) => {
    const source = product.source || "buyer";
    router.push(`/checkout?id=${product.id}&source=${source}`);
  };
  const handleCloseDetail = () => { setShowProductDetail(false); setSelectedProduct(null); setPaymentQR(null); setCurrentOrderNo(""); setPaymentSuccess(false); };
  const handleOpenPurchase = () => { setShowProductDetail(false); setShowPurchaseIntent(true); };
  const handleClosePurchase = () => { setShowPurchaseIntent(false); setPurchaseQuantity(1); setPurchaseNote(""); setPurchaseContact(""); setPurchaseAddress(""); setPaymentQR(null); setCurrentOrderNo(""); setPaymentSuccess(false); };

  // 创建订单并发起支付
  const handleCreateOrder = async () => {
    if (!selectedProduct || !purchaseContact) return;
    setOrderCreating(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          product_title: selectedProduct.title,
          product_price: selectedProduct.price,
          quantity: purchaseQuantity,
          contact: purchaseContact,
          address: purchaseAddress,
          note: purchaseNote,
          payment_type: paymentType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '创建订单失败');

      if (data.payment) {
        setPaymentQR(data.payment);
        setCurrentOrderNo(data.order.order_no);
      } else {
        setPurchaseSubmitted(true);
        setCurrentOrderNo(data.order.order_no);
      }
    } catch (err: any) {
      alert(err.message || '创建订单失败，请稍后重试');
    } finally {
      setOrderCreating(false);
    }
  };

  // 轮询支付状态
  useEffect(() => {
    if (!currentOrderNo || !paymentQR || paymentSuccess) return;
    const interval = setInterval(async () => {
      try {
        setPaymentChecking(true);
        const res = await fetch(`/api/orders/status?order_no=${currentOrderNo}`);
        const data = await res.json();
        if (data.is_paid) {
          setPaymentSuccess(true);
          setPaymentChecking(false);
          clearInterval(interval);
        }
      } catch {
        // 忽略轮询错误
      }
    }, 3000);
    return () => { clearInterval(interval); setPaymentChecking(false); };
  }, [currentOrderNo, paymentQR, paymentSuccess]);
  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;
  const getImage = (p: MergedProduct) => p.cover_image;

  const clearFilters = () => {
    setSearchTerm(""); setActiveCategory(""); setActiveSubcategory(""); setActiveStyle(""); setActiveColor("");
    setActiveUserStyle(""); setActiveUserColor("");
    setSourceFilter(""); setSortBy("sort_order");
  };
  const hasActiveFilter = activeCategory || activeSubcategory || activeUserStyle || activeUserColor || sourceFilter || searchTerm || sortBy !== "sort_order";

  const handleSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  /* 当前用户端筛选的 label 显示 */
  const getActiveStyleLabel = () => {
    if (!activeUserStyle) return "";
    return USER_STYLE_OPTIONS.find(s => s.value === activeUserStyle)?.label || activeUserStyle;
  };
  const getActiveColorLabel = () => {
    if (!activeUserColor) return "";
    return USER_COLOR_OPTIONS.find(c => c.value === activeUserColor)?.label || activeUserColor;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ====== Hero — 一手选品入口 ====== */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-12 md:py-16">
        <div className={`container mx-auto px-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-accent text-xs font-medium mb-4">
                <Package className="w-3.5 h-3.5" />
                源头直供 · 精选好物
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">买手选品</h1>
              <p className="text-sm md:text-base text-white/80 max-w-xl mb-6">
                精选优质货源，按风格、色系精准筛选，充值会员享折扣拿货
              </p>
              <div className="max-w-lg relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索商品名称、描述..."
                  className="w-full pl-11 pr-10 py-3 bg-white/15 border border-white/25 rounded-xl text-sm text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/20" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {/* 预存货款折扣档位 */}
            <div className="flex flex-col gap-3 shrink-0">
              <p className="text-xs text-white/70 text-center">预存货款享折扣拿货</p>
              <div className="flex gap-3">
                {[
                  { amount: "5万", discount: "2.8折", ret: "退5%", example: "原价¥100 → ¥28", highlight: false },
                  { amount: "10万", discount: "2.8折", ret: "退10%", example: "原价¥100 → ¥28", highlight: false },
                  { amount: "30万", discount: "2.6折", ret: "退20%", example: "原价¥100 → ¥26", highlight: true },
                ].map((tier) => (
                  <div key={tier.amount} className={`backdrop-blur-sm border rounded-xl p-4 text-center min-w-[100px] transition-all ${
                    tier.highlight
                      ? "bg-accent/20 border-accent/50 ring-1 ring-accent/30"
                      : "bg-white/10 border-white/20"
                  }`}>
                    <div className="text-xl font-bold">{tier.amount}</div>
                    <div className="text-xs text-white/60 mt-1">预存</div>
                    <div className="mt-2 text-accent font-bold text-sm">{tier.discount}</div>
                    <div className="text-[10px] text-white/50">{tier.ret}</div>
                    <div className="text-[10px] text-white/70 mt-1.5 pt-1.5 border-t border-white/10">{tier.example}</div>
                  </div>
                ))}
              </div>
              <Link href="/members"
                className="btn-accent text-xs py-2 rounded-lg font-semibold text-center flex items-center justify-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                了解货款折扣方案
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== 营销活动区 ====== */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            {promotions.length > 0 ? promotions.map((promo) => (
              <Link key={promo.id} href={promo.link_url || '#'}
                className={`shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${
                  promo.promo_type === 'flash_sale' ? 'from-red-500 to-pink-500' :
                  promo.promo_type === 'new_user' ? 'from-amber-500 to-orange-500' :
                  promo.promo_type === 'invite' ? 'from-green-500 to-teal-500' :
                  'from-purple-500 to-indigo-500'
                } text-white min-w-[200px] hover:shadow-lg transition-shadow`}>
                <div className="flex-1">
                  <p className="font-bold text-sm">{promo.title}</p>
                  <p className="text-xs text-white/80">{promo.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-white/70" />
              </Link>
            )) : (
              // 加载状态或空状态
              <div className="flex items-center gap-3">
                <div className="px-4 py-3 rounded-xl bg-gray-100 text-gray-400 min-w-[200px] text-center text-sm">
                  暂无营销活动
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====== 新品日历 ====== */}
      <section className="bg-white border-b border-gray-100 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-primary">新品日历</h3>
            <span className="text-xs text-gray-400 ml-1">每日上新</span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              const dateStr = date.toISOString().split('T')[0];
              const month = date.getMonth() + 1;
              const day = date.getDate();
              const isToday = i === 0;
              
              // 检查这一天是否有新品上架
              const hasNew = newProductCalendar.some(item => 
                item.release_date === dateStr
              );
              
              return (
                <button
                  key={i}
                  className={`flex flex-col items-center justify-center min-w-[60px] h-[72px] rounded-xl border transition-all ${
                    isToday
                      ? "bg-primary text-white border-primary shadow-md"
                      : hasNew
                      ? "bg-white border-amber-200 hover:border-amber-400"
                      : "bg-gray-50 border-gray-100 text-gray-400"
                  }`}
                >
                  <span className={`text-xs ${isToday ? "text-white/80" : "text-gray-500"}`}>
                    {month}月
                  </span>
                  <span className={`text-lg font-bold ${isToday ? "text-white" : hasNew ? "text-primary" : "text-gray-400"}`}>
                    {day}
                  </span>
                  {hasNew && !isToday && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" />
                  )}
                </button>
              );
            })}
            <button className="flex items-center justify-center min-w-[60px] h-[72px] rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-primary hover:text-primary transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== 筛选栏 ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* 登录状态 */}
            {user ? (
              <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                {isMember ? "会员" : "已登录"}
              </span>
            ) : (
              <Link
                href="/login?redirect=/buyer"
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 transition-colors"
              >
                <Lock className="w-3 h-3" />
                未登录
              </Link>
            )}
            <div className="w-px h-4 bg-gray-200 shrink-0" />

            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 shrink-0">
              <button onClick={() => setSourceFilter("")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${!sourceFilter ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                全部
              </button>
              <button onClick={() => setSourceFilter(sourceFilter === "platform" ? "" : "platform")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${sourceFilter === "platform" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                平台自营
              </button>
              <button onClick={() => setSourceFilter(sourceFilter === "buyer" ? "" : "buyer")}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${sourceFilter === "buyer" ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                供应商货源
              </button>
            </div>
            <div className="w-px h-5 bg-gray-200 shrink-0" />
            {categoryOptions.map((cat) => (
              <button key={cat.value} onClick={() => setActiveCategory(activeCategory === cat.value ? "" : cat.value)}
                className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat.value ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"}`}>
                {cat.label}
              </button>
            ))}
            <div className="ml-auto shrink-0 flex items-center gap-2">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 focus:outline-none">
                <option value="sort_order">默认排序</option>
                <option value="price_asc">价格从低到高</option>
                <option value="price_desc">价格从高到低</option>
              </select>
            </div>
          </div>

          {/* 子分类筛选（选中主分类后显示） */}
          <AnimatePresence>
            {activeCategory && currentSubcategories.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
                  <span className="text-xs text-gray-400 shrink-0">子分类：</span>
                  <button onClick={() => setActiveSubcategory("")}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${!activeSubcategory ? "bg-accent text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                    全部
                  </button>
                  {currentSubcategories.map((sub) => (
                    <button key={sub.key} onClick={() => setActiveSubcategory(sub.key)}
                      className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeSubcategory === sub.key ? "bg-accent text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {sub.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 用户端风格 + 色彩筛选器 */}
          <AnimatePresence>
            {(!sourceFilter || sourceFilter === "buyer") && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex items-center gap-2 mt-2 overflow-x-auto scrollbar-hide">
                  <span className="text-xs text-gray-400 shrink-0">风格：</span>
                  {USER_STYLE_OPTIONS.map((s) => (
                    <button key={s.value} onClick={() => setActiveUserStyle(activeUserStyle === s.value ? "" : s.value)}
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${activeUserStyle === s.value ? "bg-accent text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-1">
                  <span className="text-xs text-gray-400 shrink-0">色系：</span>
                  {USER_COLOR_OPTIONS.map((c) => (
                    <button key={c.value} onClick={() => setActiveUserColor(activeUserColor === c.value ? "" : c.value)}
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${activeUserColor === c.value ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-200 hover:border-primary/30"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* 筛选提示 */}
      {hasActiveFilter && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-amber-700">
              {sourceFilter === "platform" && "平台自营 "}
              {sourceFilter === "buyer" && "供应商货源 "}
              {activeCategory && `品类"${CATEGORY_MAP[activeCategory] || activeCategory} `}
              {activeSubcategory && `> ${SUBCATEGORY_MAP[activeSubcategory] || activeSubcategory} `}
              {activeUserStyle && `· 风格"${getActiveStyleLabel()} `}
              {activeUserColor && `· 色彩"${getActiveColorLabel()} `}
              <span className="font-medium">（{filteredProducts.length} 件）</span>
            </p>
            <button onClick={clearFilters} className="text-xs text-amber-600 hover:text-amber-800 font-medium">清除筛选</button>
          </div>
        </div>
      )}

      {/* ====== 爆款货盘 ====== */}
      {hotPicks.length > 0 && (
        <section className="py-8 bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-bold text-primary">爆款货盘</h3>
              <Link href="/hot-picks" className="ml-auto text-xs text-primary hover:text-accent">查看更多 →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {hotPicks.map((item) => (
                <Link key={item.id} href={`/hot-picks/${item.id}`}>
                  <div className="bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-gradient-to-br from-red-50 to-orange-50 rounded-lg flex items-center justify-center mb-2">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Flame className="w-6 h-6 text-red-300" />
                      )}
                    </div>
                    <h4 className="text-xs font-medium text-primary line-clamp-1">{item.title}</h4>
                    {item.price > 0 && <span className="text-xs text-accent font-bold">{formatPrice(item.price)}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== 猜你喜欢 ====== */}
      {!loading && recommendations.length > 0 && (
        <section className="py-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h3 className="text-sm font-bold text-primary">猜你喜欢</h3>
              <span className="text-xs text-gray-400 ml-1">根据你的偏好推荐</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {recommendations.map((rec) => (
                <Link key={`rec-${rec.id}`} href={rec.products ? `/shop/${rec.products.id}` : '#'}>
                  <div className="bg-white rounded-xl p-3 border border-amber-100 hover:shadow-md hover:border-amber-300 transition-all group">
                    <div className="aspect-square bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                      {rec.products?.cover_image ? (
                        <img src={rec.products.cover_image} alt={rec.products.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Star className="w-6 h-6 text-amber-300" />
                      )}
                    </div>
                    <h4 className="text-xs font-medium text-primary line-clamp-1">{rec.products?.title}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs font-bold text-accent">{formatPrice(rec.products?.price || 0)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== 商品列表 ====== */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <TrendingUp className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {hasActiveFilter ? "没有匹配的选品，试试调整筛选条件" : "暂无选品，敬请期待"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredProducts.map((product, i) => (
                <motion.div key={`${product.source}-${product.id}`}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}>
                  <div className="group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30 h-full flex flex-col">
                    <Link href={`/shop/${product.id}`}>
                      <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden relative">
                        {getImage(product) ? (
                          <img src={getImage(product)!} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <TrendingUp className="w-10 h-10 text-primary/30" />
                        )}
                        <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          product.source === "platform" ? "bg-blue-500/90 text-white" : "bg-amber-500/90 text-white"
                        }`}>
                          {product.source === "platform" ? "自营" : "供应商"}
                        </span>
                        {/* 稀缺性标签 */}
                        {product.stock <= 5 && product.stock > 0 && (
                          <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-500/90 text-white">
                            仅剩{product.stock}件
                          </span>
                        )}
                        {product.stock === 0 && (
                          <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-500/90 text-white">
                            已售罄
                          </span>
                        )}
                        {product.stock > 5 && Math.random() > 0.7 && (
                          <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-500/90 text-white">
                            限量
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        {product.category && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {CATEGORY_MAP[product.category] || product.category}
                          </span>
                        )}
                        {product.subcategory && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                            {SUBCATEGORY_MAP[product.subcategory] || product.subcategory}
                          </span>
                        )}
                      </div>
                      <Link href={`/shop/${product.id}`}>
                        <h3 className="font-bold text-primary group-hover:text-accent transition-colors mt-1.5 line-clamp-2 text-sm md:text-base">{product.title}</h3>
                      </Link>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                        {isMember ? (
                          <>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base md:text-lg font-bold text-accent">{formatPrice(product.price)}</span>
                                {product.original_price && product.original_price > product.price && (
                                  <span className="text-[10px] md:text-xs text-gray-400 line-through">
                                    {formatPrice(product.original_price)}
                                  </span>
                                )}
                              </div>
                              {product.cost_price && product.cost_price > 0 && (
                                <span className="text-[10px] text-green-600 mt-0.5 font-medium">
                                  🏷 供货价 ¥{(product.cost_price / 100).toFixed(0)}
                                  {product.supplier && <span className="text-gray-400 ml-1">· {product.supplier}</span>}
                                </span>
                              )}
                              {product.original_price && product.original_price > product.price && (
                                <span className="text-[10px] text-accent/80 mt-0.5">
                                  会员省 ¥{((product.original_price - product.price) / 100).toFixed(0)}
                                </span>
                              )}
                            </div>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleBuy(product); }}
                              className="btn-accent text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-medium">
                              下单
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowMemberPrompt(true); }}
                              className="flex items-center gap-1.5"
                            >
                              <span className="text-sm font-bold text-gray-400">¥???</span>
                              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                                付费查看批发价
                              </span>
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowMemberPrompt(true); }}
                              className="text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                              开通查看价格
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ====== 合作供应商 ====== */}
      {suppliers.length > 0 && (
        <section className="py-12 bg-white border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Building2 className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-primary">合作供应商</h2>
              <span className="text-xs text-gray-400 ml-1">（{suppliers.length} 家）</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {suppliers.map((s, i) => (
                <motion.div key={s.id} custom={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}>
                  <Link href={`/buyer/${s.id}`}
                    className="group block p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-accent/30 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-primary group-hover:text-accent transition-colors">{s.name}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            s.level === "A" ? "bg-green-50 text-green-700" : s.level === "B" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
                          }`}>{s.level}级供应商</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`w-3 h-3 ${j < Math.round(s.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{s.rating}</span>
                    </div>
                    {s.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-1">{s.description}</p>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ====== 供应商入驻板块 ====== */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-accent font-semibold text-sm tracking-widest uppercase">供应商入驻</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-primary">加入骆芷蝶智选供应链</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              携手优质供应商，共建高效协同的服装供应链体系
            </p>
          </div>

          {/* 入驻标准 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {entryStandards.map((item, i) => (
              <motion.div key={item.title} variants={fadeUp} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="flex flex-col items-center text-center p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-accent/30 hover:shadow-lg transition-all">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-primary text-sm">{item.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* 分级管理 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {supplierLevels.map((item) => (
              <div key={item.level} className={`relative overflow-hidden rounded-2xl bg-white border ${item.borderColor} shadow-sm`}>
                <div className={`h-1.5 bg-gradient-to-r ${item.color}`} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${item.color} text-white text-lg font-bold`}>{item.level}</span>
                    <div>
                      <h3 className="font-bold text-primary">{item.label}</h3>
                      <p className="text-[10px] text-muted-foreground">{item.threshold}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {item.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                        <span className="text-xs text-gray-700">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* 已入驻供应商 */}
          {suppliers.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-bold text-primary mb-4 text-center">已入驻供应商</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {suppliers.map((s) => (
                  <div key={s.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.round(s.rating) ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{s.rating}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      s.level === "A" ? "bg-green-50 text-green-700" : s.level === "B" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}>{s.level}级供应商</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 入驻申请表单 */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-primary mb-4 text-center">申请入驻</h3>
            <form onSubmit={handleSupplierSubmit} className="p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">公司名称 *</label>
                  <input required value={supplierForm.company} onChange={(e) => setSupplierForm(f => ({ ...f, company: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="公司全称" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">联系人 *</label>
                  <input required value={supplierForm.contact} onChange={(e) => setSupplierForm(f => ({ ...f, contact: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="联系人姓名" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">联系电话 *</label>
                  <input required type="tel" value={supplierForm.phone} onChange={(e) => setSupplierForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="手机号码" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">主营品类 *</label>
                  <select required value={supplierForm.category} onChange={(e) => setSupplierForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none bg-white">
                    <option value="">请选择</option>
                    <option value="女装">女装</option>
                    <option value="男装">男装</option>
                    <option value="童装">童装</option>
                    <option value="面料">面料</option>
                    <option value="配饰">配饰</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">品牌名称</label>
                  <input value={supplierForm.brand} onChange={(e) => setSupplierForm(f => ({ ...f, brand: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="如有" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary mb-1">年产能</label>
                  <input value={supplierForm.capacity} onChange={(e) => setSupplierForm(f => ({ ...f, capacity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" placeholder="如：50万件/年" />
                </div>
              </div>
              <button type="submit" className="mt-4 w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                提交入驻申请 <ArrowRight className="w-4 h-4" />
              </button>
              {submitted && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-xs text-green-700">申请已提交！我们将在3个工作日内与您联系。</span>
                </motion.div>
              )}
            </form>
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link href="/supplier/submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors">
              <Package className="w-4 h-4" />
              已入驻？提交商品信息
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 商品详情弹窗 */}
      {showProductDetail && selectedProduct && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleCloseDetail}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            {/* 商品图片 */}
            <div className="relative h-64 bg-gray-100 rounded-t-2xl overflow-hidden">
              {getImage(selectedProduct) ? (
                <img src={getImage(selectedProduct)!} alt={selectedProduct.title}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
              )}
              <button onClick={handleCloseDetail}
                className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* 商品信息 */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">{selectedProduct.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {CATEGORY_MAP[selectedProduct.category || ""] || selectedProduct.category} · {selectedProduct.source === "platform" ? "平台自营" : "供应商货源"}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-accent">{formatPrice(selectedProduct.price)}</div>
                  {selectedProduct.original_price && selectedProduct.original_price > selectedProduct.price && (
                    <>
                      <div className="text-sm text-gray-400 line-through">{formatPrice(selectedProduct.original_price)}</div>
                      <div className="text-xs text-accent/80 mt-0.5">会员省 ¥{((selectedProduct.original_price - selectedProduct.price) / 100).toFixed(0)}</div>
                    </>
                  )}
                </div>
              </div>

              {selectedProduct.description && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{selectedProduct.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
                <div className="flex items-center gap-2 text-gray-500">
                  <Package className="w-4 h-4" />
                  <span>库存：{selectedProduct.stock} 件</span>
                </div>
                {selectedProduct.style_type && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Flame className="w-4 h-4" />
                    <span>风格：{USER_STYLE_OPTIONS.find(s => s.value === selectedProduct.style_type)?.label || selectedProduct.style_type}</span>
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button onClick={handleCloseDetail}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  返回列表
                </button>
                <button onClick={handleOpenPurchase}
                  className="flex-1 py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  立即下单
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 下单支付弹窗 */}
      {showPurchaseIntent && selectedProduct && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClosePurchase}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">
                {paymentSuccess ? "支付成功" : paymentQR ? "请付款" : "确认订单"}
              </h3>
              <button onClick={handleClosePurchase} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 支付成功 */}
            {paymentSuccess ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-bold text-gray-800">支付成功！</p>
                <p className="text-sm text-gray-500 mt-2">订单号：{currentOrderNo}</p>
                <p className="text-sm text-gray-500 mt-1">我们将尽快安排发货，请保持联系方式畅通。</p>
                <button onClick={handleClosePurchase}
                  className="mt-6 px-8 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent/90 transition-colors">
                  完成
                </button>
              </div>
            ) : paymentQR ? (
              /* 线下付款 */
              <div className="text-center">
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">{selectedProduct.title}</p>
                  <p className="text-2xl font-bold text-accent">
                    ¥{((selectedProduct.price * purchaseQuantity) / 100).toFixed(0)}
                    <span className="text-sm font-normal text-gray-400 ml-1">× {purchaseQuantity}件</span>
                  </p>
                </div>

                {/* 微信收款码 */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">1. 微信扫码付款</p>
                  <div className="flex justify-center">
                    <PaymentQRCode type="wechat" className="w-52 h-52" />
                  </div>
                </div>

                {/* 银行转账 */}
                <div className="mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 text-left">
                  <p className="text-sm font-medium text-gray-700 mb-1">2. 银行对公转账</p>
                  <div className="text-xs text-gray-600 space-y-0.5">
                    <p>户名：吴川市樟铺骆芷蝶教你好看穿搭小店</p>
                    <p>开户行：中国工商银行（吴川支行）</p>
                    <p>账号：2015021309200280877</p>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1">转账时请备注订单号：{currentOrderNo}</p>
                </div>

                <div className="relative flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">付款完成后</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button onClick={() => setPurchaseSubmitted(true)}
                  className="w-full py-3 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors">
                  我已付款，提交凭证
                </button>
                <p className="text-xs text-gray-400 mt-2">付款后请截图发给客服确认</p>
              </div>
            ) : (
              /* 订单确认表单 */
              <form onSubmit={(e) => { e.preventDefault(); handleCreateOrder(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商品</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600">
                    {selectedProduct.title} · {formatPrice(selectedProduct.price)}/件
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">采购数量 *</label>
                  <input type="number" min={1} value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                    required />
                  <p className="text-xs text-accent mt-1">
                    合计：¥{((selectedProduct.price * purchaseQuantity) / 100).toFixed(0)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系方式 *</label>
                  <input type="text" value={purchaseContact} onChange={(e) => setPurchaseContact(e.target.value)}
                    placeholder="手机号/微信号"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none"
                    required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">收货地址</label>
                  <input type="text" value={purchaseAddress} onChange={(e) => setPurchaseAddress(e.target.value)}
                    placeholder="省/市/区/详细地址"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                  <textarea value={purchaseNote} onChange={(e) => setPurchaseNote(e.target.value)}
                    placeholder="尺码、颜色等要求" rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none resize-none" />
                </div>

                {/* 支付方式选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">支付方式</label>
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => setPaymentType("wechat")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                        paymentType === "wechat" ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600"
                      }`}>
                      微信支付
                    </button>
                    <button type="button"
                      onClick={() => setPaymentType("alipay")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                        paymentType === "alipay" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                      }`}>
                      支付宝
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={orderCreating}
                  className="w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50">
                  {orderCreating ? "正在创建订单..." : `确认支付 ¥${((selectedProduct.price * purchaseQuantity) / 100).toFixed(0)}`}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* 查看价格充值提示弹窗 */}
      {showMemberPrompt && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowMemberPrompt(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {user ? "查看批发价" : "请先登录"}
              </h3>
              <button onClick={() => setShowMemberPrompt(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {user
                ? "开通查看价格会员，即可查看所有商品批发底价"
                : "登录后即可查看批发价格，或开通会员享受更多权益"}
            </p>
            <div className="space-y-3">
              {user ? (
                <button 
                  onClick={async () => {
                    setShowMemberPrompt(false);
                    // 调用微信支付开通会员
                    try {
                      const response = await fetch('/api/wechat-pay/unified-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          product_id: 'member_price_view',
                          total_fee: 29900, // 299元 = 29900分
                          platform: 'mini', // 或 'mp' 根据环境判断
                          openid: user.id // 需要获取用户的 openid
                        })
                      });
                      const result = await response.json();
                      if (result.prepay_id) {
                        // 调起微信支付
                        if (typeof window !== 'undefined' && (window as any).WechatJSAPI) {
                          (window as any).WechatJSAPI.chooseWXPay({
                            appId: result.appId,
                            timeStamp: result.timeStamp,
                            nonceStr: result.nonceStr,
                            package: result.package,
                            signType: result.signType,
                            paySign: result.paySign,
                            success: function(res: any) {
                              alert('支付成功！已开通会员');
                              window.location.reload();
                            },
                            fail: function(res: any) {
                              alert('支付失败，请重试');
                            }
                          });
                        } else {
                          // 网页端用 JSAPI
                          alert('请在微信中打开或稍后支持网页支付');
                        }
                      }
                    } catch (error) {
                      alert('支付发起失败，请重试');
                    }
                  }}
                  className="block w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl text-center"
                >
                  微信支付开通会员（¥299/年）
                </button>
              ) : (
                <Link href="/login?redirect=/buyer" onClick={() => setShowMemberPrompt(false)}>
                  <span className="block w-full py-3 bg-accent text-white text-sm font-semibold rounded-xl text-center">
                    去登录
                  </span>
                </Link>
              )}
              <button
                onClick={() => setShowMemberPrompt(false)}
                className="block w-full py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl text-center"
              >
                再看看
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

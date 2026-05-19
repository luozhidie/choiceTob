"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search, X, TrendingUp, Truck, Star, CheckCircle2,
  FileCheck, Shield, Factory, Headphones, Landmark,
  Upload, ArrowRight, Building2, Package, Flame,
  ChevronRight, Home,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PaywallModal } from "@/components/PaywallModal";
import { ALL_STYLES, COLOR_SEASONS_PRO, COLOR_SEASON_MARKET_MAP } from "@/lib/styles";
import { CATEGORY_MAP, SUBCATEGORY_MAP, CATEGORIES } from "@/lib/categories";

/* ==================== 品类选项（从 categories 派生）==================== */
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.key, label: c.label }));

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
  { value: "warm", label: "暖色系" },
  { value: "cool", label: "冷色系" },
  { value: "earth", label: "大地色系" },
  { value: "deep", label: "深色系" },
  { value: "neutral", label: "中性色系" },
];

/* 用户端色彩筛选 —— 色系映射到具体季型 */
const COLOR_SCHEME_TO_SEASONS: Record<string, string[]> = {
  warm: ["light_warm", "warm_bright", "clear_warm"],
  cool: ["light_cool", "soft_cool", "cool_soft"],
  earth: ["warm_soft", "soft_warm", "deep_warm"],
  deep: ["clear_cool", "deep_cool"],
  neutral: ["cool_bright"],
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
  category: string | null; subcategory: string | null;
  color_season: string | null; style_type: string | null;
  stock: number; is_published: boolean; source: "platform" | "buyer";
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
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MergedProduct | null>(null);
  const [visible, setVisible] = useState(false);

  // 供应商入驻表单
  const [supplierForm, setSupplierForm] = useState({
    company: "", contact: "", phone: "", category: "", brand: "", capacity: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  useEffect(() => { setVisible(true); fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const [buyerRes, platformRes, supplierRes, hotPickRes] = await Promise.all([
      supabase.from("buyer_products").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      supabase.from("products").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      supabase.from("suppliers").select("*").eq("is_published", true).order("rating", { ascending: false }),
      supabase.from("hot_picks").select("*").eq("is_published", true).order("sort_order", { ascending: true }).limit(8),
    ]);

    const merged: MergedProduct[] = [];
    if (!buyerRes.error && buyerRes.data) {
      buyerRes.data.forEach((p: any) => merged.push({
        id: p.id, title: p.title || p.name || "选品商品", description: p.description,
        cover_image: p.cover_image || p.image_url || null, price: p.price || 0,
        original_price: p.original_price || null, category: p.category || null,
        subcategory: p.subcategory || null, color_season: p.color_season || null,
        style_type: p.style_type || null, stock: p.stock || 0,
        is_published: p.is_published, source: "buyer", created_at: p.created_at,
      }));
    }
    if (!platformRes.error && platformRes.data) {
      platformRes.data.forEach((p: any) => merged.push({
        id: p.id, title: p.title || "平台商品", description: p.description,
        cover_image: p.cover_image || null, price: p.price || 0,
        original_price: p.original_price || null, category: p.category || null,
        subcategory: p.subcategory || null, color_season: null, style_type: null,
        stock: p.stock || 0, is_published: p.is_published, source: "platform", created_at: p.created_at,
      }));
    }
    setAllProducts(merged);
    if (!supplierRes.error && supplierRes.data) setSuppliers(supplierRes.data as Supplier[]);
    if (!hotPickRes.error && hotPickRes.data) setHotPicks(hotPickRes.data as HotPick[]);
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    let list = [...allProducts];
    list = list.filter((p) => p.category === "clothing" || p.category === "accessory");
    if (sourceFilter) list = list.filter((p) => p.source === sourceFilter);
    if (searchTerm.trim()) {
      const kw = searchTerm.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(kw) || (p.description || "").toLowerCase().includes(kw));
    }
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    /* 用户端风格筛选：直接匹配 style_type */
    if (activeUserStyle) list = list.filter((p) => p.style_type === activeUserStyle);
    /* 用户端色彩筛选：色系映射到具体季型 */
    if (activeUserColor && COLOR_SCHEME_TO_SEASONS[activeUserColor]) {
      const seasons = COLOR_SCHEME_TO_SEASONS[activeUserColor];
      list = list.filter((p) => p.color_season && seasons.includes(p.color_season));
    }
    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [allProducts, searchTerm, activeCategory, activeUserStyle, activeUserColor, sourceFilter, sortBy]);

  const handleBuy = (product: MergedProduct) => { setSelectedProduct(product); setShowPaywall(true); };
  const formatPrice = (price: number) => `¥${(price / 100).toFixed(0)}`;
  const getImage = (p: MergedProduct) => p.cover_image;

  const clearFilters = () => {
    setSearchTerm(""); setActiveCategory(""); setActiveStyle(""); setActiveColor("");
    setActiveUserStyle(""); setActiveUserColor("");
    setSourceFilter(""); setSortBy("sort_order");
  };
  const hasActiveFilter = activeCategory || activeUserStyle || activeUserColor || sourceFilter || searchTerm || sortBy !== "sort_order";

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
                <Flame className="w-3.5 h-3.5" />
                源头直供 · 一手货源
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">一手选品</h1>
              <p className="text-sm md:text-base text-white/80 max-w-xl mb-6">
                优质服装配饰一手货源，按风格、色系精准筛选，充值会员享2.6折拿货
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
            {/* 充值档位卡片 */}
            <div className="flex gap-3 shrink-0">
              {[
                { amount: "5万", discount: "2.8折", ret: "退5%" },
                { amount: "10万", discount: "2.8折", ret: "退10%" },
                { amount: "30万", discount: "2.6折", ret: "退20%" },
              ].map((tier) => (
                <div key={tier.amount} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center min-w-[100px]">
                  <div className="text-xl font-bold">{tier.amount}</div>
                  <div className="text-xs text-white/60 mt-1">充值</div>
                  <div className="mt-2 text-accent font-bold text-sm">{tier.discount}</div>
                  <div className="text-[10px] text-white/50">{tier.ret}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== 筛选栏 ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
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
            {CATEGORY_OPTIONS.map((cat) => (
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
                    <Link href={product.source === "buyer" ? `/buyer/${product.id}` : `/shop/${product.id}`}>
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
                      <Link href={product.source === "buyer" ? `/buyer/${product.id}` : `/shop/${product.id}`}>
                        <h3 className="font-bold text-primary group-hover:text-accent transition-colors mt-1.5 line-clamp-2 text-sm md:text-base">{product.title}</h3>
                      </Link>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 flex-1">{product.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                        <span className="text-base md:text-lg font-bold text-accent">{formatPrice(product.price)}</span>
                        <button onClick={() => handleBuy(product)}
                          className="btn-accent text-[10px] md:text-xs px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-medium">
                          采购
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

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

      {/* Paywall */}
      {showPaywall && selectedProduct && (
        <PaywallModal isOpen={showPaywall} type="product"
          title={selectedProduct.title}
          description={`${selectedProduct.source === "platform" ? "平台自营" : "供应商货源"} · 请联系客服确认折扣价`}
          onClose={() => { setShowPaywall(false); setSelectedProduct(null); }} />
      )}
    </div>
  );
}

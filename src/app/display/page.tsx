"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { PaywallModal } from "@/components/PaywallModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { COLOR_SEASONS_PRO, ALL_STYLES, STYLE_KEY_MAP } from "@/lib/styles";
import {
  ChevronRight, ArrowRight, LayoutGrid, Eye, Shirt, Palette,
  Ruler, CheckCircle2, Home, Loader2, X, ZoomIn,
  Filter, Search, Grid3X3, List, Heart, Share2,
  ShoppingCart, Star, Info, Layers, Maximize2,
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

  const supabase = createClient();

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const [displayRes, productRes] = await Promise.all([
      supabase.from("display_images").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      supabase.from("buyer_products").select("id, title, cover_image, price, category, subcategory, color_season, style_type")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .limit(8),
    ]);

    if (!displayRes.error && displayRes.data) setItems(displayRes.data as DisplayItem[]);
    if (!productRes.error && productRes.data) setRecommendProducts(productRes.data as ProductItem[]);
    setLoading(false);
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
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="完整陈列方案"
        description="登录后购买会员或单次付费即可查看完整内容"
        type="single"
      />

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

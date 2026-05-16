"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { PaywallModal } from "@/components/PaywallModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight, ArrowRight, LayoutGrid, Eye, Shirt, Palette,
  Ruler, CheckCircle2, Home, Loader2, X, ZoomIn,
  Filter, Search, Grid3X3, List, Heart, Share2,
  ShoppingCart, Star, Info, Layers, Maximize2,
} from "lucide-react";

/* ===================== 色彩季型 ===================== */
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

/* ===================== 风格类型 ===================== */
const STYLES = [
  { value: "shao_nv", label: "少女型" },
  { value: "you_ya", label: "优雅型" },
  { value: "lang_man_f", label: "浪漫型" },
  { value: "shi_shang_f", label: "时尚型" },
  { value: "gu_dian_f", label: "古典型" },
  { value: "zi_ran_f", label: "自然型" },
  { value: "xi_ju_f", label: "戏剧型" },
  { value: "shao_nian_f", label: "少年型" },
];

/* ===================== 场景 ===================== */
const SCENARIOS = [
  { value: "workplace", label: "职场通勤" },
  { value: "date", label: "周末约会" },
  { value: "casual", label: "休闲出行" },
  { value: "party", label: "晚宴社交" },
  { value: "vacation", label: "度假旅行" },
];

/* ===================== 陈列分类 ===================== */
const DISPLAY_SECTIONS = [
  { value: "styles", label: "风格陈列", icon: Shirt, desc: "按风格类型分区陈列" },
  { value: "scenarios", label: "场景搭配", icon: LayoutGrid, desc: "场景化搭配推荐" },
  { value: "layouts", label: "门店布局", icon: Ruler, desc: "科学规划门店分区" },
];

/* ===================== 接口 ===================== */
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
export default function DisplayPage() {
  const [showPaywall, setShowPaywall] = useState(false);
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [recommendProducts, setRecommendProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选
  const [activeSection, setActiveSection] = useState("styles");
  const [filterColor, setFilterColor] = useState("");
  const [filterStyle, setFilterStyle] = useState("");
  const [filterScenario, setFilterScenario] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 灯箱
  const [lightboxItem, setLightboxItem] = useState<DisplayItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // 收藏
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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
    if (filterColor) list = list.filter((i) => i.color_season === filterColor);
    if (filterStyle) list = list.filter((i) => i.style_type === filterStyle);
    if (filterScenario) list = list.filter((i) => i.scenario === filterScenario);
    if (searchTerm.trim()) {
      const kw = searchTerm.toLowerCase();
      list = list.filter((i) =>
        i.title.toLowerCase().includes(kw) || (i.description || "").toLowerCase().includes(kw)
      );
    }
    return list;
  }, [items, activeSection, filterColor, filterStyle, filterScenario, searchTerm]);

  // 灯箱导航
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
    setFilterColor(""); setFilterStyle(""); setFilterScenario(""); setSearchTerm("");
  };
  const hasFilter = filterColor || filterStyle || filterScenario || searchTerm;

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
      <AnimatePresence>
        {lightboxItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              onClick={() => setLightboxItem(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setLightboxItem(null)}
                className="absolute -top-12 right-0 p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* 主图 */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-black">
                {lightboxItem.image_url ? (
                  <img src={lightboxItem.image_url} alt={lightboxItem.title} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <LayoutGrid className="w-16 h-16 text-white/20" />
                  </div>
                )}
                {/* 左右导航 */}
                {filteredItems.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateLightbox("prev")}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white rotate-180" />
                    </button>
                    <button
                      onClick={() => navigateLightbox("next")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}
                {/* 图片计数 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-xs text-white/80 backdrop-blur-sm">
                  {lightboxIndex + 1} / {filteredItems.length}
                </div>
              </div>

              {/* 信息栏 */}
              <div className="mt-4 bg-white/10 backdrop-blur-md rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{lightboxItem.title}</h3>
                    {lightboxItem.description && (
                      <p className="mt-1 text-sm text-white/70">{lightboxItem.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {lightboxItem.color_season && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/80 text-white">
                          {COLOR_SEASONS.find(c => c.value === lightboxItem.color_season)?.label || lightboxItem.color_season}
                        </span>
                      )}
                      {lightboxItem.style_type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/80 text-white">
                          {STYLES.find(s => s.value === lightboxItem.style_type)?.label || lightboxItem.style_type}
                        </span>
                      )}
                      {lightboxItem.scenario && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                          {SCENARIOS.find(s => s.value === lightboxItem.scenario)?.label || lightboxItem.scenario}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(lightboxItem.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        favorites.has(lightboxItem.id)
                          ? "bg-red-500/20 text-red-400"
                          : "bg-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${favorites.has(lightboxItem.id) ? "fill-red-400" : ""}`} />
                    </button>
                    <button
                      onClick={() => setShowPaywall(true)}
                      className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
                    >
                      获取完整方案
                    </button>
                  </div>
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
            <Home className="w-4 h-4" />
            首页
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

      {/* ====== 三大陈列分区 Tab ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3 overflow-x-auto">
            {DISPLAY_SECTIONS.map((sec) => (
              <button
                key={sec.value}
                onClick={() => { setActiveSection(sec.value); clearFilters(); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeSection === sec.value ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索陈列案例..."
                className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-44"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* 色彩季型 */}
            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部色彩</option>
              {COLOR_SEASONS.map((c) => (
                <option key={c.value} value={c.value}>{c.group}·{c.label}</option>
              ))}
            </select>

            {/* 风格 */}
            <select
              value={filterStyle}
              onChange={(e) => setFilterStyle(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部风格</option>
              {STYLES.map((s) => (
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
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span>找到 {filteredItems.length} 个案例</span>
              {filterColor && (
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {COLOR_SEASONS.find(c => c.value === filterColor)?.label}
                </span>
              )}
              {filterStyle && (
                <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                  {STYLES.find(s => s.value === filterStyle)?.label}
                </span>
              )}
              {filterScenario && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  {SCENARIOS.find(s => s.value === filterScenario)?.label}
                </span>
              )}
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
            /* 网格视图 */
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
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
                        <LayoutGrid className="w-10 h-10 text-gray-300" />
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
                    {/* 底部信息 */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="text-base font-bold text-white line-clamp-1">{item.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1.5">
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
                  className="group flex gap-5 p-4 bg-white rounded-xl border border-gray-100 hover:border-accent/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => openLightbox(item)}
                >
                  {/* 缩略图 */}
                  <div className="w-32 h-40 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  {/* 信息 */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="font-bold text-primary group-hover:text-accent transition-colors">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-auto pt-3">
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
      <section className="py-16 lg:py-24 bg-muted">
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
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent/10 text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary group-hover:text-accent transition-colors">{item.title}</h3>
                      <p className="mt-0.5 text-sm text-muted-foreground">{item.desc}</p>
                    </div>
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
              <h2 className="text-3xl sm:text-4xl font-bold">预约陈列诊断</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                专业陈列顾问团队上门诊断，基于色彩季型与风格数据，为您定制专属陈列优化方案
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  预约陈列诊断
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/buyer"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  了解选品服务
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

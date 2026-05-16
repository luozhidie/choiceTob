"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, X, Loader2, ChevronLeft, ChevronRight,
  Eye, Tag, Calendar, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { PaywallModal } from "@/components/PaywallModal";

/* ==================== 动画 ==================== */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ==================== 接口 ==================== */
interface FashionTrend {
  id: string;
  category: string;
  title: string;
  content: string | null;
  images: string[] | null;
  date: string | null;
  price: number;
  is_published: boolean;
  created_at: string;
}

const categories = ["全部", "色彩趋势", "面料趋势", "款式趋势", "灵感图册"];

/* ==================== 页面 ==================== */
export default function FashionTrendsPage() {
  const [trends, setTrends] = useState<FashionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<FashionTrend | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const supabase = createClient();

  useEffect(() => { fetchTrends(); }, []);

  const fetchTrends = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fashion_trends")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (!error && data) setTrends(data as FashionTrend[]);
    setLoading(false);
  };

  const filteredTrends =
    selectedCategory === "全部"
      ? trends
      : trends.filter((t) => t.category === selectedCategory);

  const handleTrendClick = (trend: FashionTrend) => {
    setSelectedTrend(trend);
    setCurrentImageIndex(0);
    if (trend.price > 0) {
      setShowPaywall(true);
    }
  };

  const nextImage = () => {
    if (selectedTrend && currentImageIndex < (selectedTrend.images?.length || 0) - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title={`${selectedTrend?.title}" 需付费查看`}
        description={selectedTrend && selectedTrend.price > 0 ? `支付 ¥${(selectedTrend.price / 100).toFixed(2)} 即可查看完整趋势报告` : "请联系客服开通权限"}
        type="trend"
      />

      {/* 图片画廊弹窗 - 仅免费趋势显示 */}
      <AnimatePrescence mode="wait">
        {selectedTrend && !showPaywall && (
          <motion.div
            key="trend-gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setSelectedTrend(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl"
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setSelectedTrend(null)}
                className="absolute -top-12 right-0 text-white hover:text-accent transition-colors z-10"
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* 主图 */}
              {selectedTrend.images && selectedTrend.images.length > 0 && (
                <div className="relative aspect-[16/9] bg-black rounded-xl overflow-hidden">
                  <img
                    src={selectedTrend.images[currentImageIndex]}
                    alt={`${selectedTrend.title} - 图片 ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  {/* 左右导航 */}
                  {selectedTrend.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        disabled={currentImageIndex === selectedTrend.images.length - 1}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {/* 图片计数 */}
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-xs rounded-full">
                    {currentImageIndex + 1} / {selectedTrend.images.length}
                  </div>
                </div>
              )}

              {/* 缩略图条 */}
              {selectedTrend.images && selectedTrend.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {selectedTrend.images.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex ? "border-accent" : "border-transparent hover:border-white/50"
                      }`}
                    >
                      <img src={url} alt={`缩略图 ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* 标题与描述 */}
              <div className="mt-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-3 py-1 bg-primary/80 text-white text-xs font-medium rounded-full">
                    {selectedTrend.category}
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{selectedTrend.title}</h2>
                {selectedTrend.content && (
                  <p className="mt-3 text-white/80 leading-relaxed whitespace-pre-wrap">{selectedTrend.content}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePrescence>

      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">时尚趋势</span>
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
              <Eye className="w-4 h-4" />
              前沿时装趋势
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              时尚趋势
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              前沿时尚趋势分析，色彩、面料、款式全面解读
            </p>
          </motion.div>
        </div>
      </section>

      {/* ====== 分类筛选 ====== */}
      <section className="py-4 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 趋势列表 ====== */}
      <section className="py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : filteredTrends.length === 0 ? (
            <div className="text-center py-16">
              <Eye className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {selectedCategory !== "全部" ? "没有匹配的趋势报告" : "暂无趋势报告，敬请期待"}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {filteredTrends.map((trend, i) => (
                <motion.div
                  key={trend.id}
                  variants={fadeUp}
                  custom={i}
                  className="group cursor-pointer"
                  onClick={() => handleTrendClick(trend)}
                >
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30">
                    {/* 封面图 */}
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                      {trend.images && trend.images.length > 0 ? (
                        <img
                          src={trend.images[0]}
                          alt={trend.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Eye className="w-12 h-12 text-primary/20" />
                        </div>
                      )}
                      {/* 分类标签 */}
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/80 text-white font-medium">
                          {trend.category}
                        </span>
                      </div>
                      {/* 付费标签 */}
                      {trend.price > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold">
                            <Tag className="w-3 h-3" /> 付费
                          </span>
                        </div>
                      )}
                      {/* 多图提示 */}
                      {trend.images && trend.images.length > 1 && (
                        <div className="absolute bottom-3 right-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px]">
                            <Eye className="w-3 h-3" /> {trend.images.length}张
                          </span>
                        </div>
                      )}
                      {/* hover 遮罩 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                          查看详情
                        </span>
                      </div>
                    </div>
                    {/* 信息 */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {trend.date || new Date(trend.created_at).toLocaleDateString("zh-CN")}
                      </div>
                      <h3 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">
                        {trend.title}
                      </h3>
                      {trend.content && (
                        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                          {trend.content}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-16 lg:py-24 bg-muted/50">
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

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, X, Loader2, Eye, Tag, Lock, Newspaper, TrendingUp,
  ChevronRight, ChevronLeft, ArrowRight, Calendar,
} from "lucide-react";
import Link from "next/link";
import { PaywallModal } from "@/components/PaywallModal";
import { MagazineSubscribeModal } from "@/components/MagazineSubscribeModal";

/* ==================== 动画 ==================== */
/* ==================== Markdown 渲染 ==================== */
function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text
    .split('\n')
    .filter((line) => !/^\s*>\s*▶\s*观看秀场视频/.test(line));
  return lines.map((line, i) => {
    // 空行
    if (line.trim() === '') return <div key={i} className="h-2" />;
    // H3
    if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-primary mt-4 mb-2">{line.replace('### ', '')}</h3>;
    // H2
    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-primary mt-5 mb-3">{line.replace('## ', '')}</h2>;
    // H1
    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-primary mt-6 mb-3">{line.replace('# ', '')}</h1>;
    // 图片（加水印）
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      return (
        <div key={i} className="relative my-3">
          <img src={imgMatch[2]} alt={imgMatch[1]} className="max-w-full rounded-lg" />
          <span className="absolute bottom-3 right-3 px-2 py-1 text-xs font-semibold text-white/85 bg-[#2d1b2e]/45 rounded backdrop-blur-sm pointer-events-none">
            骆芷蝶智选
          </span>
        </div>
      );
    }
    // 粗体 + 普通文本
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    while ((match = boldRegex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
      parts.push(<strong key={`${i}-${match.index}`} className="font-semibold text-primary">{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex));
    return <p key={i} className="my-1.5 leading-relaxed text-gray-700">{parts}</p>;
  });
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" as const },
  }),
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

/* ==================== Tab 定义 ==================== */
const TABS = [
  { key: "magazine", label: "时尚博主", icon: Newspaper },
  { key: "trends", label: "时尚趋势", icon: TrendingUp },
] as const;
type TabKey = (typeof TABS)[number]["key"];

/* ==================== 接口 ==================== */
interface Article {
  id: string; title: string; excerpt: string | null; content: string | null;
  image_url: string | null; tag: string | null; is_premium: boolean;
  is_published: boolean; created_at: string;
}
interface SubscriptionPlan { id: string; name: string; price: number; duration_days: number; }
interface FashionTrend {
  id: string; category: string; title: string; content: string | null;
  images: string[] | null; date: string | null; price: number;
  is_published: boolean; created_at: string;
}

const trendCategories = ["全部", "色彩趋势", "面料趋势", "款式趋势", "灵感图册"];

/* ==================== 页面 ==================== */
export default function MagazineClient({ initialTab }: { initialTab?: string }) {
  const searchParams = useSearchParams();
  const tabFromUrl = (searchParams.get("tab") as TabKey) || (initialTab as TabKey) || "magazine";
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((t) => t.key === tabFromUrl) ? tabFromUrl : "magazine"
  );

  /* ---- 杂志 state ---- */
  const [articles, setArticles] = useState<Article[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [magLoading, setMagLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("全部");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  /* ---- 趋势 state ---- */
  const [trends, setTrends] = useState<FashionTrend[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [selectedTrend, setSelectedTrend] = useState<FashionTrend | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  /* ---- 共享 state ---- */
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [paywallTitle, setPaywallTitle] = useState("");
  const [paywallDesc, setPaywallDesc] = useState("");
  const [paywallType, setPaywallType] = useState<"subscription" | "trend">("subscription");

  const supabase = createClient();

  useEffect(() => { fetchArticles(); fetchPlans(); fetchTrends(); }, []);

  const fetchArticles = async () => {
    setMagLoading(true);
    const { data, error } = await supabase.from("articles").select("*").eq("is_published", true).order("created_at", { ascending: false });
    if (!error && data) setArticles(data as Article[]);
    setMagLoading(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true);
    if (!error && data) setPlans(data as SubscriptionPlan[]);
  };

  const fetchTrends = async () => {
    setTrendLoading(true);
    const { data, error } = await supabase.from("fashion_trends").select("*").eq("is_published", true).order("created_at", { ascending: false });
    if (!error && data) setTrends(data as FashionTrend[]);
    setTrendLoading(false);
  };

  /* ---- 杂志逻辑 ---- */
  const tags = ["全部", ...Array.from(new Set(articles.map((a) => a.tag).filter(Boolean))) as string[]];
  const filteredArticles = selectedTag === "全部" ? articles : articles.filter((a) => a.tag === selectedTag);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    if (article.is_premium) {
      setShowSubscribe(true);
    }
  };

  /* ---- 趋势逻辑 ---- */
  const filteredTrends = selectedCategory === "全部" ? trends : trends.filter((t) => t.category === selectedCategory);

  const handleTrendClick = (trend: FashionTrend) => {
    setSelectedTrend(trend);
    setCurrentImageIndex(0);
    if (trend.price > 0) {
      setShowSubscribe(true);
    }
  };

  const nextImage = () => {
    if (selectedTrend && currentImageIndex < (selectedTrend.images?.length || 0) - 1) setCurrentImageIndex(currentImageIndex + 1);
  };
  const prevImage = () => { if (currentImageIndex > 0) setCurrentImageIndex(currentImageIndex - 1); };

  /* ---- 渲染 ---- */
  return (
    <>
      <MagazineSubscribeModal isOpen={showSubscribe} onClose={() => setShowSubscribe(false)} />

      {/* 文章详情弹窗：付费文章不在这里显示，由MagazineSubscribeModal处理 */}

      {/* 文章详情弹窗 */}
      <AnimatePresence mode="wait">
        {selectedArticle && !selectedArticle.is_premium && (
          <motion.div key="article-detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-primary pr-8">{selectedArticle.title}</h3>
                <button onClick={() => setSelectedArticle(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              {/* 品牌/推广横幅：作为文章封面，不放秀场图，避免与正文首图重复 */}
              <div className="px-6 pt-5 pb-4 bg-gradient-to-br from-[#2d1b2e] via-[#5c2a4e] to-[#8b4368] text-white">
                <div className="text-xl font-extrabold tracking-wide">骆芷蝶智选</div>
                <div className="mt-1 text-sm text-white/85">每日搭配灵感 · 会员专享秀场资讯</div>
                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-white/90 text-[#2d1b2e] text-xs font-semibold">微信小程序搜「骆芷蝶智选」解锁完整内容</div>
              </div>
              <div className="p-6">
                {selectedArticle.content && <div className="prose max-w-none">{renderMarkdown(selectedArticle.content)}</div>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 趋势图片画廊弹窗 */}
      <AnimatePresence mode="wait">
        {selectedTrend && !showSubscribe && (
          <motion.div key="trend-gallery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setSelectedTrend(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-6xl">
              <button onClick={() => setSelectedTrend(null)} className="absolute -top-12 right-0 text-white hover:text-accent transition-colors z-10">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              {selectedTrend.images && selectedTrend.images.length > 0 && (
                <div className="relative aspect-[16/9] bg-black rounded-xl overflow-hidden">
                  <img src={selectedTrend.images[currentImageIndex]} alt={`${selectedTrend.title} - 图片 ${currentImageIndex + 1}`} className="w-full h-full object-contain" />
                  <span className="absolute bottom-4 left-4 px-2 py-1 text-xs font-semibold text-white/85 bg-[#2d1b2e]/45 rounded backdrop-blur-sm pointer-events-none">骆芷蝶智选</span>
                  {selectedTrend.images.length > 1 && (
                    <>
                      <button onClick={prevImage} disabled={currentImageIndex === 0} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={nextImage} disabled={currentImageIndex === selectedTrend.images.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
                    </>
                  )}
                  <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/50 text-white text-xs rounded-full">{currentImageIndex + 1} / {selectedTrend.images.length}</div>
                </div>
              )}
              {selectedTrend.images && selectedTrend.images.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {selectedTrend.images.map((url, index) => (
                    <button key={index} onClick={() => setCurrentImageIndex(index)} className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${index === currentImageIndex ? "border-accent" : "border-transparent hover:border-white/50"}`}>
                      <img src={url} alt={`缩略图 ${index + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 text-[8px] font-semibold text-white/80 bg-[#2d1b2e]/50 rounded pointer-events-none">骆芷蝶智选</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-3 py-1 bg-primary/80 text-white text-xs font-medium rounded-full">{selectedTrend.category}</span>
                </div>
                <h2 className="text-2xl font-bold">{selectedTrend.title}</h2>
                {selectedTrend.content && <p className="mt-3 text-white/80 leading-relaxed whitespace-pre-wrap">{selectedTrend.content}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <nav className="bg-muted/60 border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="w-4 h-4" /> 首页</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">时尚博主</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <motion.div className="max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-accent text-sm font-medium backdrop-blur-sm border border-white/10 mb-4">
              <Newspaper className="w-4 h-4" /> 时尚资讯与趋势
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              时尚博主<span className="text-accent">与趋势</span>
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              最新时尚趋势分析、行业动态、搭配技巧，一站式阅读体验
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => setShowSubscribe(true)}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                月费会员 ¥138/月
              </button>
              <button onClick={() => setShowSubscribe(true)}
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                订阅一年享优惠价格 ¥1,380/年
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tab 切换 */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-3 overflow-x-auto">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${activeTab === tab.key ? "bg-primary text-white" : "text-gray-700 hover:bg-primary/5"}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 杂志 Tab ====== */}
      {activeTab === "magazine" && (
        <>
          {/* 标签筛选 */}
          <section className="py-4 bg-white border-b border-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                {tags.map((tag) => (
                  <button key={tag} onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTag === tag ? "bg-accent text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 文章列表 */}
          <section className="py-12 md:py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {magLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent mr-3" /><span className="text-muted-foreground">加载中...</span></div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-16"><Newspaper className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-muted-foreground text-sm">{selectedTag !== "全部" ? "没有匹配的杂志文章" : "暂无杂志文章，敬请期待"}</p></div>
              ) : (
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
                  {filteredArticles.map((article, i) => (
                    <motion.div key={article.id} variants={fadeUp} custom={i} className="group cursor-pointer" onClick={() => handleArticleClick(article)}>
                      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30">
                        <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                          {article.image_url ? (
                            <div className="relative w-full h-full">
                              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              <span className="absolute bottom-3 right-3 px-2 py-1 text-[10px] font-semibold text-white/85 bg-[#2d1b2e]/45 rounded backdrop-blur-sm pointer-events-none">骆芷蝶智选</span>
                            </div>
                          ) : <div className="w-full h-full flex items-center justify-center"><Newspaper className="w-12 h-12 text-primary/20" /></div>}
                          {article.is_premium && <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold"><Lock className="w-3 h-3" /> 付费</span>}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">阅读详情</span>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                            {article.tag && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium"><Tag className="w-3 h-3" /> {article.tag}</span>}
                            <span>{new Date(article.created_at).toLocaleDateString("zh-CN")}</span>
                          </div>
                          <h3 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">{article.title}</h3>
                          {article.excerpt && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        </>
      )}

      {/* ====== 趋势 Tab ====== */}
      {activeTab === "trends" && (
        <>
          {/* 分类筛选 */}
          <section className="py-4 bg-white border-b border-gray-100">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                {trendCategories.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 趋势列表 */}
          <section className="py-12 md:py-16 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {trendLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent mr-3" /><span className="text-muted-foreground">加载中...</span></div>
              ) : filteredTrends.length === 0 ? (
                <div className="text-center py-16"><Eye className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-muted-foreground text-sm">{selectedCategory !== "全部" ? "没有匹配的趋势报告" : "暂无趋势报告，敬请期待"}</p></div>
              ) : (
                <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger}>
                  {filteredTrends.map((trend, i) => (
                    <motion.div key={trend.id} variants={fadeUp} custom={i} className="group cursor-pointer" onClick={() => handleTrendClick(trend)}>
                      <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30">
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                          {trend.images && trend.images.length > 0 ? <img src={trend.images[0]} alt={trend.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Eye className="w-12 h-12 text-primary/20" /></div>}
                          <div className="absolute top-3 left-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/80 text-white font-medium">{trend.category}</span></div>
                          {trend.price > 0 && <div className="absolute top-3 right-3"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold"><Tag className="w-3 h-3" /> 付费</span></div>}
                          {trend.images && trend.images.length > 1 && <div className="absolute bottom-3 right-3"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px]"><Eye className="w-3 h-3" /> {trend.images.length}张</span></div>}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">查看详情</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{trend.date || new Date(trend.created_at).toLocaleDateString("zh-CN")}</div>
                          <h3 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">{trend.title}</h3>
                          {trend.content && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{trend.content}</p>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </section>
        </>
      )}

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-muted/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 sm:px-12 lg:px-20 py-14 sm:py-20 text-center text-white" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp}>
            <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold">订阅完整内容</h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">解锁全部付费文章与趋势报告，掌握前沿时尚动态</p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => setShowSubscribe(true)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                  查看订阅方案 <ChevronRight className="w-5 h-5" />
                </button>
                <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20">
                  咨询顾问 <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

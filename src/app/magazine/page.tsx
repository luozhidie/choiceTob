"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, X, Loader2, Eye, Tag, Lock,
  ChevronRight, ArrowRight, Newspaper,
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
interface Article {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  tag: string | null;
  is_premium: boolean;
  is_published: boolean;
  created_at: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

/* ==================== 页面 ==================== */
export default function MagazinePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("全部");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const supabase = createClient();

  useEffect(() => { fetchArticles(); fetchPlans(); }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (!error && data) setArticles(data as Article[]);
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true);
    if (!error && data) setPlans(data as SubscriptionPlan[]);
  };

  const tags = ["全部", ...Array.from(new Set(articles.map((a) => a.tag).filter(Boolean))) as string[]];

  const filteredArticles =
    selectedTag === "全部"
      ? articles
      : articles.filter((a) => a.tag === selectedTag);

  const handleArticleClick = (article: Article) => {
    if (article.is_premium) {
      setSelectedArticle(article);
      setShowPaywall(true);
    } else {
      setSelectedArticle(article);
    }
  };

  return (
    <>
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        title="完整文章阅读"
        description="付费订阅后即可阅读全部杂志文章"
        type="subscription"
      />

      {/* 文章详情弹窗 */}
      <AnimatePrescence mode="wait">
        {selectedArticle && !selectedArticle.is_premium && (
          <motion.div
            key="article-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-primary pr-8">{selectedArticle.title}</h3>
                <button onClick={() => setSelectedArticle(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                {selectedArticle.image_url && (
                  <img src={selectedArticle.image_url} alt={selectedArticle.title} className="w-full rounded-lg mb-6" />
                )}
                {selectedArticle.content && (
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
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
          <span className="text-primary font-medium">杂志</span>
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
              <Newspaper className="w-4 h-4" />
              行业权威杂志
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              流行资讯
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              最新时尚趋势、行业动态、搭配技巧，一站式阅读体验
            </p>

            {/* 订阅计划 */}
            {plans.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setShowPaywall(true)}
                    className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                  >
                    {plan.name} ¥{(plan.price / 100).toFixed(0)}/{plan.duration_days === 30 ? "月" : "年"}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ====== 标签筛选 ====== */}
      <section className="py-4 bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? "bg-accent text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 文章列表 ====== */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-accent mr-3" />
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {selectedTag !== "全部" ? "没有匹配的杂志文章" : "暂无杂志文章，敬请期待"}
              </p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
            >
              {filteredArticles.map((article, i) => (
                <motion.div
                  key={article.id}
                  variants={fadeUp}
                  custom={i}
                  className="group cursor-pointer"
                  onClick={() => handleArticleClick(article)}
                >
                  <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30">
                    {/* 封面 */}
                    <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                      {article.image_url ? (
                        <img src={article.image_url} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-12 h-12 text-primary/20" />
                        </div>
                      )}
                      {article.is_premium && (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                          <Lock className="w-3 h-3" /> 付费
                        </span>
                      )}
                      {/* hover 遮罩 */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <span className="px-4 py-2 bg-white/90 text-primary text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                          阅读详情
                        </span>
                      </div>
                    </div>
                    {/* 信息 */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                        {article.tag && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            <Tag className="w-3 h-3" /> {article.tag}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 inline-block">{new Date(article.created_at).toLocaleDateString("zh-CN")}</span>
                        </span>
                      </div>
                      <h3 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
                          {article.excerpt}
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

      {/* ====== 订阅 CTA ====== */}
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
                订阅完整杂志
              </h2>
              <p className="mt-4 text-white/80 max-w-xl mx-auto leading-relaxed">
                解锁全部付费文章，掌握前沿时尚趋势与行业洞察
              </p>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setShowPaywall(true)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
                >
                  查看订阅方案
                  <ChevronRight className="w-5 h-5" />
                </button>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  咨询顾问
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

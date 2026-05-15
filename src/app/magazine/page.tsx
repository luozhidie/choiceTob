"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Calendar, Tag, Lock, Eye, Loader2 } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";

interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  tag: string;
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

export default function MagazinePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("全部");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchArticles();
    fetchPlans();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching articles:", error);
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching plans:", error);
    } else {
      setPlans(data || []);
    }
  };

  const tags = ["全部", ...Array.from(new Set(articles.map((a) => a.tag).filter(Boolean)))];

  const filteredArticles =
    selectedTag === "全部"
      ? articles
      : articles.filter((a) => a.tag === selectedTag);

  const handleArticleClick = (article: Article) => {
    if (article.is_premium) {
      // 付费文章，显示付费墙
      setSelectedArticle(article);
      setShowPaywall(true);
    } else {
      // 免费文章，直接查看
      setSelectedArticle(article);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              流行资讯
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-6">
              最新时尚趋势、行业动态、搭配技巧
            </p>

            {/* Subscription Plans */}
            {plans.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setShowPaywall(true)}
                    className="px-6 py-3 bg-accent text-primary font-bold rounded-lg hover:bg-accent/90 transition-colors"
                  >
                    {plan.name} ¥{(plan.price / 100).toFixed(2)}/{plan.duration_days === 30 ? "月" : "年"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tag Filter */}
      <section className="py-6 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? "bg-accent text-primary"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无文章</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Article Image */}
                  <div className="relative aspect-[16/9] bg-gray-100">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/10">
                        <Eye className="w-12 h-12 text-accent/50" />
                      </div>
                    )}
                    {article.is_premium && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                          <Lock className="w-3 h-3" />
                          付费
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Article Info */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
                      {article.tag && (
                        <span className="inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {article.tag}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(article.created_at).toLocaleDateString("zh-CN")}
                      </span>
                    </div>
                    <h3 className="font-bold text-primary mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {article.excerpt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Article Detail Modal */}
      {selectedArticle && !selectedArticle.is_premium && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-primary pr-8">{selectedArticle.title}</h2>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {selectedArticle.image_url && (
                <img
                  src={selectedArticle.image_url}
                  alt={selectedArticle.title}
                  className="w-full rounded-lg mb-6"
                />
              )}
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          type="subscription"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}

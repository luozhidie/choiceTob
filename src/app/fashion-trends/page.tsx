"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Calendar, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { PaywallModal } from "@/components/PaywallModal";

interface FashionTrend {
  id: string;
  category: string;
  title: string;
  content: string;
  images: string[];
  date: string;
  is_published: boolean;
  created_at: string;
}

const categories = ["全部", "色彩趋势", "面料趋势", "款式趋势", "灵感图册"];

export default function FashionTrendsPage() {
  const [trends, setTrends] = useState<FashionTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedTrend, setSelectedTrend] = useState<FashionTrend | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("fashion_trends")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching trends:", error);
    } else {
      setTrends(data || []);
    }
    setLoading(false);
  };

  const filteredTrends =
    selectedCategory === "全部"
      ? trends
      : trends.filter((t) => t.category === selectedCategory);

  const handleTrendClick = (trend: FashionTrend) => {
    setSelectedTrend(trend);
    setCurrentImageIndex(0);
    setShowPaywall(true);
  };

  const nextImage = () => {
    if (selectedTrend && currentImageIndex < selectedTrend.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-primary text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              服装趋势
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed">
              前沿时尚趋势分析，色彩、面料、款式全面解读
            </p>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-6 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-accent text-primary"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trends Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-accent mb-4" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : filteredTrends.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">暂无趋势报告</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTrends.map((trend) => (
                <div
                  key={trend.id}
                  onClick={() => handleTrendClick(trend)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Trend Cover Image */}
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {trend.images && trend.images.length > 0 ? (
                      <img
                        src={trend.images[0]}
                        alt={trend.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/10">
                        <Eye className="w-12 h-12 text-accent/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-primary mb-2">
                        {trend.category}
                      </span>
                      <h3 className="font-bold text-white line-clamp-2">
                        {trend.title}
                      </h3>
                    </div>
                    {trend.images && trend.images.length > 1 && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                          <Eye className="w-3 h-3" />
                          {trend.images.length} 张
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Trend Info */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="w-3 h-3" />
                      {trend.date || new Date(trend.created_at).toLocaleDateString("zh-CN")}
                    </div>
                    {trend.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {trend.content}
                      </p>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrendClick(trend);
                      }}
                      className="mt-3 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                    >
                      查看详情 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Image Gallery Modal */}
      {selectedTrend && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-6xl">
            {/* Close Button */}
            <button
              onClick={() => setSelectedTrend(null)}
              className="absolute -top-12 right-0 text-white hover:text-accent transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Main Image */}
            {selectedTrend.images && selectedTrend.images.length > 0 && (
              <div className="relative aspect-[16/9] bg-black rounded-lg overflow-hidden">
                <img
                  src={selectedTrend.images[currentImageIndex]}
                  alt={`${selectedTrend.title} - 图片 ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />

                {/* Navigation Arrows */}
                {selectedTrend.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      disabled={currentImageIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={currentImageIndex === selectedTrend.images.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/70 text-white text-sm rounded-full">
                  {currentImageIndex + 1} / {selectedTrend.images.length}
                </div>
              </div>
            )}

            {/* Thumbnail Strip */}
            {selectedTrend.images && selectedTrend.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {selectedTrend.images.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? "border-accent"
                        : "border-transparent hover:border-white/50"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`缩略图 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Description */}
            <div className="mt-6 text-white">
              <span className="inline-flex items-center px-3 py-1 bg-accent text-primary text-sm font-bold rounded-full mb-3">
                {selectedTrend.category}
              </span>
              <h2 className="text-2xl font-bold mb-2">{selectedTrend.title}</h2>
              {selectedTrend.content && (
                <p className="text-white/80 leading-relaxed">{selectedTrend.content}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          type="trend"
          onClose={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
}

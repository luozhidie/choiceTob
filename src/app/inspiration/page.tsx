"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Heart, Eye, ChevronRight, Home, Filter } from "lucide-react";
import { motion } from "framer-motion";

interface OutfitMatch {
  id: string;
  title: string;
  description: string | null;
  product_ids: string[];
  style_tags: string[] | null;
  season_tags: string[] | null;
  occasion: string | null;
  match_rule_code: string | null;
  ai_report: any;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export default function InspirationPage() {
  const [outfits, setOutfits] = useState<OutfitMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedSeason, setSelectedSeason] = useState<string>("");

  const supabase = createClient();

  const styles = ["", "少女型", "优雅型", "浪漫型", "少年型", "时尚型", "古典型", "自然型", "戏剧型"];
  const seasons = ["", "S01-浅暖", "S02-浅冷", "S03-深暖", "S04-深冷", "S05-暖亮", "S06-暖柔", "S07-冷亮", "S08-冷柔", "S09-净冷", "S10-净暖", "S11-柔冷", "S12-柔暖"];

  useEffect(() => {
    fetchOutfits();
  }, []);

  const fetchOutfits = async () => {
    setLoading(true);
    let query = supabase
      .from("outfit_matches")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    const { data, error } = await query;
    if (!error && data) setOutfits(data as OutfitMatch[]);
    setLoading(false);
  };

  const filteredOutfits = outfits.filter((o) => {
    if (selectedStyle && o.style_tags && !o.style_tags.includes(selectedStyle)) return false;
    if (selectedSeason && o.season_tags && !o.season_tags.includes(selectedSeason)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" /> 首页
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">每日搭配灵感</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/80 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">每日搭配灵感</h1>
          <p className="mt-2 text-white/80">根据你的色彩季型和风格偏好，每日精选搭配方案</p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex gap-3 overflow-x-auto">
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部风格</option>
            {styles.filter(s => s).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">全部色彩季型</option>
            {seasons.filter(s => s).map((s) => (
              <option key={s} value={s.split("-")[0]}>{s}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Outfit Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : filteredOutfits.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            暂无搭配方案，请稍后再来查看
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOutfits.map((outfit) => (
              <motion.div
                key={outfit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Outfit Image Placeholder */}
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">👗</div>
                    <div className="text-sm text-gray-400">搭配方案预览</div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-gray-900 mb-1">{outfit.title}</h3>
                  {outfit.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{outfit.description}</p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {outfit.style_tags?.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {tag}
                      </span>
                    ))}
                    {outfit.season_tags?.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                        {tag}
                      </span>
                    ))}
                    {outfit.occasion && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        {outfit.occasion}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>收藏</span>
                    </button>
                    <Link
                      href={`/inspiration/${outfit.id}`}
                      className="flex items-center gap-1 text-sm text-primary font-medium hover:underline"
                    >
                      <Eye className="w-4 h-4" />
                      查看详情
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

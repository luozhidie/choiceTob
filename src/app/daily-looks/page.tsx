"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Palette, Sparkles, Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

/* ── 搭配类型 ── */
interface DailyLook {
  id: string;
  title: string;
  colors: string[];
  image_url: string | null;
  style: string;
  description: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

/* ── 风格筛选标签 ── */
const STYLE_TABS = ["全部", "温柔知性", "职场通勤", "休闲随性", "优雅气质", "活力潮流"];

export default function DailyLooksPage() {
  const [looks, setLooks] = useState<DailyLook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStyle, setActiveStyle] = useState("全部");
  const [visible, setVisible] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setVisible(true);
    fetchLooks();
  }, []);

  const fetchLooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_looks")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setLooks(
        (data || []).map((d: any) => ({
          ...d,
          colors: Array.isArray(d.colors) ? d.colors : JSON.parse(d.colors || "[]"),
        }))
      );
    } catch {
      // 表可能不存在，静默处理
    } finally {
      setLoading(false);
    }
  };

  const filteredLooks =
    activeStyle === "全部"
      ? looks
      : looks.filter((l) => l.style?.includes(activeStyle));

  /* 今日日期 */
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDay = ["日", "一", "二", "三", "四", "五", "六"][today.getDay()];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-accent/10 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
        </div>
        <div
          className={`container mx-auto px-4 text-center relative z-10 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm mb-6 backdrop-blur-sm">
            <Calendar className="w-4 h-4" />
            {dateStr} 星期{weekDay}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">每日搭配灵感</h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            每一天都值得精心搭配，让色彩为你点亮好心情
          </p>
        </div>
      </section>

      {/* ── 风格筛选 ── */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
            {STYLE_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveStyle(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeStyle === tab
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── 搭配卡片 ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="mt-4 text-sm text-muted-foreground">加载搭配灵感中...</p>
            </div>
          ) : filteredLooks.length === 0 ? (
            <div className="text-center py-20">
              <Palette className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-primary mb-2">暂无搭配灵感</h3>
              <p className="text-sm text-muted-foreground">
                搭配灵感正在筹备中，敬请期待
              </p>
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                浏览教学课程
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredLooks.map((look, i) => (
                <motion.div
                  key={look.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.08, 0.4) }}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30"
                >
                  {/* 图片区 */}
                  {look.image_url ? (
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={look.image_url}
                        alt={look.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* 色彩条 */}
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        {look.colors.map((c: string) => (
                          <div
                            key={c}
                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-accent/10 flex items-center justify-center">
                      <div className="flex gap-2">
                        {look.colors.map((c: string) => (
                          <div
                            key={c}
                            className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 文字区 */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                        {look.style}
                      </span>
                    </div>
                    <h3 className="font-bold text-primary group-hover:text-accent transition-colors">
                      {look.title}
                    </h3>
                    {look.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                        {look.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50">
                      {look.colors.map((c: string) => (
                        <div
                          key={c}
                          className="w-4 h-4 rounded-full shadow-sm border border-gray-100"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 底部引导 ── */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg font-bold text-primary">想学习更多搭配技巧？</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            从色彩诊断到风格定位，专业课程帮你系统提升穿搭能力
          </p>
          <div className="mt-6 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              浏览教学课程
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/style-test"
              className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-primary text-primary text-sm font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
            >
              <Palette className="w-4 h-4" />
              风格测试
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

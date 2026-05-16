"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Clock, Star, Filter } from "lucide-react";
import { motion } from "framer-motion";

interface Course {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  is_free: boolean;
  category: string | null;
  level: string;
  duration_minutes: number | null;
  is_published: boolean;
  created_at: string;
}

const categoryMap: Record<string, string> = {
  cmb_color: "CMB色彩诊断",
  styling: "搭配技巧",
  wardrobe: "衣橱管理",
  image: "形象提升",
  color_tools: "色彩工具",
  book: "书籍资料",
  pro_tool: "专业工具",
};

const levelMap: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [visible, setVisible] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setVisible(true);
    fetchCourses();
  }, []);

  useEffect(() => {
    let filtered = [...allCourses];
    if (filterCategory) filtered = filtered.filter((c) => c.category === filterCategory);
    if (filterLevel) filtered = filtered.filter((c) => c.level === filterLevel);
    setCourses(filtered);
  }, [filterCategory, filterLevel, allCourses]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (!error && data) {
      setAllCourses(data as Course[]);
      setCourses(data as Course[]);
    }
    setLoading(false);
  };

  const formatPrice = (price: number, isFree: boolean) =>
    isFree ? "免费" : `¥${(price / 100).toFixed(0)}`;

  const formatDuration = (minutes: number | null) =>
    minutes ? `${Math.floor(minutes / 60)}小时${minutes % 60}分` : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 md:py-20">
        <div className={`container mx-auto px-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">线上课程</h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            专业色彩形象课程，从入门到精通，助你掌握个人风格密码
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部分类</option>
              <option value="cmb_color">CMB色彩诊断</option>
              <option value="styling">搭配技巧</option>
              <option value="wardrobe">衣橱管理</option>
              <option value="image">形象提升</option>
              <option value="color_tools">色彩工具</option>
              <option value="book">书籍资料</option>
              <option value="pro_tool">专业工具</option>
            </select>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">全部难度</option>
              <option value="beginner">入门</option>
              <option value="intermediate">进阶</option>
              <option value="advanced">高级</option>
            </select>
            {(filterCategory || filterLevel) && (
              <button
                onClick={() => { setFilterCategory(""); setFilterLevel(""); }}
                className="text-xs text-accent hover:underline"
              >
                清除筛选
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {filterCategory || filterLevel ? "没有匹配的课程" : "暂无已发布的课程"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.1, 0.5) }}
                >
                  <Link
                    href={`/courses/${course.id}`}
                    className="group block bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30"
                  >
                    {/* Cover */}
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      {course.cover_image ? (
                        <img src={course.cover_image} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-10 h-10 text-primary/30" />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        {course.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {categoryMap[course.category] || course.category}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {levelMap[course.level] || course.level}
                        </span>
                      </div>
                      <h3 className="font-bold text-primary group-hover:text-accent transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {course.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(course.duration_minutes)}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm font-bold ${course.is_free ? "text-green-500" : "text-accent"}`}>
                          {formatPrice(course.price, course.is_free)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

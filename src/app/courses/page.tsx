"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Clock, Star, Filter, Palette, BookType, Wrench,
  ShoppingBag, ChevronRight, Search, X, Home,
  CalendarDays, PenTool, Droplet, Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORY_MAP, SUBCATEGORY_MAP, getSubcategories } from "@/lib/categories";

/* ===================== 课程类型 ===================== */
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

/* ===================== 商品类型 ===================== */
interface Product {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  price: number;
  original_price: number | null;
  category: string | null;
  subcategory: string | null;
  is_published: boolean;
  created_at: string;
}

/* ===================== 常量 ===================== */
const courseCategoryMap: Record<string, string> = {
  cmb_color: "CMB色彩诊断",
  styling: "搭配技巧",
  wardrobe: "衣橱管理",
  image: "形象提升",
};

const levelMap: Record<string, string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
};

// 工具商品分类（从买手选品移过来的三个品类）
const TOOL_CATEGORIES = [
  { value: "color_tools", label: "色彩工具", icon: Palette, color: "from-violet-500 to-purple-400" },
  { value: "book", label: "书籍资料", icon: BookType, color: "from-blue-500 to-cyan-400" },
  { value: "pro_tool", label: "专业工具", icon: Wrench, color: "from-amber-500 to-orange-400" },
];

/* ===================== 页面 ===================== */
export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [toolCategory, setToolCategory] = useState("");
  const [toolSubcategory, setToolSubcategory] = useState("");
  const [toolSearch, setToolSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"courses" | "tools">("courses");
  const [visible, setVisible] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    setVisible(true);
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    const [courseRes, productRes] = await Promise.all([
      supabase.from("courses").select("*").eq("is_published", true).order("sort_order", { ascending: true }),
      supabase.from("products").select("*").eq("is_published", true)
        .in("category", ["color_tools", "book", "pro_tool"])
        .order("sort_order", { ascending: true }),
    ]);

    if (!courseRes.error && courseRes.data) {
      setAllCourses(courseRes.data as Course[]);
      setCourses(courseRes.data as Course[]);
    }
    if (!productRes.error && productRes.data) {
      setProducts(productRes.data as Product[]);
    }
    setLoading(false);
  };

  // 课程筛选
  useEffect(() => {
    let filtered = [...allCourses];
    if (filterCategory) filtered = filtered.filter((c) => c.category === filterCategory);
    if (filterLevel) filtered = filtered.filter((c) => c.level === filterLevel);
    setCourses(filtered);
  }, [filterCategory, filterLevel, allCourses]);

  // 工具商品筛选
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (toolCategory) list = list.filter((p) => p.category === toolCategory);
    if (toolSubcategory) list = list.filter((p) => p.subcategory === toolSubcategory);
    if (toolSearch.trim()) {
      const kw = toolSearch.toLowerCase();
      list = list.filter((p) =>
        p.title.toLowerCase().includes(kw) || (p.description || "").toLowerCase().includes(kw)
      );
    }
    return list;
  }, [products, toolCategory, toolSubcategory, toolSearch]);

  // 色彩工具/书籍资料/专业工具的数量统计
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = { color_tools: 0, book: 0, pro_tool: 0 };
    products.forEach((p) => {
      if (counts[p.category!] !== undefined) counts[p.category!]++;
    });
    return counts;
  }, [products]);

  const formatPrice = (price: number, isFree?: boolean) =>
    isFree ? "免费" : `¥${(price / 100).toFixed(0)}`;

  const formatDuration = (minutes: number | null) =>
    minutes ? `${Math.floor(minutes / 60)}小时${minutes % 60}分` : "";

  // 当前工具分类的子分类
  const currentSubcategories = toolCategory ? getSubcategories(toolCategory) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ====== Hero ====== */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 md:py-20">
        <div className={`container mx-auto px-4 text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">预约在线课程</h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            专业形象课程 + 搭配任务 + 美学工具
          </p>
        </div>
      </section>

      {/* ====== Hub 入口 + 最新活动 ====== */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          {/* 4 入口 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Link href="/courses/special-camp" className="group bg-[#faf8f6] hover:bg-[#f5f3f0] rounded-2xl p-5 transition border border-[#eee5df] hover:border-[#C9A24B]/40">
              <CalendarDays className="w-8 h-8 text-[#C9A24B] mb-3" />
              <h3 className="font-bold text-[#2d1b2e]">课程预约</h3>
              <p className="text-xs text-gray-500 mt-1">AI赋能·服装精英销售特训营</p>
            </Link>
            <Link href="/wardrobe/styling-request" className="group bg-[#faf8f6] hover:bg-[#f5f3f0] rounded-2xl p-5 transition border border-[#eee5df] hover:border-[#C9A24B]/40">
              <PenTool className="w-8 h-8 text-[#C9A24B] mb-3" />
              <h3 className="font-bold text-[#2d1b2e]">搭配任务</h3>
              <p className="text-xs text-gray-500 mt-1">发布你的搭配需求</p>
            </Link>
            <Link href="/exercises" className="group bg-[#faf8f6] hover:bg-[#f5f3f0] rounded-2xl p-5 transition border border-[#eee5df] hover:border-[#C9A24B]/40">
              <BookOpen className="w-8 h-8 text-[#C9A24B] mb-3" />
              <h3 className="font-bold text-[#2d1b2e]">试题练习</h3>
              <p className="text-xs text-gray-500 mt-1">巩固形象专业知识</p>
            </Link>
            <Link href="/color-practice" className="group bg-[#faf8f6] hover:bg-[#f5f3f0] rounded-2xl p-5 transition border border-[#eee5df] hover:border-[#C9A24B]/40">
              <Droplet className="w-8 h-8 text-[#C9A24B] mb-3" />
              <h3 className="font-bold text-[#2d1b2e]">配色练习</h3>
              <p className="text-xs text-gray-500 mt-1">提升色彩搭配能力</p>
            </Link>
            <Link href="/courses/booking" className="group bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white hover:opacity-95 rounded-2xl p-5 transition border border-[#2d1b2e]">
              <CalendarDays className="w-8 h-8 text-[#C9A24B] mb-3" />
              <h3 className="font-bold">形象管理预约</h3>
              <p className="text-xs text-white/80 mt-1">一对一形象诊断</p>
            </Link>
          </div>

          {/* 最新活动 */}
          <h3 className="font-bold text-[#2d1b2e] mb-3 text-sm">最新活动</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/style-test" className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#e91e63] to-[#c2185b] text-white">
              <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-white/20">免费</span>
              <Zap className="w-8 h-8 mb-3" />
              <h4 className="font-bold">智能形象诊断</h4>
              <p className="text-xs text-white/80 mt-1">AI+专业搭配师双重诊断</p>
            </Link>
            <button
              onClick={() => setActiveTab("tools")}
              className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#4caf50] to-[#2e7d32] text-white text-left"
            >
              <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-white/20">工具</span>
              <Wrench className="w-8 h-8 mb-3" />
              <h4 className="font-bold">解锁美学工具</h4>
              <p className="text-xs text-white/80 mt-1">色彩卡/风格尺一站购齐</p>
            </button>
            <Link href="/courses/special-camp" className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-[#2d1b2e] to-[#4a3a5a] text-white">
              <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-white/20">特训营</span>
              <Star className="w-8 h-8 mb-3" />
              <h4 className="font-bold">美学搭配精英特训营</h4>
              <p className="text-xs text-white/80 mt-1">AI赋能·服装精英销售特训营</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ====== Tab 切换 ====== */}
      <section className="bg-white border-b border-gray-100 sticky top-[57px] z-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-3">
            <button
              onClick={() => setActiveTab("courses")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === "courses"
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <BookOpen className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              线上课程
            </button>
            <button
              onClick={() => setActiveTab("tools")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === "tools"
                  ? "bg-accent text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ShoppingBag className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              工具商城
            </button>
          </div>
        </div>
      </section>

      {/* ====== 线上课程 Tab ====== */}
      <AnimatePresence mode="wait">
        {activeTab === "courses" && (
          <motion.div
            key="courses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* 课程筛选 */}
            <section className="py-4 bg-white border-b border-gray-100">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">全部分类</option>
                    {Object.entries(courseCategoryMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <select
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                    className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">全部难度</option>
                    {Object.entries(levelMap).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
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

            {/* 课程网格 */}
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
                                  {courseCategoryMap[course.category] || course.category}
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
          </motion.div>
        )}

        {/* ====== 工具商城 Tab ====== */}
        {activeTab === "tools" && (
          <motion.div
            key="tools"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* 三大品类入口卡 */}
            <section className="py-8">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {TOOL_CATEGORIES.map((cat, i) => (
                    <motion.button
                      key={cat.value}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => {
                        setToolCategory(toolCategory === cat.value ? "" : cat.value);
                        setToolSubcategory("");
                      }}
                      className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 border-2 ${
                        toolCategory === cat.value
                          ? "border-accent shadow-lg scale-[1.02]"
                          : "border-gray-100 hover:border-accent/30 hover:shadow-md"
                      }`}
                    >
                      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${cat.color} opacity-10 -translate-y-1/3 translate-x-1/3`} />
                      <cat.icon className={`w-8 h-8 mb-3 ${toolCategory === cat.value ? "text-accent" : "text-primary"}`} />
                      <h3 className="text-lg font-bold text-primary">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {productCounts[cat.value] || 0} 件商品
                      </p>
                      {toolCategory === cat.value && (
                        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-accent text-white font-medium">
                          已选
                        </span>
                      )}
                    </motion.button>
                  ))}
                </div>
              </div>
            </section>

            {/* 工具商品筛选栏 */}
            <section className="bg-white border-b border-gray-100 py-3">
              <div className="container mx-auto px-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* 搜索 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={toolSearch}
                      onChange={(e) => setToolSearch(e.target.value)}
                      placeholder="搜索工具商品..."
                      className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-48"
                    />
                    {toolSearch && (
                      <button onClick={() => setToolSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {/* 子分类筛选 */}
                  {currentSubcategories.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">子分类：</span>
                      <button
                        onClick={() => setToolSubcategory("")}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          !toolSubcategory ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        全部
                      </button>
                      {currentSubcategories.map((sub) => (
                        <button
                          key={sub.key}
                          onClick={() => setToolSubcategory(toolSubcategory === sub.key ? "" : sub.key)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            toolSubcategory === sub.key ? "bg-accent text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 清除 */}
                  {(toolCategory || toolSubcategory || toolSearch) && (
                    <button
                      onClick={() => { setToolCategory(""); setToolSubcategory(""); setToolSearch(""); }}
                      className="text-xs text-accent hover:underline"
                    >
                      清除筛选
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* 工具商品网格 */}
            <section className="py-8 md:py-12">
              <div className="container mx-auto px-4">
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {(toolCategory || toolSubcategory || toolSearch) ? "没有匹配的商品，试试调整筛选条件" : "暂无工具商品，敬请期待"}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* 筛选提示 */}
                    {(toolCategory || toolSubcategory || toolSearch) && (
                      <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
                        <span>找到 {filteredProducts.length} 件商品</span>
                        {toolCategory && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {CATEGORY_MAP[toolCategory] || toolCategory}
                          </span>
                        )}
                        {toolSubcategory && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                            {SUBCATEGORY_MAP[toolSubcategory] || toolSubcategory}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredProducts.map((product, i) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.08, 0.4) }}
                        >
                          <Link
                            href={`/shop/${product.id}`}
                            className="group block bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-transparent hover:border-accent/30"
                          >
                            <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center overflow-hidden relative">
                              {product.cover_image ? (
                                <img src={product.cover_image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <ShoppingBag className="w-10 h-10 text-primary/30" />
                              )}
                              {product.category && (
                                <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-white/90 text-primary font-medium shadow-sm">
                                  {CATEGORY_MAP[product.category] || product.category}
                                </span>
                              )}
                            </div>
                            <div className="p-4">
                              {product.subcategory && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">
                                  {SUBCATEGORY_MAP[product.subcategory] || product.subcategory}
                                </span>
                              )}
                              <h3 className="font-bold text-primary group-hover:text-accent transition-colors mt-1.5 line-clamp-2 text-sm">
                                {product.title}
                              </h3>
                              {product.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {product.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-bold text-accent">
                                    ¥{(product.price / 100).toFixed(0)}
                                  </span>
                                  {product.original_price && product.original_price > product.price && (
                                    <span className="text-xs text-gray-400 line-through">
                                      ¥{(product.original_price / 100).toFixed(0)}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary hover:text-white transition-colors">
                                  购买
                                </span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== 底部引导 ====== */}
      <section className="py-12 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-lg font-bold text-primary">还在等什么？</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            专业课程 + 工具商城，一站式解决你的色彩形象需求
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => setActiveTab("courses")}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              浏览课程
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveTab("tools")}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              浏览工具
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

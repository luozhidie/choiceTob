"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search, ArrowRight, Star, Shirt, Scissors, Sparkles, Gem, Footprints, ShoppingCart,
  Droplets, PenTool, Palette, Sun,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  所有分类统一跳转 /buyer（/shop 无列表页会404）                    */
/* ------------------------------------------------------------------ */

const categories = [
  { name: "全部", href: "/", key: "all" },
  { name: "穿搭", href: "/buyer?category=穿搭", key: "clothing" },
  { name: "护肤", href: "/buyer?category=护肤", key: "skincare" },
  { name: "彩妆", href: "/buyer?category=彩妆", key: "makeup" },
  { name: "养生", href: "/buyer?category=养生", key: "wellness" },
  { name: "食品", href: "/buyer?category=食品", key: "food" },
  { name: "家居", href: "/buyer?category=家居", key: "home" },
  { name: "文创", href: "/buyer?category=文创", key: "creative" },
  { name: "艺术", href: "/buyer?category=艺术", key: "art" },
];

/* ------------------------------------------------------------------ */
/*  子分类（全部跳 /buyer）                                            */
/* ------------------------------------------------------------------ */

const subCategoryMap: Record<string, { name: string; icon: React.ReactNode; subKey: string }[]> = {
  "全部": [
    { name: "精选", icon: <Star className="w-4 h-4" />, subKey: "" },
  ],
  "穿搭": [
    { name: "上装", icon: <Shirt className="w-4 h-4" />, subKey: "上装" },
    { name: "下装", icon: <Scissors className="w-4 h-4" />, subKey: "下装" },
    { name: "连衣裙", icon: "👗", subKey: "连衣裙" },
    { name: "外套", icon: "🧥", subKey: "外套" },
    { name: "配饰", icon: <Gem className="w-4 h-4" />, subKey: "配饰" },
    { name: "鞋履", icon: <Footprints className="w-4 h-4" />, subKey: "鞋履" },
  ],
  "护肤": [
    { name: "洁面", icon: <Droplets className="w-4 h-4" />, subKey: "洁面" },
    { name: "精华", icon: "💧", subKey: "精华" },
    { name: "面霜", icon: "🧴", subKey: "面霜" },
    { name: "防晒", icon: <Sun className="w-4 h-4" />, subKey: "防晒" },
    { name: "面膜", icon: "😊", subKey: "面膜" },
  ],
  "彩妆": [
    { name: "底妆", icon: "💄", subKey: "底妆" },
    { name: "眼妆", icon: "👁️", subKey: "眼妆" },
    { name: "唇妆", icon: "💋", subKey: "唇妆" },
    { name: "腮红", icon: "🌸", subKey: "腮红" },
    { name: "工具", icon: "🖌️", subKey: "工具" },
  ],
  "养生": [
    { name: "补品", icon: "💊", subKey: "补品" },
    { name: "茶饮", icon: "🍵", subKey: "茶饮" },
    { name: "器械", icon: "🏋️", subKey: "器械" },
  ],
  "食品": [
    { name: "零食", icon: "🍪", subKey: "零食" },
    { name: "饮品", icon: "☕", subKey: "饮品" },
    { name: "食材", icon: "🥬", subKey: "食材" },
  ],
  "家居": [
    { name: "厨具", icon: "🍳", subKey: "厨具" },
    { name: "收纳", icon: "📦", subKey: "收纳" },
    { name: "装饰", icon: "🎨", subKey: "装饰" },
  ],
  "文创": [
    { name: "文具", icon: <PenTool className="w-4 h-4" />, subKey: "文具" },
    { name: "手账", icon: "📒", subKey: "手账" },
    { name: "礼品", icon: "🎁", subKey: "礼品" },
  ],
  "艺术": [
    { name: "画作", icon: <Palette className="w-4 h-4" />, subKey: "画作" },
    { name: "雕塑", icon: "🗿", subKey: "雕塑" },
    { name: "工艺品", icon: "🏺", subKey: "工艺品" },
  ],
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [activeCategoryName, setActiveCategoryName] = useState("全部");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // 当前子分类列表
  const currentSubCategories = subCategoryMap[activeCategoryName] || subCategoryMap["全部"];

  // 加载商品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("products")
          .select("id, name, price, image_url, category, sub_category");
        const { data, error } = await query.limit(20);
        if (!error && data) setProducts(data);
      } catch (err) {
        console.error("加载商品失败:", err);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      window.location.href = `/buyer?keyword=${encodeURIComponent(keyword.trim())}`;
    }
  };

  // 生成子分类链接（统一走 /buyer）
  const getSubHref = (subKey: string) => {
    if (!subKey) return "/";
    return `/buyer?category=${encodeURIComponent(activeCategoryName)}&subCategory=${encodeURIComponent(subKey)}`;
  };

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      {/* ====== Hero 区域（深色背景 + 靠左文字 + 搜索框） ====== */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2a2342 0%, #383258 35%, #453f65 65%, #524d72 100%)",
        }}
      >
        {/* 背景装饰光晕 */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-pink-500/[0.04] -translate-y-1/3 translate-x-1/4 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-500/[0.05] translate-y-1/3 -translate-x-1/4 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-14 sm:py-16 lg:py-20">
          {/* 数据驱动标签 */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/12 bg-white/[0.06] backdrop-blur-md mb-7 text-[11px] text-white/60 font-medium tracking-widest uppercase">
            <span className="text-pink-300">✦</span> 数据驱动 · 智选未来
          </div>

          {/* 主标题 —— 靠左 */}
          <h1 className="text-[36px] sm:text-[44px] lg:text-[56px] font-black text-white leading-[1.08] mb-5 tracking-tight" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
            骆芷蝶<span className="bg-gradient-to-r from-pink-300 via-rose-300 to-orange-200 bg-clip-text text-transparent">全品类</span>智选平台
          </h1>

          {/* 描述 —— 靠左 */}
          <p className="text-sm sm:text-base text-white/40 max-w-xl mb-10 leading-relaxed tracking-wide" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            从选品企划到营销落地，以数据智能驱动品类行业全链路高效运营，
            <br className="hidden sm:block" />
            助力品牌精准选品、科学决策。
          </p>

          {/* 搜索框 + 浏览选品按钮 —— 靠左 */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/25 group-focus-within:text-white/50 transition-colors" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品名称、描述..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/[0.07] border border-white/[0.08] text-white placeholder:text-white/28 focus:outline-none focus:bg-white/[0.11] focus:border-white/[0.18] text-[14px] transition-all"
              />
            </div>
            <Link
              href="/buyer"
              className="px-7 py-3.5 bg-white text-[#2a2342] text-sm font-bold rounded-2xl hover:bg-gray-100 transition-all whitespace-nowrap flex items-center gap-2 shrink-0 shadow-lg shadow-black/10"
            >
              浏览选品 <ArrowRight className="w-4 h-4" />
            </Link>
          </form>
        </div>
      </section>

      {/* ====== 分类标签栏（暖橙渐变） ====== */}
      <section className="bg-gradient-to-r from-orange-200/95 via-amber-100 to-orange-200/90 border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-3.5 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                onClick={() => setActiveCategoryName(cat.name)}
                className={`px-4.5 py-2 rounded-full text-[13.5px] whitespace-nowrap transition-all ${
                  activeCategoryName === cat.name
                    ? "bg-white shadow-md text-gray-800 font-semibold scale-105 origin-center"
                    : "text-gray-600 hover:bg-white/60 hover:text-gray-700"
                }`}
                style={{ transition: "all 0.2s ease" }}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 动态子分类标签栏 ====== */}
      <section className="bg-white/80 backdrop-blur-sm border-b border-gray-100/60 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2.5 py-3.5 overflow-x-auto scrollbar-hide">
            {currentSubCategories.map((sub) => (
              <Link
                key={sub.name}
                href={getSubHref(sub.subKey)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] whitespace-nowrap transition-all border ${
                  sub.name === "精选"
                    ? "bg-gradient-to-br from-[#2a2342] to-[#3d3659] text-white border-transparent shadow-lg shadow-black/8 font-semibold"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm"
                }`}
              >
                {typeof sub.icon === "string" ? <span className="text-[15px]">{sub.icon}</span> : sub.icon}
                <span>{sub.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Hero 大图区域（高质量暖色衣架背景） ====== */}
      <section className="relative h-[380px] sm:h-[440px] lg:h-[480px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1800&q=85&auto=format')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/55"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4 pt-8">
          <h2 className="text-[26px] sm:text-[32px] lg:text-[40px] font-bold mb-2 tracking-wide drop-shadow-[0_2px_20px_rgba(0,0,0,0.3)]" style={{ letterSpacing: "0.03em" }}>
            骆芷蝶智选 · 好物推荐
          </h2>
          <p className="text-sm sm:text-base text-white/80 mb-9 tracking-[0.25em] font-light">
            不自用 · 不分享
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5">
            <Link
              href="/buyer"
              className="px-10 py-3.5 bg-white text-[#333] font-bold rounded-xl hover:bg-gray-50 transition-all text-[14px] shadow-xl shadow-black/10 hover:-translate-y-0.5"
              style={{ transition: "transform 0.2s, box-shadow 0.2s" }}
            >
              全部商品
            </Link>
            <Link
              href="/buyer"
              className="px-10 py-3.5 bg-white/10 backdrop-blur-md border-2 border-white/50 text-white font-bold rounded-xl hover:bg-white/20 hover:border-white/70 transition-all text-[14px] flex items-center justify-center gap-2 hover:-translate-y-0.5"
              style={{ transition: "transform 0.2s, background 0.2s, border-color 0.2s" }}
            >
              爆款安利 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== 商品列表区 ====== */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-lg font-bold text-gray-900 tracking-wide">
            {activeCategoryName === "全部" ? "穿搭" : activeCategoryName} · 精选
            <span className="ml-2 text-xs font-normal text-gray-400">({products.length} 件)</span>
          </h2>
          <button
            onClick={() => {
              setActiveCategoryName("全部");
            }}
            className="text-xs text-gray-350 hover:text-gray-500 transition-colors"
          >
            ✕ 清除筛选
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 rounded-2xl aspect-[3/4] mb-2.5"></div>
                <div className="bg-gray-100 h-3.5 rounded-lg w-3/4 mb-1.5"></div>
                <div className="bg-gray-100 h-3.5 rounded-lg w-2/5"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-300 text-base">暂无选品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-gray-50 mb-2.5 aspect-[3/4] ring-1 ring-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      暂无图片
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-gray-800 group-hover:text-rose-500 transition-colors leading-snug text-[13px] line-clamp-2">
                  {product.name}
                </h4>
                <p className="text-rose-500 font-bold mt-1.5 text-[15px]">¥{product.price}</p>
                <Link
                  href={`/shop/${product.id}`}
                  className="mt-2.5 block w-full py-2 text-center bg-gradient-to-r from-rose-400 via-pink-500 to-red-500 text-white text-[12px] font-semibold rounded-lg hover:shadow-lg hover:shadow-rose-500/25 transition-all active:scale-[0.98]"
                >
                  下单
                </Link>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ====== 底部 CTA ====== */}
      <section className="mt-8 bg-gradient-to-b from-orange-50/80 via-amber-50/60 to-white py-16 px-4 border-t border-gray-100">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-5 inline-flex justify-center w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl items-center">
            <Sparkles className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-900 mb-2.5 tracking-wide">立即拿货，享受批发价</h3>
          <p className="text-gray-400 text-sm leading-relaxed">开通查看价格会员，满3件起享批发底价</p>
          <div className="mt-5 w-20 h-[3px] bg-gradient-to-r from-orange-300 to-amber-200 mx-auto rounded-full"></div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Search, ArrowRight, Star, Shirt, Scissors, Sparkles, Gem, Footprints, ShoppingCart } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  分类导航（点击跳转到对应页面）                                      */
/* ------------------------------------------------------------------ */

const categories = [
  { name: "全部", href: "/" },
  { name: "穿搭", href: "/buyer" },
  { name: "护肤", href: "/buyer?category=护肤" },
  { name: "洗护", href: "/buyer?category=洗护" },
  { name: "养生", href: "/buyer?category=养生" },
  { name: "食品", href: "/buyer?category=食品" },
  { name: "家居", href: "/buyer?category=家居" },
  { name: "文创", href: "/buyer?category=文创" },
  { name: "艺术", href: "/buyer?category=艺术" },
];

const subCategories = [
  { name: "精选", icon: <Star className="w-4 h-4" />, active: true },
  { name: "上装", icon: <Shirt className="w-4 h-4" /> },
  { name: "下装", icon: <Scissors className="w-4 h-4" /> },
  { name: "连衣裙", icon: "👗" },
  { name: "外套", icon: "🧥" },
  { name: "配饰", icon: <Gem className="w-4 h-4" /> },
  { name: "鞋履", icon: <Footprints className="w-4 h-4" /> },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [activeCategory, setActiveCategory] = useState("全部");
  const [activeSubCategory, setActiveSubCategory] = useState("精选");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // 加载商品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("id, name, price, image_url, category, sub_category");
      if (activeSubCategory !== "精选") {
        query = query.eq("sub_category", activeSubCategory);
      }
      const { data, error } = await query.limit(20);
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [activeSubCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      window.location.href = `/shop?keyword=${encodeURIComponent(keyword.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ====== Hero 区域（深色背景 + 搜索框） ====== */}
      <section className="bg-gradient-to-br from-[#3d3a52] to-[#4a4663] py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* 数据驱动标签 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 mb-5 text-xs text-white/80 font-medium tracking-wide">
            ✨ 数据驱动 · 智选未来
          </div>

          {/* 主标题 */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-white leading-tight mb-3 tracking-tight">
            服装供应链<span className="text-accent">智选</span>平台
          </h1>

          {/* 描述 */}
          <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto mb-7 leading-relaxed">
            从选品企划到营销落地，以数据智能驱动服装行业全链路高效运营，助力品牌精准选品、科学决策。
          </p>

          {/* 搜索框 + 浏览选品按钮 */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品名称、描述..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/18 text-sm"
              />
            </div>
            <Link
              href="/buyer"
              className="px-5 py-3 bg-white text-[#3d3a3e] font-semibold rounded-xl hover:bg-gray-100 transition-all whitespace-nowrap text-sm flex items-center gap-1.5"
            >
              浏览选品
              <ArrowRight className="w-4 h-4" />
            </Link>
          </form>
        </div>
      </section>

      {/* ====== 分类标签栏（橙棕色渐变） ====== */}
      <section className="bg-gradient-to-r from-orange-300 via-amber-200 to-orange-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeCategory === cat.name
                    ? "bg-white shadow-md font-semibold text-gray-800"
                    : "hover:bg-white/60 text-gray-700"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 精选标签栏 ====== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {subCategories.map((sub) => (
              <button
                key={sub.name}
                onClick={() => setActiveSubCategory(sub.name)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeSubCategory === sub.name
                    ? "bg-[#2d2a3e] text-white font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {sub.icon} {sub.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Hero 大图区域 ====== */}
      <section className="relative h-[420px] sm:h-[480px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop')`,
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-wide">
            骆芷蝶智选 · 好物推荐
          </h2>
          <p className="text-base sm:text-lg text-white/80 mb-8 tracking-widest">
            不自用 · 不分享
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/shop"
              className="px-9 py-3 bg-white text-[#2d2a3e] font-bold rounded-lg hover:bg-gray-100 transition-all text-base"
            >
              全部商品
            </Link>
            <Link
              href="/buyer"
              className="px-9 py-3 bg-transparent border-2 border-white/60 text-white font-bold rounded-lg hover:bg-white/10 hover:border-white transition-all text-base flex items-center justify-center gap-2"
            >
              爆款安利
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== 商品列表区 ====== */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {activeCategory} · {activeSubCategory}
            <span className="ml-2 text-sm font-normal text-gray-400">({products.length} 件)</span>
          </h2>
          <button
            onClick={() => { setActiveSubCategory("精选"); setProducts([]); }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ✕ 清除筛选
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl aspect-[3/4] mb-3"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">暂无选品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-gray-100 mb-3 aspect-[3/4]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      暂无图片
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 group-hover:text-accent transition-colors leading-snug text-sm">
                  {product.name}
                </h4>
                <p className="text-red-500 font-bold mt-1 text-base">¥{product.price}</p>
                <Link
                  href={`/shop/${product.id}`}
                  className="mt-2 block w-full py-2 text-center bg-gradient-to-r from-pink-500 to-red-500 text-white text-sm font-semibold rounded-lg hover:shadow-md transition-all"
                >
                  下单
                </Link>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ====== 底部 CTA ====== */}
      <section className="mt-8 bg-gradient-to-b from-[#fef9f0] to-[#fdf5e6] py-14 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-orange-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">立即拿货，享受批发价</h3>
          <p className="text-gray-500 text-sm mb-4">开通查看价格会员，满3件起享批发底价</p>
          <div className="mt-3 w-28 h-1 bg-gray-800 mx-auto rounded-full"></div>
        </div>
      </section>
    </div>
  );
}

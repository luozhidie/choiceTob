"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search, ArrowRight, Star, Shirt, Scissors, Sparkles, Gem, Footprints, ShoppingCart, Flame, Heart,
} from "lucide-react";
import AdBanner, { PopupAd } from "@/components/AdBanner";

/* ------------------------------------------------------------------ */
/*  分类导航（顶部）                                                   */
/* ------------------------------------------------------------------ */
const topNav = [
  { label: "穿搭", href: "/buyer?category=穿搭" },
  { label: "护肤", href: "/buyer?category=护肤" },
  { label: "洗护", href: "/buyer?category=洗护" },
  { label: "养生", href: "/buyer?category=养生" },
  { label: "食品", href: "/buyer?category=食品" },
  { label: "家居", href: "/buyer?category=家居" },
  { label: "文创", href: "/buyer?category=文创" },
  { label: "艺术", href: "/buyer?category=艺术" },
];

/* ------------------------------------------------------------------ */
/*  子分类标签（Hero 下方）                                         */
/* ------------------------------------------------------------------ */
const subTags = [
  { name: "精选", icon: <Star className="w-4 h-4" /> },
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
  const [activeTag, setActiveTag] = useState("精选");
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
      if (activeTag !== "精选") {
        query = query.eq("sub_category", activeTag);
      }
      const { data, error } = await query.limit(20);
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, [activeTag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      window.location.href = `/shop?keyword=${encodeURIComponent(keyword.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ===== 顶部导航 ===== */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#2d2a3e] flex items-center justify-center text-white font-bold text-lg">
              骆
            </div>
            <div>
              <div className="font-bold text-[#2d2a3e] text-lg leading-tight">骆芷蝶智选</div>
              <div className="text-xs text-gray-400 tracking-widest">CHOICETOB</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            {topNav.map((nav) => (
              <Link key={nav.label} href={nav.href} className="text-gray-600 hover:text-gray-900 transition-colors">
                {nav.label}
              </Link>
            ))}
          </nav>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== Hero 上方搜索区（深色背景） ===== */}
      <section className="bg-gradient-to-br from-[#3d3a52] to-[#4a4663] py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 mb-6 text-[13px] text-white/80 font-medium tracking-wide">
            ✨ 数据驱动 · 智选未来
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] mb-4 tracking-tight">
            骆芷蝶智选
            <br className="sm:hidden" />
            <span className="text-accent">· 好物推荐</span>
          </h2>

          <p className="text-base sm:text-lg text-white/70 mb-8">不自用 · 不分享</p>

          {/* 搜索框 + 浏览选品按钮 */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品名称、描述..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all text-sm"
              />
            </div>
            <Link
              href="/buyer"
              className="px-6 py-3.5 bg-white text-[#3d3a52] font-semibold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 whitespace-nowrap text-sm"
            >
              浏览选品
              <ArrowRight className="w-4 h-4" />
            </Link>
          </form>
        </div>
      </section>

      {/* ===== 子分类标签栏（浅灰背景） ===== */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {subTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => setActiveTag(tag.name)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeTag === tag.name
                    ? "bg-[#2d2a3e] text-white font-medium shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-200"
                }`}
              >
                {typeof tag.icon === "string" ? <span className="text-base">{tag.icon}</span> : tag.icon}
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 爆款安利 + 全部商品 按钮区 ===== */}
      <section className="bg-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/buyer"
            className="px-10 py-3.5 bg-[#2d2a3e] text-white font-bold rounded-lg hover:bg-[#1a1a2e] transition-all text-base flex items-center justify-center gap-2"
          >
            <Flame className="w-5 h-5" />
            爆款安利
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/shop"
            className="px-10 py-3.5 bg-white text-[#2d2a3e] font-bold rounded-lg border-2 border-[#2d2a3e] hover:bg-gray-50 transition-all text-base"
          >
            <ShoppingCart className="w-5 h-5 inline mr-2" />
            全部商品
          </Link>
        </div>
      </section>

      {/* ===== 商品列表 ===== */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            穿搭 · {activeTag}
            <span className="ml-2 text-sm font-normal text-gray-400">（{products.length} 件）</span>
          </h3>
          <button
            onClick={() => { setActiveTag("精选"); setProducts([]); }}
            className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            ✕ 清除筛选
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-2xl h-64 mb-3"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">暂无选品</p>
            <p className="text-gray-400 text-sm mt-2">换个筛选条件试试吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-gray-100 mb-3 aspect-[3/4]">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
                  )}
                  <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Heart className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                <h4 className="font-medium text-gray-900 group-hover:text-accent transition-colors leading-snug text-sm">
                  {product.name}
                </h4>
                <p className="text-accent font-bold mt-1">¥{product.price}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== 底部 CTA ===== */}
      <section className="mt-12 bg-gradient-to-b from-[#fef9f0] to-[#fdf5e6] py-14 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">立即拿货，享受批发价</h3>
          <p className="text-gray-500">开通查看价格会员，满3件起享批发底价</p>
          <div className="mt-4 w-32 h-1 bg-gray-900 mx-auto rounded-full"></div>
        </div>
      </section>

      <AdBanner />
      <PopupAd />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search, ArrowRight, Star, Shirt, Scissors, Flame, Gem, Footprints, ShoppingCart,
  Sparkles, Heart, X,
} from "lucide-react";
import AdBanner, { PopupAd } from "@/components/AdBanner";

/* ------------------------------------------------------------------ */
/*  顶部分类导航（跳转 /buyer）                                        */
/* ------------------------------------------------------------------ */

const topCategories = [
  { label: "穿搭", href: "/buyer?category=穿搭" },
  { label: "护肤", href: "/buyer?category=护肤" },
  { label: "洗护", href: "/buyer?category=洗护" },
  { label: "养生", href: "/buyer?category=养生" },
  { label: "食品", href: "/buyer?category=食品" },
  { label: "家居", href: "/buyer?category=家居" },
  { label: "文创", href: "/buyer?category=文创" },
  { label: "艺术", href: "/buyer?category=艺术" },
];

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
  const [showPromo, setShowPromo] = useState(false);
  const supabase = createClient();

  // 加载商品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from("products").select("id,name,price,image_url,category,sub_category");
      if (activeTag !== "精选") query = query.eq("sub_category", activeTag);
      const { data, error } = await query.limit(20);
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
    // 延迟显示促销弹窗
    const timer = setTimeout(() => setShowPromo(true), 2000);
    return () => clearTimeout(timer);
  }, [activeTag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) window.location.href = `/shop?keyword=${encodeURIComponent(keyword.trim())}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ===== 顶部导航条 ===== */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#2d2a3e] flex items-center justify-center text-white font-bold text-lg">
              骆
            </div>
            <div>
              <div className="font-bold text-[#2d2a3e] text-lg leading-tight">骆芷蝶智选</div>
              <div className="text-xs text-gray-400 tracking-widest">CHOICETOB</div>
            </div>
          </Link>

          {/* 分类导航（桌面端） */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {topCategories.map((cat) => (
              <Link key={cat.label} href={cat.href} className="text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
                {cat.label}
              </Link>
            ))}
          </nav>

          {/* 移动端菜单按钮 */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ===== Hero 搜索区（深紫色背景） ===== */}
      <section className="bg-gradient-to-br from-[#38354a] via-[#44415c] to-[#4d3e5c] py-11 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm mb-6 text-[12px] text-white/80 font-medium tracking-wide">
            ✨ 数据驱动 · 智选未来
          </div>

          <h1 className="text-[34px] sm:text-[40px] lg:text-[48px] font-black text-white leading-tight tracking-tight mb-3">
            骆芷蝶智选
            <span className="text-[#ff6b9d]">· 好物推荐</span>
          </h1>

          <p className="text-[15px] sm:text-base text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
            不自用 · 不分享
          </p>

          <form onSubmit={handleSearch} className="flex gap-2.5 max-w-[520px] mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/35" />
              <input
                type="text" value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品名称、描述..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder:text-white/40 focus:bg-white/20 focus:border-white/50 focus:outline-none text-[14px]"
              />
            </div>
            <Link href="/buyer" className="px-6 py-3 bg-white text-[#38354a] font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 whitespace-nowrap text-[14px]">
              浏览选品 <ArrowRight className="w-4 h-4" />
            </Link>
          </form>
        </div>
      </section>

      {/* ===== 分类标签栏（橙棕色渐变背景） ===== */}
      <section className="bg-gradient-to-r from-orange-300/90 via-orange-200 to-orange-300/80">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-0.5 py-3 overflow-x-auto scrollbar-hide">
            <span className="text-[13px] font-bold text-white/60 mr-1 shrink-0">📌</span>
            {topCategories.map((cat) => (
              <Link key={cat.label} href={cat.href}
                className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                  cat.label === "穿搭" ? "bg-white shadow-sm text-[#38354a]" : "text-white/85 hover:bg-white/30"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Hero 大图区（服装陈列背景图 + 标题 + 按钮） ===== */}
      <section className="relative h-[420px] sm:h-[480px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80)' }} />
        <div className="absolute inset-0 bg-black/45"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-black tracking-tight">
            骆芷蝶智选 · 好物推荐
          </h2>
          <p className="mt-2 text-base text-white/80 tracking-widest">不自用 · 不分享</p>

          <div className="flex flex-col sm:flex-row gap-3 mt-7">
            <Link href="/shop" className="px-10 py-3 bg-white text-[#2d2a3e] font-bold rounded-lg hover:bg-gray-100 transition-all text-[15px]">
              全部商品
            </Link>
            <Link href="/buyer" className="px-10 py-3 bg-transparent border-2 border-white/50 text-white font-bold rounded-lg hover:bg-white/15 hover:border-white transition-all flex items-center justify-center gap-2 text-[15px]">
              爆款安利 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 子分类标签栏 ===== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {subTags.map((tag) => (
              <button key={tag.name} onClick={() => setActiveTag(tag.name)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                  activeTag === tag.name ? "bg-[#2d2a3e] text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {typeof tag.icon === "string" ? <span>{tag.icon}</span> : tag.icon}{tag.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 商品列表区 ===== */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[18px] font-bold text-[#222]">
            穿搭 · {activeTag} <span className="ml-1.5 text-sm font-normal text-[#aaa]">({products.length} 件)</span>
          </h3>
          <button onClick={() => { setActiveTag("精选"); setProducts([]); }} className="text-sm text-[#bbb] hover:text-[#666] flex items-center gap-1">
            ✕ 清除筛选
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse"><div className="bg-gray-200 rounded-2xl aspect-[3/4] mb-3" /><div className="bg-gray-200 h-4 rounded w-3/4 mb-2" /><div className="bg-gray-200 h-4 rounded w-1/2" /></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center text-[#ccc] text-[18px]">暂无选品</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map((p) => (
              <Link key={p.id} href={`/shop/${p.id}`} className="group block">
                <div className="relative overflow-hidden rounded-2xl bg-gray-100 mb-2.5 aspect-[3/4]">
                  {p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  <button className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Heart className="w-4 h-4 text-gray-500" /></button>
                </div>
                <h4 className="font-medium text-[#333] group-hover:text-accent transition-colors text-[13px] line-clamp-2 leading-snug">{p.name}</h4>
                <p className="text-accent font-bold text-[15px] mt-1">¥{p.price}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== 底部 CTA ===== */}
      <section className="mt-8 bg-gradient-to-b from-[#fff8ed] to-[#fef5e8] py-14 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-4 inline-flex justify-center"><Sparkles className="w-10 h-10 text-orange-400" /></div>
          <h3 className="text-[22px] font-extrabold text-[#111] mb-2">立即拿货，享受批发价</h3>
          <p className="text-[#888] text-[14px]">开通查看价格会员，满3件起享批发底价</p>
          <div className="mt-4 w-28 h-1 bg-[#111] mx-auto rounded-full" />
        </div>
      </section>

      <AdBanner />
      <PopupAd />

      {/* ===== 限时优惠弹窗 ===== */}
      {showPromo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPromo(false)}>
          <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPromo(false)} className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-4">🎁</div>
            <h3 className="text-xl font-bold text-[#ff4785] mb-2">限时优惠活动</h3>
            <p className="text-[#666] text-sm mb-6 leading-relaxed">新用户首单立减500元，附赠价值1000元买手选品诊断服务</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#ff4785] to-[#ff1748] text-white font-bold rounded-lg hover:shadow-lg transition-all text-[15px]">
              立即咨询 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

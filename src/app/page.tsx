"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Star, Shirt, Scissors, Sparkles, Gem, Footprints } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  分类和标签数据                                                      */
/* ------------------------------------------------------------------ */

const categories = [
  { name: "穿搭", icon: "👗" },
  { name: "护肤", icon: "🧴" },
  { name: "洗护", icon: "🧼" },
  { name: "养生", icon: "🍵" },
  { name: "食品", icon: "🍪" },
  { name: "家居", icon: "🏠" },
  { name: "文创", icon: "🎨" },
  { name: "艺术", icon: "🖼️" },
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
  const [activeCategory, setActiveCategory] = useState("穿搭");
  const [activeSubCategory, setActiveSubCategory] = useState("精选");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      window.location.href = `/shop?keyword=${encodeURIComponent(keyword.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ====== 顶部导航 ====== */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#2d2a3e] flex items-center justify-center text-white font-bold text-lg">
              骆
            </div>
            <div>
              <div className="font-bold text-[#2d2a3e] text-lg leading-tight">骆芷蝶智选</div>
              <div className="text-xs text-gray-400 tracking-wider">CHOICETOB</div>
            </div>
          </Link>

          {/* 右侧菜单按钮 */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ====== 搜索区（深色背景） ====== */}
      <section className="bg-gradient-to-br from-[#3d3a52] to-[#4a4663] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* 搜索框 + 浏览选品按钮 */}
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品名称、描述..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/25 transition-all"
              />
            </div>
            <Link
              href="/buyer"
              className="px-6 py-3.5 bg-white text-[#3d3a52] font-semibold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 whitespace-nowrap"
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
            <span className="text-lg mr-2">📌</span>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeCategory === cat.name
                    ? "bg-white shadow-md font-semibold"
                    : "hover:bg-white/60"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
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
        {/* 背景图 */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop')`,
          }}
        >
          {/* 暗色遮罩 */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* 渐变遮罩（底部更暗） */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30"></div>
        </div>

        {/* 内容居中 */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          {/* 主标题 */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 tracking-wide">
            骆芷蝶智选 · 好物推荐
          </h1>

          {/* 副标题 */}
          <p className="text-base sm:text-lg text-white/80 mb-8 tracking-widest">
            不自用 · 不分享
          </p>

          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/shop"
              className="px-8 py-3 bg-white text-[#2d2a3e] font-semibold rounded-lg hover:bg-gray-100 transition-all"
            >
              全部商品
            </Link>
            <Link
              href="/hot-picks"
              className="px-8 py-3 bg-transparent border-2 border-white/60 text-white font-semibold rounded-lg hover:bg-white/10 hover:border-white transition-all flex items-center justify-center gap-2"
            >
              爆款安利
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== 商品列表区 ====== */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {activeCategory} · {activeSubCategory}
            <span className="ml-2 text-sm font-normal text-gray-500">(0 件)</span>
          </h2>
          <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            ✕ 清除筛选
          </button>
        </div>

        {/* 空状态 */}
        <div className="py-20 text-center">
          <p className="text-gray-400 text-lg">暂无选品</p>
        </div>
      </section>

      {/* ====== 底部 CTA 区域 ====== */}
      <section className="mt-12 bg-gradient-to-b from-[#fef9f0] to-[#fdf5e6] py-14 px-4">
        <div className="max-w-md mx-auto text-center">
          {/* 图标 */}
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          {/* 主文字 */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            立即拿货，享受批发价
          </h3>

          {/* 副文字 */}
          <p className="text-gray-600">
            开通查看价格会员，满3件起享批发底价
          </p>

          {/* 下划线装饰 */}
          <div className="mt-4 w-32 h-1 bg-gray-900 mx-auto rounded"></div>
        </div>
      </section>
    </div>
  );
}

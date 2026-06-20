"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search, ArrowRight, Star, Shirt, Scissors, Sparkles, Gem, Footprints, ShoppingCart,
  Droplets, PenTool, Palette, Sun,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  主分类                                                            */
/*  全部 → 首页                                                      */
/*  穿搭 → /buyer（买手选品列表）                                     */
/*  其他 → /buyer?category=xxx（同一列表页，带分类筛选）               */
/* ------------------------------------------------------------------ */

const categories = [
  { name: "全部", href: "/", key: "all" },
  { name: "穿搭", href: "/buyer", key: "clothing" },
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
    { name: "精选", icon: <Star className="w-[15px] h-[15px]" />, subKey: "" },
  ],
  "穿搭": [
    { name: "上装", icon: <Shirt className="w-[15px] h-[15px]" />, subKey: "上装" },
    { name: "下装", icon: <Scissors className="w-[15px] h-[15px]" />, subKey: "下装" },
    { name: "连衣裙", icon: <span className="text-[15px]">👗</span>, subKey: "连衣裙" },
    { name: "外套", icon: <span className="text-[15px]">🧥</span>, subKey: "外套" },
    { name: "配饰", icon: <Gem className="w-[15px] h-[15px]" />, subKey: "配饰" },
    { name: "鞋履", icon: <Footprints className="w-[15px] h-[15px]" />, subKey: "鞋履" },
  ],
  "护肤": [
    { name: "洁面", icon: <Droplets className="w-[15px] h-[15px]" />, subKey: "洁面" },
    { name: "精华", icon: <span className="text-[15px]">💧</span>, subKey: "精华" },
    { name: "面霜", icon: <span className="text-[15px]">🧴</span>, subKey: "面霜" },
    { name: "防晒", icon: <Sun className="w-[15px] h-[15px]" />, subKey: "防晒" },
    { name: "面膜", icon: <span className="text-[15px]">😊</span>, subKey: "面膜" },
  ],
  "彩妆": [
    { name: "底妆", icon: <span className="text-[15px]">💄</span>, subKey: "底妆" },
    { name: "眼妆", icon: <span className="text-[15px]">👁️</span>, subKey: "眼妆" },
    { name: "唇妆", icon: <span className="text-[15px]">💋</span>, subKey: "唇妆" },
    { name: "腮红", icon: <span className="text-[15px]">🌸</span>, subKey: "腮红" },
    { name: "工具", icon: <span className="text-[15px]">🖌️</span>, subKey: "工具" },
  ],
  "养生": [
    { name: "补品", icon: <span className="text-[15px]">💊</span>, subKey: "补品" },
    { name: "茶饮", icon: <span className="text-[15px]">🍵</span>, subKey: "茶饮" },
    { name: "器械", icon: <span className="text-[15px]">🏋️</span>, subKey: "器械" },
  ],
  "食品": [
    { name: "零食", icon: <span className="text-[15px]">🍪</span>, subKey: "零食" },
    { name: "饮品", icon: <span className="text-[15px]">☕</span>, subKey: "饮品" },
    { name: "食材", icon: <span className="text-[15px]">🥬</span>, subKey: "食材" },
  ],
  "家居": [
    { name: "厨具", icon: <span className="text-[15px]">🍳</span>, subKey: "厨具" },
    { name: "收纳", icon: <span className="text-[15px]">📦</span>, subKey: "收纳" },
    { name: "装饰", icon: <span className="text-[15px]">🎨</span>, subKey: "装饰" },
  ],
  "文创": [
    { name: "文具", icon: <PenTool className="w-[15px] h-[15px]" />, subKey: "文具" },
    { name: "手账", icon: <span className="text-[15px]">📒</span>, subKey: "手账" },
    { name: "礼品", icon: <span className="text-[15px]">🎁</span>, subKey: "礼品" },
  ],
  "艺术": [
    { name: "画作", icon: <Palette className="w-[15px] h-[15px]" />, subKey: "画作" },
    { name: "雕塑", icon: <span className="text-[15px]">🗿</span>, subKey: "雕塑" },
    { name: "工艺品", icon: <span className="text-[15px]">🏺</span>, subKey: "工艺品" },
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

  const currentSubCategories = subCategoryMap[activeCategoryName] || subCategoryMap["全部"];

  // 加载商品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase.from("products").select("id, name, price, image_url, category, sub_category");
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

  return (
    <div className="min-h-screen bg-white">
      {/* ====== Hero 区域（深紫背景 + 左对齐文字） ====== */}
      <section style={{ background: "linear-gradient(135deg, #2f2845 0%, #3b3460 100%)" }} className="py-11 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* 标签 —— 按截图：小字，圆角胶囊，半透明 */}
          <div
            className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full mb-5"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)"
            }}
          >
            <span className="text-[#d8a0c0] text-[11px] tracking-wider">✦</span>
            <span className="text-white/60 text-[11px] font-medium tracking-widest">数据驱动 · 智选未来</span>
          </div>

          {/* 主标题 —— 按截图：大字号，左对齐 */}
          <h1
            className="font-black text-white leading-[1.12] mb-3 tracking-tight"
            style={{ fontSize: "clamp(30px, 5vw, 44px)" }}
          >
            服装供应链<span className="text-[#e89aac]">智选</span>平台
          </h1>

          {/* 描述 —— 按截图：较小字号，灰色，左对齐 */}
          <p
            className="text-white/40 mb-8 leading-relaxed"
            style={{ fontSize: "14px", maxWidth: "520px" }}
          >
            从选品企划到营销落地，以数据智能驱动服装行业全链路高效运营，助力品牌精准选品、科学决策。
          </p>

          {/* 搜索框 + 按钮 —— 按截图：圆角搜索框 + 白色按钮靠右 */}
          <form onSubmit={handleSearch} className="flex gap-3 max-w-lg">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品名称、描述..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.07] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:bg-white/12 text-sm"
                style={{ backdropFilter: "blur(10px)" }}
              />
            </div>
            <Link
              href="/buyer"
              className="px-6 py-3 bg-white text-[#2f2845] text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              浏览选品 <ArrowRight className="w-4 h-4" />
            </Link>
          </form>
        </div>
      </section>

      {/* ====== 分类标签栏（暖橙渐变背景） ====== */}
      <section className="bg-gradient-to-r from-orange-300 via-orange-200 to-orange-300 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 py-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                onClick={() => setActiveCategoryName(cat.name)}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                  activeCategoryName === cat.name
                    ? "bg-white shadow-sm font-semibold text-gray-800"
                    : "text-gray-600 hover:bg-white/55"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 子分类标签栏 ====== */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {currentSubCategories.map((sub) => (
              <Link
                key={sub.name}
                href={sub.subKey ? `/buyer?category=${encodeURIComponent(activeCategoryName)}&subCategory=${encodeURIComponent(sub.subKey)}` : "/"}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  sub.name === "精选"
                    ? "bg-[#2a2238] text-white font-medium shadow-md"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {sub.icon} {sub.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 大图区域（衣架背景 + 透明叠加 + 文字居中） ====== */}
      {/* 按截图：背景图清晰可见（衣架），上面叠加半透明遮罩+白色文字 */}
      <section className="relative h-[380px] sm:h-[430px] overflow-hidden">
        {/* 背景图 */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80&auto=format')",
          }}
        />
        {/* 半透明遮罩 —— 让背景隐约可见，同时保证文字清晰 */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.55) 100%)" }}></div>

        {/* 文字内容 —— 居中叠加在图片上 */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4 pt-6">
          <h2
            className="font-bold tracking-wide drop-shadow-md"
            style={{ fontSize: "clamp(24px, 4vw, 36px)" }}
          >
            骆芷蝶智选 · 好物推荐
          </h2>
          <p className="mt-1.5 mb-8 text-white/80 tracking-[0.2em] font-light" style={{ fontSize: "15px" }}>
            不自用 · 不分享
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/buyer"
              className="px-9 py-3 bg-white text-gray-800 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-lg"
            >
              全部商品
            </Link>
            <Link
              href="/buyer"
              className="px-9 py-3 bg-transparent border-2 border-white/50 text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2"
            >
              爆款安利 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== 商品列表区 ====== */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {activeCategoryName === "全部" ? "穿搭" : activeCategoryName} · 精选
            <span className="ml-2 text-xs font-normal text-gray-400">({products.length} 件)</span>
          </h2>
          <button
            onClick={() => setActiveCategoryName("全部")}
            className="text-xs text-gray-400 hover:text-gray-500"
          >
            ✕ 清除筛选
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 rounded-xl aspect-[3/4] mb-2.5"></div>
                <div className="bg-gray-100 h-3.5 rounded w-3/4 mb-1.5"></div>
                <div className="bg-gray-100 h-3.5 rounded w-2/5"></div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-300 text-base">暂无选品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                <div className="relative overflow-hidden rounded-xl bg-gray-50 mb-2.5 aspect-[3/4]">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">暂无图片</div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 group-hover:text-rose-500 transition-colors leading-snug text-[13px] line-clamp-2">
                  {product.name}
                </h4>
                <p className="text-red-500 font-bold mt-1 text-[15px]">¥{product.price}</p>
                <Link
                  href={`/shop/${product.id}`}
                  className="mt-2 block w-full py-2 text-center bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-semibold rounded-lg hover:shadow-md transition-all"
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
          <div className="mb-4 inline-flex justify-center">
            <Sparkles className="w-7 h-7 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">立即拿货，享受批发价</h3>
          <p className="text-gray-500 text-sm">开通查看价格会员，满3件起享批发底价</p>
          <div className="mt-3 w-24 h-0.5 bg-gray-300 mx-auto rounded-full"></div>
        </div>
      </section>
    </div>
  );
}

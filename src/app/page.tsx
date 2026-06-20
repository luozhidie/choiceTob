"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search, ArrowRight, Star, Shirt, Scissors, Sparkles, Gem, Footprints, ShoppingCart,
  Droplets, PenTool, Palette, Sun, Flame,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  主分类                                                            */
/*  穿搭 → /buyer（买手选品）                                         */
/*  其他行业 → /shop?category=xxx（商品列表页，学同行）                 */
/* ------------------------------------------------------------------ */

const categories = [
  { name: "全部", href: "/" },
  { name: "穿搭", href: "/buyer?category=穿搭", key: "clothing" },
  { name: "护肤", href: "/shop?category=护肤", key: "skincare" },
  { name: "洗护", href: "/shop?category=洗护", key: "haircare" },
  { name: "养生", href: "/shop?category=养生", key: "wellness" },
  { name: "食品", href: "/shop?category=食品", key: "food" },
  { name: "家居", href: "/shop?category=家居", key: "home" },
  { name: "文创", href: "/shop?category=文创", key: "creative" },
  { name: "艺术", href: "/shop?category=艺术", key: "art" },
];

/* ------------------------------------------------------------------ */
/*  子分类（穿搭→/buyer, 其他→/shop）                                  */
/* ------------------------------------------------------------------ */

const subCategoryMap: Record<string, { name: string; icon: React.ReactNode; subKey: string; isBuyer: boolean }[]> = {
  "全部": [
    { name: "精选", icon: <Star className="w-4 h-4" />, subKey: "", isBuyer: false },
  ],
  "穿搭": [
    { name: "上装", icon: <Shirt className="w-4 h-4" />, subKey: "tops", isBuyer: true },
    { name: "下装", icon: <Scissors className="w-4 h-4" />, subKey: "bottoms", isBuyer: true },
    { name: "连衣裙", icon: "👗", subKey: "dress", isBuyer: true },
    { name: "外套", icon: "🧥", subKey: "outerwear", isBuyer: true },
    { name: "配饰", icon: <Gem className="w-4 h-4" />, subKey: "accessory", isBuyer: true },
    { name: "鞋履", icon: <Footprints className="w-4 h-4" />, subKey: "shoes", isBuyer: true },
  ],
  "护肤": [
    { name: "洁面", icon: <Droplets className="w-4 h-4" />, subKey: "cleanser", isBuyer: false },
    { name: "精华", icon: "💧", subKey: "serum", isBuyer: false },
    { name: "面霜", icon: "🧴", subKey: "cream", isBuyer: false },
    { name: "防晒", icon: <Sun className="w-4 h-4" />, subKey: "sunscreen", isBuyer: false },
    { name: "面膜", icon: "😊", subKey: "mask", isBuyer: false },
  ],
  "洗护": [
    { name: "洗发", icon: "🧴", subKey: "shampoo", isBuyer: false },
    { name: "护发", icon: "💆", subKey: "conditioner", isBuyer: false },
    { name: "沐浴", icon: "🚿", subKey: "bodywash", isBuyer: false },
    { name: "身体护理", icon: "🧖", subKey: "bodycare", isBuyer: false },
  ],
  "养生": [
    { name: "补品", icon: "💊", subKey: "supplement", isBuyer: false },
    { name: "茶饮", icon: "🍵", subKey: "tea", isBuyer: false },
    { name: "器械", icon: "🏋️", subKey: "fitness", isBuyer: false },
  ],
  "食品": [
    { name: "零食", icon: "🍪", subKey: "snack", isBuyer: false },
    { name: "饮品", icon: "☕", subKey: "drink", isBuyer: false },
    { name: "食材", icon: "🥬", subKey: "ingredient", isBuyer: false },
  ],
  "家居": [
    { name: "厨具", icon: "🍳", subKey: "kitchen", isBuyer: false },
    { name: "收纳", icon: "📦", subKey: "storage", isBuyer: false },
    { name: "装饰", icon: "🎨", subKey: "decoration", isBuyer: false },
  ],
  "文创": [
    { name: "文具", icon: <PenTool className="w-4 h-4" />, subKey: "stationery", isBuyer: false },
    { name: "手账", icon: "📒", subKey: "journal", isBuyer: false },
    { name: "礼品", icon: "🎁", subKey: "gift", isBuyer: false },
  ],
  "艺术": [
    { name: "画作", icon: <Palette className="w-4 h-4" />, subKey: "painting", isBuyer: false },
    { name: "雕塑", icon: "🗿", subKey: "sculpture", isBuyer: false },
    { name: "工艺品", icon: "🏺", subKey: "craft", isBuyer: false },
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
  // 当前分类是否是穿搭
  const isActiveBuyer = activeCategoryName === "穿搭";

  // 加载商品
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("id, name, price, image_url, category, sub_category");
      const { data, error } = await query.limit(20);
      if (!error && data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      window.location.href = `/shop?keyword=${encodeURIComponent(keyword.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ====== Hero 区域（深色背景 + 搜索框） ====== */}
      <section className="bg-gradient-to-br from-[#2d2640] via-[#3d3552] to-[#453d5c] py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* 数据驱动标签 */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/12 backdrop-blur-sm mb-6 text-[11px] text-white/70 font-medium tracking-widest uppercase">
            ✨ 数据驱动 · 智选未来
          </div>

          {/* 主标题 */}
          <h1 className="text-[32px] sm:text-[38px] lg:text-[46px] font-black text-white leading-[1.15] mb-3 tracking-tight">
            服装供应链<span className="text-[#f0a0b0]">智选</span>平台
          </h1>

          {/* 描述 */}
          <p className="text-[13px] sm:text-sm text-white/50 max-w-xl mx-auto mb-8 leading-relaxed tracking-wide">
            从选品企划到营销落地，以数据智能驱动服装行业全链路高效运营
          </p>

          {/* 搜索框 + 浏览选品按钮 */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-white/30" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品名称、描述..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:bg-white/12 focus:border-white/20 text-[13px]"
              />
            </div>
            <Link
              href="/buyer"
              className="px-5 py-3 bg-white text-[#2d2640] text-[13px] font-bold rounded-xl hover:bg-gray-100 transition-all whitespace-nowrap flex items-center gap-1"
            >
              浏览选品 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </form>
        </div>
      </section>

      {/* ====== 分类标签栏（暖橙渐变） ====== */}
      <section className="bg-gradient-to-r from-orange-200/90 via-amber-100 to-orange-200/80">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1.5 py-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={cat.href}
                onClick={() => setActiveCategoryName(cat.name)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                  activeCategoryName === cat.name
                    ? "bg-white shadow-sm text-[#333] font-semibold"
                    : "text-[#666] hover:bg-white/50"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ====== 动态子分类标签栏 ====== */}
      <section className="bg-white border-b border-gray-100/80">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {currentSubCategories.map((sub) => {
              const href = sub.isBuyer
                ? `/buyer?category=${encodeURIComponent(activeCategoryName)}&subCategory=${encodeURIComponent(sub.subKey)}`
                : sub.subKey
                  ? `/shop?category=${encodeURIComponent(activeCategoryName)}&subCategory=${encodeURIComponent(sub.subKey)}`
                  : "/";
              return (
                <Link
                  key={sub.name}
                  href={href}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all ${
                    sub.name === "精选"
                      ? "bg-[#2d2640] text-white shadow-md"
                      : "bg-gray-50 text-[#555] hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {typeof sub.icon === "string" ? <span>{sub.icon}</span> : sub.icon} {sub.name}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====== Hero 大图区域（暖色调衣架背景——好看！） ====== */}
      <section className="relative h-[400px] sm:h-[460px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 via-transparent to-orange-800/15"></div>
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-4">
          <h2 className="text-[28px] sm:text-[34px] lg:text-[42px] font-extrabold mb-2 tracking-wide drop-shadow-lg">
            骆芷蝶智选 · 好物推荐
          </h2>
          <p className="text-[15px] sm:text-base text-white/85 mb-8 tracking-[0.2em] font-light">
            不自用 · 不分享
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/shop"
              className="px-9 py-3 bg-white/95 backdrop-blur-sm text-[#2d2640] font-bold rounded-lg hover:bg-white transition-all text-[14px] shadow-lg"
            >
              全部商品
            </Link>
            <Link
              href="/buyer"
              className="px-9 py-3 bg-transparent border-2 border-white/70 text-white font-bold rounded-lg hover:bg-white/10 transition-all text-[14px] flex items-center justify-center gap-2"
            >
              爆款安利 <Flame className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ====== 商品列表区 ====== */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#222] tracking-wide">
            {activeCategoryName === "全部" ? "穿搭" : activeCategoryName} · 精选
            <span className="ml-2 text-xs font-normal text-[#bbb]">({products.length} 件)</span>
          </h2>
          <button className="text-xs text-[#ccc] hover:text-[#888]">
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
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      暂无图片
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-[#333] group-hover:text-[#e8557a] transition-colors leading-snug text-[13px] line-clamp-2">
                  {product.name}
                </h4>
                <p className="text-[#e84a68] font-bold mt-1 text-[15px]">¥{product.price}</p>
                <Link
                  href={`/shop/${product.id}`}
                  className="mt-2 block w-full py-1.5 text-center bg-gradient-to-r from-[#ff6b8a] to-[#ff4466] text-white text-xs font-semibold rounded-md hover:shadow-md transition-all"
                >
                  下单
                </Link>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ====== 底部 CTA ====== */}
      <section className="mt-8 bg-gradient-to-b from-[#fffbf5] to-[#fef6eb] py-14 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-4 inline-flex justify-center">
            <Sparkles className="w-8 h-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-[#222] mb-2">立即拿货，享受批发价</h3>
          <p className="text-[#999] text-[13px]">开通查看价格会员，满3件起享批发底价</p>
          <div className="mt-3 w-24 h-0.5 bg-[#ddd] mx-auto rounded-full"></div>
        </div>
      </section>
    </div>
  );
}

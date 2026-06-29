"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Search, ArrowRight, Star, Shirt, Scissors, Sparkles, Gem, Footprints, ShoppingCart,
  Droplets, PenTool, Palette, Sun, Package, Users,
} from "lucide-react";
import TabBar from "@/components/TabBar";
import HeroCarousel from "@/components/HeroCarousel";

/* ------------------------------------------------------------------ */
/*  Block 接口                                                        */
/* ------------------------------------------------------------------ */
interface Block {
  id: string;
  title: string;
  type: "products" | "promotion" | "custom" | "group_buy" | "flash_sale" | "recommendation";
  content?: Record<string, any>;
  style?: { bgColor?: string; textColor?: string; padding?: number; borderRadius?: number };
  is_published: boolean;
  sort_order: number;
}

/* ------------------------------------------------------------------ */
/*  主分类                                                            */
/*  穿搭 → /buyer（买手选品）                                         */
/*  其他 → /category/[category]（商品列表页，带综合/销量/价格/上新tab）*/
/* ------------------------------------------------------------------ */

const categories = [
  { name: "全部", href: "/", key: "all" },
  { name: "穿搭", href: "/buyer", key: "clothing" },
  { name: "护肤", href: "/category/护肤", key: "skincare" },
  { name: "彩妆", href: "/category/彩妆", key: "makeup" },
  { name: "养生", href: "/category/养生", key: "wellness" },
  { name: "食品", href: "/category/食品", key: "food" },
  { name: "家居", href: "/category/家居", key: "home" },
  { name: "文创", href: "/category/文创", key: "creative" },
  { name: "艺术", href: "/category/艺术", key: "art" },
];

/* ------------------------------------------------------------------ */
/*  子分类                                                            */
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
  const [heroBgUrl, setHeroBgUrl] = useState<string>("");
  const [heroTopBgUrl, setHeroTopBgUrl] = useState<string>("");
  const [blocks, setBlocks] = useState<Block[]>([]);

  const supabase = createClient();

  const currentSubCategories = subCategoryMap[activeCategoryName] || subCategoryMap["全部"];

  // 从 site_assets 读取 Hero 背景图（顶部区域 + 大图区域）
  useEffect(() => {
    const fetchHeroBgs = async () => {
      try {
        const [topRes, mainRes] = await Promise.all([
          supabase.from("site_assets").select("image_url").eq("key", "hero_top_bg").maybeSingle(),
          supabase.from("site_assets").select("image_url").eq("key", "hero_bg").maybeSingle(),
        ]);
        if (topRes.data?.image_url) setHeroTopBgUrl(topRes.data.image_url);
        if (mainRes.data?.image_url) setHeroBgUrl(mainRes.data.image_url);
      } catch {}
    };
    fetchHeroBgs();
  }, []);

  // 加载版块（按 position + sort_order 排序）
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const { data, error } = await supabase
          .from("page_blocks")
          .select("*")
          .eq("is_published", true)
          .order("sort_order", { ascending: true });
        if (!error && data) setBlocks(data as Block[]);
      } catch {}
    };
    fetchBlocks();
  }, []);

  const defaultHeroBg = "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80&auto=format";
  const bgImage = heroBgUrl || defaultHeroBg;

  // 加载商品（穿搭精选：从 buyer_products + products 加载服装类）
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const headers: Record<string, string> = {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        };

        const [platformRes, buyerRes] = await Promise.all([
          supabase.from("products").select("id, name, price, image_url, category, sub_category").limit(20),
          fetch(`${supabaseUrl}/rest/v1/buyer_products?is_published=eq.true&order=sort_order.asc&select=id,title,name,price,cover_image,image_url,category,subcategory&limit=20`, { headers }).then(r => r.ok ? r.json() : []),
        ]);

        const merged: any[] = [];
        if (!platformRes.error && platformRes.data) {
          (platformRes.data as any[]).forEach((p: any) => merged.push({ id: p.id, name: p.name || p.title || "商品", price: p.price || 0, image_url: p.image_url || p.cover_image, category: p.category, sub_category: p.sub_category }));
        }
        if (Array.isArray(buyerRes)) {
          (buyerRes as any[]).forEach((p: any) => merged.push({ id: p.id, name: p.title || p.name || "选品", price: p.price || 0, image_url: p.cover_image || p.image_url, category: p.category, sub_category: p.subcategory }));
        }
        setProducts(merged);
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

  // 按 position 分组版块
  const blocksByPosition = (pos: string) =>
    blocks.filter((b: Block) => (b.content as any)?.position === pos);

  // 渲染单个版块
  const renderBlock = (block: Block) => {
    const content: any = block.content || {};
    const style = block.style || {};
    const bg = style.bgColor || "#ffffff";
    const textColor = style.textColor || "#333333";
    const pad = style.padding ?? 16;
    const radius = style.borderRadius ?? 12;

    return (
      <section
        key={block.id}
        style={{ backgroundColor: bg, padding: `${pad}px`, color: textColor, borderRadius: `${radius}px` }}
        className="w-full"
      >
        <div className="max-w-7xl mx-auto">
          <h2 className="font-bold text-lg mb-4">{block.title}</h2>
          {block.type === "products" && (
            <p className="text-sm text-gray-400">
              分类：{content.category || "全部"} ｜ 布局：{content.layout || "grid"} ｜ 列数：{content.columns || 4}
            </p>
          )}
          {block.type === "group_buy" && (
            <p className="text-sm text-gray-400">
              最低 {content.minPeople || 3}人 ｜ 折扣 {(content.discount || 0.8) * 10}折
            </p>
          )}
          {block.type === "flash_sale" && (
            <p className="text-sm text-gray-400">
              活动时长 {((content.duration || 3600) / 60)}分钟 ｜ 折扣 {(content.discount || 0.7) * 10}折
            </p>
          )}
          {block.type === "promotion" && content.promoTitle && (
            <div>
              <h3 className="font-semibold">{content.promoTitle}</h3>
              <p className="text-sm text-gray-500">{content.promoDesc}</p>
            </div>
          )}
          {block.type === "custom" && content.html && (
            <div dangerouslySetInnerHTML={{ __html: content.html }} />
          )}
          {block.type === "recommendation" && (
            <p className="text-sm text-gray-400">🤖 智能推荐版块</p>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ===== 全屏轮播图区域（搜索栏 + 分类 + 标题全部叠在上面） ===== */}
      <section className="relative overflow-hidden" style={{ height: "90vh", minHeight: "600px" }}>
        {/* 轮播图背景 */}
        <HeroCarousel />

        {/* 内容层（叠在轮播图上） */}
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col">
          {/* 顶部：标题 + 搜索栏 + 分类标签 */}
          <div className="px-4 pt-5 pointer-events-auto">
            <div className="max-w-7xl mx-auto">
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <span className="text-[#d8a0c0] text-[10px] tracking-wider">✦</span>
                <span className="text-white/70 text-[10px] font-medium tracking-widest">数据驱动．智选未来</span>
              </div>
              <h1 className="font-black text-white leading-[1.12] mb-3 tracking-tight drop-shadow-lg" style={{ fontSize: "clamp(20px, 3.5vw, 32px)" }}>
                骆芷蝶供应链<span className="text-[#e89aac]">智选</span>平台
              </h1>
              <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mb-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索商品名称、描述..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15 text-sm"
                  />
                </div>
                <Link href="/buyer" className="px-5 py-2.5 bg-white text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0">
                  浏览选品 <ArrowRight className="w-4 h-4" />
                </Link>
              </form>
              {/* 分类标签栏 */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => (
                  <Link
                    key={cat.name}
                    href={cat.href}
                    onClick={() => setActiveCategoryName(cat.name)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all ${
                      activeCategoryName === cat.name
                        ? "bg-white/90 backdrop-blur-sm shadow font-semibold text-gray-800"
                        : "text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* 底部：标题 + 按钮 */}
          <div className="mt-auto pointer-events-auto">
            <div className="text-center text-white px-4 pb-12">
              <h2 className="font-bold tracking-wide drop-shadow-md mb-2" style={{ fontSize: "clamp(22px, 4vw, 34px)" }}>
                爆款选品 · 拿货精选
              </h2>
              <p className="text-white/80 mb-5 tracking-[0.2em] font-light" style={{ fontSize: "14px" }}>
                骆芷蝶智选 · 专业推荐
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/buyer" className="px-8 py-2.5 bg-white text-gray-800 font-bold rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-lg">
                  全部商品
                </Link>
                <Link href="/buyer" className="px-8 py-2.5 bg-transparent border-2 border-white/50 text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-sm flex items-center justify-center gap-2">
                  爆款安利 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 轮播图下方版块 ===== */}
      {blocksByPosition("hero_bottom").map(renderBlock)}

      {/* ===== 商品列表上方版块 ===== */}
      {blocksByPosition("product_top").map(renderBlock)}

      {/* ===== 商品列表区 ===== */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">
            {activeCategoryName === "全部" ? "穿搭" : activeCategoryName} · 精选
            <span className="ml-2 text-xs font-normal text-gray-400">({products.length} 件)</span>
          </h2>
          <button onClick={() => setActiveCategoryName("全部")} className="text-xs text-gray-400 hover:text-gray-500">
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
            <p className="text-gray-300 text-base mb-5">暂无选品</p>
            {/* 拿货拼单入口 */}
            <Link
              href="/buyer"
              className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all"
            >
              <Users className="w-4 h-4" />
              去拿货拼单
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group block">
                <div className="relative overflow-hidden rounded-xl bg-gray-50 mb-2.5 aspect-[3/4]">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">暂无图片</div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 group-hover:text-rose-500 transition-colors leading-snug text-[13px] line-clamp-2">{product.name}</h4>
                <p className="text-red-500 font-bold mt-1 text-[15px]">¥{product.price}</p>
                <Link href={`/shop/${product.id}`} className="mt-2 block w-full py-2 text-center bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-semibold rounded-lg hover:shadow-md transition-all">
                  下单
                </Link>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ===== 商品列表下方版块 ===== */}
      {blocksByPosition("product_bottom").map(renderBlock)}

      <TabBar />

      {/* ===== 底部上方版块 ===== */}
      {blocksByPosition("footer_top").map(renderBlock)}
    </div>
  );
}

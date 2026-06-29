"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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


/* ===== 价格格式化：智能判断分/元 ===== */
function formatPrice(price: number | null | undefined): string {
  if (!price) return "0";
  // 价格 >= 10000 认为是"分"，需要除以100；否则认为已经是"元"
  const p = Number(price);
  if (p >= 10000) return Math.round(p / 100).toLocaleString();
  return p.toLocaleString();
}

// ProductBlock：根据版块配置加载并渲染商品
function ProductBlock({ block, bg, textColor, pad, radius, content, layout, columns }: {
  block: any;
  bg: string;
  textColor: string;
  pad: number;
  radius: number;
  content: any;
  layout: string;
  columns: number;
}) {
  const [blockProducts, setBlockProducts] = useState<any[]>([]);
  const [loadingBlock, setLoadingBlock] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingBlock(true);
      try {
        // 映射后台分类值到中文分类名
        const catMap: Record<string, string> = {
          clothing: "穿搭", accessories: "穿搭", shoes: "穿搭", lingerie: "穿搭",
          skincare: "护肤", makeup: "彩妆", wellness: "养生",
          food: "食品", home: "家居", creative: "文创", art: "艺术",
        };

                let categoryParam = "";
        if (content.category && content.category !== "hot_picks") {
          categoryParam = catMap[content.category] || content.category;
        }

        // 三级降级策略：指定ID → 分类 → 全部商品
        let result: any[] = [];

        // 第一级：按指定ID查
        if (content.productIds) {
          const ids = content.productIds.split(",").map((s: string) => s.trim()).filter(Boolean);
          if (ids.length > 0) {
            const res = await fetch(`/api/public/products?ids=${ids.join(",")}&limit=${ids.length}`);
            const json = await res.json();
            if (json.success && json.data && json.data.length > 0) {
              result = ids.map((id: string) => (json.data as any[]).find((p: any) => p.id === id)).filter(Boolean);
            }
          }
        }

        // 第二级：按分类加载
        if (result.length === 0 && categoryParam) {
          const catRes = await fetch(`/api/public/products?category=${encodeURIComponent(categoryParam)}&limit=20`);
          const catJson = await catRes.json();
          if (catJson.success && catJson.data && catJson.data.length > 0) {
            result = catJson.data;
          }
        }

        // 第三级：加载全部商品（兜底）
        if (result.length === 0) {
          const allRes = await fetch("/api/public/products?limit=20");
          const allJson = await allRes.json();
          if (allJson.success && allJson.data) {
            result = allJson.data;
          }
        }

        setBlockProducts(result);      } catch {
        setBlockProducts([]);
      }
      setLoadingBlock(false);
    };
    loadProducts();
  }, [content.category, content.productIds, block.id]);

  const gridCls = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5", 6: "grid-cols-6" }[columns] || "grid-cols-4";

  return (
    <section style={{ backgroundColor: bg, padding: `${pad}px`, color: textColor, borderRadius: `${radius}px` }} className="w-full">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-bold text-lg mb-4">{block.title}</h2>
        {loadingBlock ? (
          <div className={`grid ${gridCls} gap-4`}>
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 rounded-xl aspect-[3/4] mb-2"></div>
                <div className="bg-gray-100 h-3 rounded w-3/4 mb-1"></div>
                <div className="bg-gray-100 h-3 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : blockProducts.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-400 mb-3">暂无商品，请在后台添加商品并发布</p>
            {/* 调试信息 - 上线后删除此块 */}
            <details className="text-left mx-6 text-[10px] bg-red-50 rounded p-2 border border-red-200">
              <summary className="cursor-pointer font-mono text-red-600">🔧 调试信息（点开查看）</summary>
              <pre className="whitespace-pre-wrap mt-2 text-[10px] leading-tight overflow-auto max-h-[200px] text-red-700 break-all">{JSON.stringify({blockId: block.id, productIds: content.productIds, category: content.category, position: content.position, type: block.type, keys: Object.keys(content), fullContent: content}, null, 2)}</pre>
            </details>
          </div>
        ) : (
          <div className={layout === "carousel" ? "flex gap-4 overflow-x-auto" : `grid ${gridCls} gap-4`}>
            {blockProducts.map((product: any) => (
              <Link key={product.id} href={`/shop/${product.id}`} className="group block min-w-[180px]">
                <div className="relative overflow-hidden rounded-xl bg-gray-50 mb-2 aspect-[3/4]">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">暂无图片</div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 group-hover:text-rose-500 transition-colors leading-snug text-[13px] line-clamp-2">{product.name}</h4>
                <p className="text-red-500 font-bold mt-1 text-[15px]">¥{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


/* ===== 各版块类型的前台展示组件 ===== */

// 团购拼单卡片
function GroupBuyCard({ block, content, bgColor }: { block: any; content: any; bgColor: string }) {
  const minPeople = content.minPeople || 3;
  const discount = content.discount || 0.8;
  const [joined, setJoined] = useState(0);
  const desc = content.desc || `满${minPeople}人成团，享受${Math.round(discount * 10)}折优惠`;

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: bgColor === "#ffffff" ? "linear-gradient(135deg,#fff5f5 0%,#fff 100%)" : bgColor }}>
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center text-lg">👥</div>
          <div>
            <h3 className="font-bold text-base">{block.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white/60 rounded-xl p-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-black text-orange-500">{minPeople}</div>
            <div className="text-[11px] text-gray-400">人成团</div>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <div className="text-2xl font-black text-red-500">{Math.round(discount * 10)}</div>
            <div className="text-[11px] text-gray-400">折起</div>
          </div>
          <div className="w-px h-8 bg-gray-200"></div>
          <div className="text-center">
            <div className="text-2xl font-black text-green-500">{joined}</div>
            <div className="text-[11px] text-gray-400">已参团</div>
          </div>
        </div>
        <Link href="/buyer" className="block w-full py-3 text-center bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:shadow-lg transition-all text-sm">
          立即参团拼单 →
        </Link>
      </div>
    </div>
  );
}

// 限时秒杀卡片
function FlashSaleCard({ block, content, bgColor }: { block: any; content: any; bgColor: string }) {
  const duration = content.duration || 3600;
  const discount = content.discount || 0.7;
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ background: bgColor === "#ffffff" ? "linear-gradient(135deg,#fef2f2 0%,#fff 100%)" : bgColor }}>
      <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-bl-lg">⚡ 限量秒杀</div>
      <div className="p-5 md:p-6 pt-7">
        <h3 className="font-bold text-base mb-2">{block.title}</h3>
        <p className="text-xs text-gray-500 mb-4">{content.desc || `全场${Math.round(discount * 10)}折，手慢无！`}</p>
        <div className="flex items-center gap-2 mb-4">
          {[
            { label: "时", val: pad(h) },
            { label: "分", val: pad(m) },
            { label: "秒", val: pad(s) },
          ].map(({ label, val }) => (
            <div key={label} className="flex flex-col items-center">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-lg ${val !== "00" ? "bg-gray-900" : "bg-gray-300"} text-white flex items-center justify-center text-xl md:text-2xl font-mono font-bold leading-none`}>
                {val}
              </div>
              <span className="text-[10px] text-gray-400 mt-1">{label}</span>
            </div>
          ))}
        </div>
        <Link href="/buyer" className={`block w-full py-3 text-center font-bold rounded-xl text-sm text-white transition-all ${timeLeft > 0 ? "bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-lg animate-pulse" : "bg-gray-300 cursor-not-allowed"}`}>
          {timeLeft > 0 ? "🔥 马上抢购 →" : "⏰ 已结束"}
        </Link>
      </div>
    </div>
  );
}

// 营销活动/宣传主题卡片（可编辑的宣传内容）
function PromotionCard({ block, content, bgColor, textColor }: { block: any; content: any; bgColor: string; textColor: string }) {
  if (!content.promoTitle && !content.promoDesc && !content.imageUrl) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm opacity-50">{block.title}（暂无宣传内容）</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: bgColor }}>
      {content.imageUrl && (
        <img src={content.imageUrl} alt={content.promoTitle || block.title} className="w-full h-40 md:h-52 object-cover" />
      )}
      <div className="p-5 md:p-6">
        {content.promoTitle && (
          <h3 className="font-bold text-lg md:text-xl mb-2" style={{ color: textColor }}>{content.promoTitle}</h3>
        )}
        {content.promoDesc && (
          <p className="text-sm opacity-70 leading-relaxed mb-4" style={{ color: textColor }}>{content.promoDesc}</p>
        )}
        {(content.buttonText || content.linkUrl) && (
          <Link
            href={content.linkUrl || "/buyer"}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition-all"
            style={{ background: textColor === "#333333" ? "linear-gradient(135deg,#e89aac 0%,#d8a0c0 100%)" : undefined }}
          >
            {content.buttonText || "立即查看"} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

// 智能推荐版块（显示推荐商品）
function RecommendationBlock({ block, content, bg, textColor, pad, radius, columns }: {
  block: any; content: any; bg: string; textColor: string; pad: number; radius: number; columns: number;
}) {
  const [recProducts, setRecProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/products?limit=${columns * 2}`)
      .then(r => r.json())
      .then(json => json.success ? setRecProducts(json.data.slice(0, columns * 2) || []) : null)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [columns]);

  const gridCls = { 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5" }[columns] || "grid-cols-4";

  return (
    <section style={{ backgroundColor: bg, padding: `${pad}px`, color: textColor, borderRadius: `${radius}px` }} className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">{block.title}</h2>
          <span className="text-[11px] text-gray-400">✦ AI 精选推荐</span>
        </div>
        {loading ? (
          <div className={`grid ${gridCls} gap-4`}>
            {[1,2,3,4].map(i => <div key={i} className="animate-pulse"><div className="bg-white/50 rounded-xl aspect-[3/4]"></div></div>)}
          </div>
        ) : recProducts.length === 0 ? (
          <p className="text-sm opacity-40 py-8 text-center">暂无推荐商品</p>
        ) : (
          <div className={`grid ${gridCls} gap-4`}>
            {recProducts.map((p: any) => (
              <Link key={p.id} href={`/shop/${p.id}`} className="group block">
                <div className="rounded-xl overflow-hidden mb-2 aspect-[3/4] relative bg-white/30">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">暂无图片</div>
                  )}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] px-2 py-0.5 rounded-full font-medium">AI推荐</div>
                </div>
                <h4 className="font-medium text-[13px] line-clamp-2 group-hover:text-rose-500 transition-colors">{p.name}</h4>
                <p className="text-red-500 font-bold mt-1 text-[14px]">¥{formatPrice(p.price)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [activeCategoryName, setActiveCategoryName] = useState("全部");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroBgUrl, setHeroBgUrl] = useState<string>("");
  const [heroTopBgUrl, setHeroTopBgUrl] = useState<string>("");
  const [blocks, setBlocks] = useState<Block[]>([]);

  const currentSubCategories = subCategoryMap[activeCategoryName] || subCategoryMap["全部"];

  // 从 site_assets 读取 Hero 背景图
  useEffect(() => {
    const fetchHeroBgs = async () => {
      try {
        const res = await fetch("/api/public/site-assets?keys=hero_top_bg,hero_bg");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const map: Record<string, string> = json.data;
            if (map["hero_top_bg"]) setHeroTopBgUrl(map["hero_top_bg"]);
            if (map["hero_bg"]) setHeroBgUrl(map["hero_bg"]);
          }
        }
      } catch {}
    };
    fetchHeroBgs();
  }, []);

  // 加载版块（走公开API，绕过RLS）
  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await fetch("/api/public/blocks");
        const json = await res.json();
        if (json.success && json.data) setBlocks(json.data as Block[]);
      } catch {}
    };
    fetchBlocks();
  }, []);

  const defaultHeroBg = "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80&auto=format";
  const bgImage = heroBgUrl || defaultHeroBg;

  // 加载商品（走公开API，绕过RLS）
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/public/products?limit=20");
        const json = await res.json();
        if (json.success && json.data) setProducts(json.data);
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

  // 按 position 分组版块（兼容旧数据：没有 position 的默认放到 product_bottom）
  const blocksByPosition = (pos: string) =>
    blocks.filter((b: Block) => ((b.content as any)?.position || "product_bottom") === pos);

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
        {/* ===== products 商品展示 ===== */}
        {block.type === "products" && (
          <ProductBlock
            block={block}
            bg={bg}
            textColor={textColor}
            pad={pad}
            radius={radius}
            content={content}
            layout={content.layout || "grid"}
            columns={content.columns || 4}
          />
        )}

        {/* ===== group_buy 团购拼单 ===== */}
        {block.type === "group_buy" && (
          <div className="max-w-7xl mx-auto">
            <GroupBuyCard block={block} content={content} bgColor={bg} />
          </div>
        )}

        {/* ===== flash_sale 限时秒杀 ===== */}
        {block.type === "flash_sale" && (
          <div className="max-w-7xl mx-auto">
            <FlashSaleCard block={block} content={content} bgColor={bg} />
          </div>
        )}

        {/* ===== promotion 营销活动/宣传主题 ===== */}
        {block.type === "promotion" && (
          <div className="max-w-7xl mx-auto">
            <PromotionCard block={block} content={content} bgColor={bg} textColor={textColor} />
          </div>
        )}

        {/* ===== custom 自定义HTML内容 ===== */}
        {block.type === "custom" && (
          <div className="max-w-7xl mx-auto">
            {content.html ? (
              <div dangerouslySetInnerHTML={{ __html: content.html }} />
            ) : (
              <p className="text-sm text-gray-400 py-8 text-center">暂无内容</p>
            )}
          </div>
        )}

        {/* ===== recommendation 智能推荐 ===== */}
        {block.type === "recommendation" && (
          <div className="max-w-7xl mx-auto">
            <RecommendationBlock block={block} content={content} bg={bg} textColor={textColor} pad={pad} radius={radius} columns={content.columns || 4} />
          </div>
        )}
      </section>
    );
  };

  // 是否有商品类型的版块（有则隐藏中间硬编码的商品列表区）
  const hasProductBlocks = useMemo(() =>
    blocks.some((b) => b.type === "products"),
    [blocks]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* ===== 全屏轮播图区域 ===== */}
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

      {/* ===== 商品列表区（仅当没有商品类型版块时显示，避免重复） ===== */}
      {!hasProductBlocks && (
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
                <p className="text-red-500 font-bold mt-1 text-[15px]">¥{formatPrice(product.price)}</p>
                <Link href={`/shop/${product.id}`} className="mt-2 block w-full py-2 text-center bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs font-semibold rounded-lg hover:shadow-md transition-all">
                  下单
                </Link>
              </Link>
            ))}
          </div>
        )}
      </section>
      )}

      {/* ===== 商品列表下方版块 ===== */}
      {blocksByPosition("product_bottom").map(renderBlock)}

      <TabBar />

      {/* ===== 底部上方版块 ===== */}
      {blocksByPosition("footer_top").map(renderBlock)}
    </div>
  );
}

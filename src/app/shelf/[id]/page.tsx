"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Home, Package } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";

interface ShelfBlock {
  id: string;
  title: string;
  type: string;
  content?: {
    image?: string;
    subtitle?: string;
    badge?: string;
    productIds?: string;
    category?: string;
    subcategory?: string;
    tags?: string;
    [key: string]: any;
  };
  section_title?: string | null;
  section_subtitle?: string | null;
}

export default function ShelfPage() {
  const params = useParams();
  const shelfId = params.id as string;

  const [block, setBlock] = useState<ShelfBlock | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shelfId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. 取货架配置
        const blockRes = await fetch(`/api/public/blocks?id=${encodeURIComponent(shelfId)}`);
        const blockJson = await blockRes.json();
        if (!blockJson.success || !blockJson.data) {
          setError("货架不存在或未发布");
          setLoading(false);
          return;
        }
        const shelf = blockJson.data as ShelfBlock;
        if (!cancelled) setBlock(shelf);

        // 2. 根据配置取商品
        const content = shelf.content || {};
        let fetched: any[] = [];

        // 优先级1：指定商品ID
        if (content.productIds) {
          const ids = content.productIds
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
          if (ids.length > 0) {
            const res = await fetch(
              `/api/public/products?ids=${ids.join(",")}&limit=${ids.length}`
            );
            const json = await res.json();
            if (json.success && json.data) {
              fetched = ids
                .map((id) => json.data.find((p: any) => p.id === id))
                .filter(Boolean);
            }
          }
        }

        // 优先级2：按分类
        if (fetched.length === 0 && content.category) {
          const url = new URL("/api/public/products", location.origin);
          url.searchParams.set("category", content.category);
          url.searchParams.set("limit", "200");
          const res = await fetch(url.toString());
          const json = await res.json();
          if (json.success && json.data) fetched = json.data;
        }

        // 优先级3：按标签（先全量再客户端过滤）
        if (fetched.length === 0 && content.tags) {
          const res = await fetch("/api/public/products?limit=200");
          const json = await res.json();
          if (json.success && json.data) fetched = json.data;
        }

        // 兜底：全部商品
        if (fetched.length === 0) {
          const res = await fetch("/api/public/products?limit=200");
          const json = await res.json();
          if (json.success && json.data) fetched = json.data;
        }

        // 应用子分类 / 标签的二次过滤（仅非指定商品时）
        const tagList = (content.tags || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        if (!content.productIds) {
          fetched = fetched.filter((p: any) => {
            if (content.subcategory && p.subcategory !== content.subcategory && p.sub_category !== content.subcategory) {
              return false;
            }
            if (tagList.length > 0) {
              const pTags = p.tags || [];
              return tagList.some((t) => pTags.includes(t));
            }
            return true;
          });
        }

        if (!cancelled) setProducts(fetched);
      } catch (e: any) {
        console.error("[ShelfPage] 加载失败:", e);
        if (!cancelled) setError("加载失败，请稍后重试");
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [shelfId]);

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-base">{error}</p>
        <Link
          href="/"
          className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-full text-sm"
        >
          返回首页
        </Link>
      </div>
    );
  }

  const content = block?.content || {};
  const image = content.image || "";
  const badge = content.badge || "";
  const subtitle = block?.section_subtitle || content.subtitle || "";

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4 px-4 py-3 border-b sticky top-0 bg-white z-20">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <Home className="w-5 h-5" />
        </Link>
        <h1 className="text-sm font-medium text-gray-900 truncate flex-1">
          {block?.title || "货架"}
        </h1>
      </div>

      {/* 货架 Banner */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={block?.title || "货架"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            暂无货架图片
          </div>
        )}
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          {badge && (
            <span className="inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs mb-2">
              {badge}
            </span>
          )}
          <h2 className="text-xl md:text-2xl font-bold">{block?.title}</h2>
          {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* 商品列表 */}
      <ProductGrid
        products={products}
        loading={loading}
        emptyText="该货架暂无商品"
        showSearch={true}
        showSortTabs={true}
        showSubCategories={true}
        showCount={true}
      />
    </div>
  );
}

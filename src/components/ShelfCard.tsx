"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ShelfCardProps {
  block: any;
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return "0";
  const p = Number(price);
  const yuan = p >= 100 ? Math.round(p / 100) : p;
  return "¥" + (yuan % 1 === 0 ? yuan.toString() : yuan.toFixed(2));
}

export default function ShelfCard({ block }: ShelfCardProps) {
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const content = block?.content || {};

  useEffect(() => {
    const loadPreview = async () => {
      let result: any[] = [];
      const productIds = content.productIds || "";
      const category = content.category || "";
      const tags = content.tags || "";
      const subcategory = content.subcategory || "";

      try {
        // 1. 指定商品
        if (productIds) {
          const ids = productIds.split(",").map((s: string) => s.trim()).filter(Boolean);
          if (ids.length > 0) {
            const res = await fetch(`/api/public/products?ids=${ids.join(",")}&limit=${ids.length}`);
            const json = await res.json();
            if (json.success && json.data) {
              result = ids.map((id: string) => json.data.find((p: any) => p.id === id)).filter(Boolean);
            }
          }
        }

        // 2. 分类
        if (result.length === 0 && category) {
          const res = await fetch(`/api/public/products?category=${encodeURIComponent(category)}&limit=10`);
          const json = await res.json();
          if (json.success && json.data) result = json.data;
        }

        // 3. 标签
        if (result.length === 0 && tags) {
          const res = await fetch(`/api/public/products?limit=10`);
          const json = await res.json();
          if (json.success && json.data) {
            const tagList = tags.split(",").map((s: string) => s.trim()).filter(Boolean);
            result = json.data.filter((p: any) => {
              const pTags = p.tags || [];
              return tagList.some((t: string) => pTags.includes(t));
            });
          }
        }

        // 4. 兜底
        if (result.length === 0) {
          const res = await fetch(`/api/public/products?limit=10`);
          const json = await res.json();
          if (json.success && json.data) result = json.data;
        }

        // 应用子分类过滤（非指定商品时）
        if (subcategory && !productIds) {
          result = result.filter((p: any) => p.subcategory === subcategory || p.sub_category === subcategory);
        }

        setPreviewProducts(result.slice(0, 3));
      } catch (e) {
        console.error("[ShelfCard] 加载预览商品失败:", e);
      }
    };

    loadPreview();
  }, [content.productIds, content.category, content.subcategory, content.tags]);

  const image = content.image || "";
  const badge = content.badge || "";
  const subtitle = block?.section_subtitle || content.subtitle || "";

  return (
    <div className="max-w-7xl mx-auto">
      <Link
        href={`/shelf/${block.id}`}
        className="group block relative w-full rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="aspect-[3/2] md:aspect-[16/9] relative">
          {image ? (
            <img
              src={image}
              alt={block.title}
              className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            {badge && (
              <span className="inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs mb-2">
                {badge}
              </span>
            )}
            <h3 className="text-xl md:text-2xl font-bold">{block.title}</h3>
            {subtitle && <p className="text-sm text-white/80 mt-1">{subtitle}</p>}
          </div>
        </div>
      </Link>

      {/* 3 个预览商品 */}
      {previewProducts.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {previewProducts.map((product) => (
            <Link
              key={product.id}
              href={`/shelf/${block.id}`}
              className="group block relative rounded-xl overflow-hidden bg-gray-100 aspect-[3/4]"
            >
              <img
                src={product.image_url || product.cover_image}
                alt={product.name || product.title || "商品"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                <p className="text-white font-bold text-sm">{formatPrice(product.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

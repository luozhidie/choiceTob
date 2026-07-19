"use client";

import { useEffect, useState } from "react";

/**
 * 板块自动配图：品牌渐变底 + 复用商品图拼成照片墙。
 * 用于横幅类板块"未上传自定义图"时的兜底，运营零设计即可有真实商品照片。
 */

// 拉取若干商品图（首页横幅无图时自动合成 Banner 背景）
export function useFallbackProductImages(limit = 6): string[] {
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/products?limit=${limit}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        const imgs = ((j && j.data) || [])
          .map((p: any) => p.image_url || (p.images && p.images[0]) || "")
          .filter(Boolean)
          .slice(0, limit);
        setImages(imgs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [limit]);
  return images;
}

export default function ProductCollage({
  images = [],
  gradient = "bg-gradient-to-br from-[#8a6d5b] via-[#b08968] to-[#d9c2a8]",
  className = "",
}: {
  images?: string[];
  gradient?: string;
  className?: string;
}) {
  const imgs = (images || []).filter(Boolean).slice(0, 6);
  return (
    <div className={`absolute inset-0 ${gradient} ${className}`}>
      {imgs.length > 0 && (
        <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 grid-rows-2 gap-[2px] opacity-90">
          {imgs.map((src, i) => (
            <div key={i} className="relative overflow-hidden bg-black/10">
              <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

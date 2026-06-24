"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Banner {
  id: string;
  image_url: string;
  link_url?: string;
  title?: string;
  subtitle?: string;
}

export default function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const supabase = createClient();

  // 从后台加载轮播图（site_assets 表中 key = 'hero_banner' 的记录）
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("site_assets")
          .select("id, image_url, link_url, title, subtitle")
          .like("key", "hero_banner%")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          setBanners(data);
        } else {
          // 默认轮播图（如果后台没配置）
          setBanners([
            { id: "default-1", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80&auto=format", title: "爆款选品", subtitle: "拿货精选" },
            { id: "default-2", image_url: "https://images.unsplash.com/photo-1469337982187-4a8d9b1eeeb?w=1600&q=80&auto=format", title: "新品上市", subtitle: "时尚穿搭" },
          ]);
        }
      } catch {
        // 使用默认图
        setBanners([
          { id: "default-1", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80&auto=format" },
        ]);
      }
    };
    loadBanners();
  }, []);

  // 自动轮播
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000); // 4秒切换

    return () => clearInterval(timer);
  }, [banners.length]);

  // 手动切换
  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <>
      {/* 轮播图 */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url('${banner.image_url}')` }}
          />
        ))}

        {/* 点击跳转 */}
        {currentBanner.link_url && (
          <a
            href={currentBanner.link_url}
            className="absolute inset-0 z-10"
            target="_blank"
            rel="noopener noreferrer"
          />
        )}
      </div>

      {/* 指示器（小圆点） */}
      {banners.length > 1 && (
        <div className="relative z-20 flex justify-center gap-2 -mt-8">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}

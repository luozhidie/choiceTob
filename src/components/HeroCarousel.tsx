"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  link_url?: string | null;
  title?: string | null;
  subtitle?: string | null;
  button_text?: string | null;
  is_active: boolean;
}

export default function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const supabase = createClient();

  // 从后台加载轮播图
  useEffect(() => {
    const loadBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("site_assets")
          .select("*")
          .like("key", "hero_banner%")
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          setBanners(data);
        } else {
          // 默认示例数据（方便测试）
          setBanners([
            { 
              id: "default-1", 
              image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80&auto=format",
              link_url: "/buyer",
              title: "爆款选品 · 拿货精选",
              subtitle: "骆芷蝶智选 · 专业推荐",
              button_text: "全部商品 →",
              is_active: true,
            },
            { 
              id: "default-2", 
              image_url: "https://images.unsplash.com/photo-1469337982187-4a8d9b1eeeb?w=1600&q=80&auto=format",
              link_url: "/vip",
              title: "开通价格会员",
              subtitle: "解锁批发价，享受更多优惠",
              button_text: "立即开通 →",
              is_active: true,
            },
          ]);
        }
      } catch {
        setBanners([
          { 
            id: "default-1", 
            image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1600&q=80&auto=format",
            link_url: "/buyer",
            is_active: true,
          },
        ]);
      }
    };
    loadBanners();
  }, []);

  // 自动轮播
  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      handleNext();
    }, 5000); // 5秒切换
  }, [banners.length]);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

  // 切换下一张
  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
      setIsTransitioning(false);
    }, 300);
  };

  // 切换上一张
  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
      setIsTransitioning(false);
    }, 300);
  };

  // 跳转到指定张
  const goTo = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  // 处理链接
  const renderLink = (children: React.ReactNode, linkUrl?: string | null) => {
    if (!linkUrl) return <div>{children}</div>;
    
    if (linkUrl.startsWith("http")) {
      return (
        <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="block">
          {children}
        </a>
      );
    }
    
    return <Link href={linkUrl}>{children}</Link>;
  };

  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={() => { stopAutoPlay(); setShowCloseBtn(true); }}
      onMouseLeave={() => { startAutoPlay(); setShowCloseBtn(false); }}
      onTouchStart={() => stopAutoPlay()}
      onTouchEnd={() => startAutoPlay()}
    >
      {/* 轮播图片 */}
      <div className="absolute inset-0">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out ${
              index === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105"
            }`}
            style={{ backgroundImage: `url('${banner.image_url}')` }}
          />
        ))}
        
        {/* 整个区域可点击跳转 */}
        {currentBanner.link_url && (
          currentBanner.link_url.startsWith("http") ? (
            <a
              href={currentBanner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 z-10"
            />
          ) : (
            <Link href={currentBanner.link_url || "#"} className="absolute inset-0 z-10" />
          )
        )}
      </div>

      {/* 遮罩层 - 让叠在上面的文字更清晰 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

      {/* 左右箭头 */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            aria-label="上一张"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
            aria-label="下一张"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 底部指示器 */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); goTo(index); }}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 h-2 rounded-full bg-white"
                  : "w-2 h-2 rounded-full bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`第${index + 1}张`}
            />
          ))}
        </div>
      )}

      {/* 关闭按钮（hover时显示） */}
      {showCloseBtn && banners.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); stopAutoPlay(); }}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/40 transition-colors"
          title="暂停轮播"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

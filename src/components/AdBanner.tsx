import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

interface AdBannerProps {
  position: "top" | "sidebar" | "inline" | "footer";
  imageUrl?: string;
  linkUrl?: string;
  title?: string;
  description?: string;
}

const defaultAds: Record<string, AdBannerProps> = {
  top: {
    position: "top",
    imageUrl: "/ads/top-banner.jpg",
    linkUrl: "/contact",
    title: "🎉 限时优惠：首单立减500元",
    description: "新用户专享，立即咨询",
  },
  sidebar: {
    position: "sidebar",
    imageUrl: "/ads/sidebar-ad.jpg",
    linkUrl: "/magazine",
    title: "📖 最新杂志：2026春夏流行色报告",
    description: "点击阅读全文",
  },
  inline: {
    position: "inline",
    imageUrl: "/ads/inline-ad.jpg",
    linkUrl: "/hot-picks",
    title: "🔥 本季爆款TOP10 限时查看",
    description: "付费会员专享内容",
  },
  footer: {
    position: "footer",
    imageUrl: "/ads/footer-ad.jpg",
    linkUrl: "/contact",
    title: "💼 品牌全案策划服务",
    description: "从0到1打造品牌竞争力",
  },
};

export default function AdBanner({ position }: { position: AdBannerProps["position"] }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const key = `ad_dismissed_${position}`;
    if (localStorage.getItem(key) === "true") {
      setDismissed(true);
    }
  }, [position]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`ad_dismissed_${position}`, "true");
  };

  if (dismissed) return null;

  const ad = defaultAds[position];
  if (!ad) return null;

  const sizeClasses = {
    top: "w-full h-16 sm:h-20",
    sidebar: "w-full h-64",
    inline: "w-full h-40 sm:h-48",
    footer: "w-full h-32 sm:h-40",
  };

  const bgGradients = {
    top: "from-primary to-primary/80",
    sidebar: "from-primary/90 to-primary/70",
    inline: "from-primary/90 to-primary/80",
    footer: "from-gray-900 to-gray-800",
  };

  return (
    <div className="relative my-6">
      <Link href={ad.linkUrl || "#"}>
        <div
          className={`w-full ${sizeClasses[position]} rounded-xl bg-gradient-to-r ${bgGradients[position]} flex items-center justify-center relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group`}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white -translate-y-1/2 translate-x-1/3" />
          </div>

          <div className="relative text-center px-4">
            <div className="text-lg sm:text-xl font-bold text-pink-400 mb-1">
              {ad.title}
            </div>
            <div className="text-sm text-white/80">
              {ad.description} →
            </div>
          </div>

          {/* Hover CTA */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-4 py-2 bg-white text-primary text-sm font-semibold rounded-lg">
              了解详情
            </span>
          </div>
        </div>
      </Link>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full bg-black/30 text-white/80 hover:text-white hover:bg-black/50 transition-colors z-10"
        aria-label="关闭广告"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// 弹窗广告组件
export function PopupAd() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("popup_ad_dismissed");
    if (dismissed !== "true") {
      const timer = setTimeout(() => setShow(true), 5000); // 5秒后显示
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShow(false);
    localStorage.setItem("popup_ad_dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-5xl mb-4">🎁</div>
        <h3 className="text-xl font-bold text-pink-500 mb-2">
          限时优惠活动
        </h3>
        <p className="text-pink-400 leading-relaxed mb-6">
          新用户首单立减500元，附赠价值1000元买手选品诊断服务
        </p>
        <Link
          href="/contact"
          onClick={handleClose}
          className="inline-flex items-center gap-2 px-8 py-3 bg-pink-500 text-white font-semibold rounded-lg hover:bg-pink-600 transition-colors"
        >
          立即咨询
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

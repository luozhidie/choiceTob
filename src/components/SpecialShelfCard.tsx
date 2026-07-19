"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductCollage from "./ProductCollage";

interface SpecialProduct {
  id: string;
  title: string;
  price: number;
  priceText: string;
  wholesale_price: number;
  wholesaleText: string;
  image_url: string | null;
  category: string | null;
  discountText: string;
  savedText: string;
}

const TABS = [
  { key: "special", label: "特价甄选" },
  { key: "first_drop", label: "首次降价" },
  { key: "below30", label: "3折以下" },
  { key: "offseason", label: "反季特价" },
];

const yuan = (n: number) => (n ? (n / 100).toFixed(2) : "0");

export default function SpecialShelfCard({ block }: { block: any }) {
  const content = block?.content || {};
  const [active, setActive] = useState("special");
  const [products, setProducts] = useState<SpecialProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/public/special-products?mode=${active}&limit=20`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.success) setProducts(j.data || []);
        if (!cancelled) setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [active]);

  const bannerImage = content.banner_image || "";
  const tag = content.tag || "限时采购";
  const headline = content.headline || "SALE";
  const subheadline = content.subheadline || "季末·特价捡漏";
  const descriptor = content.descriptor || "全国批发市场 · 优质大牌";

  return (
    <div className="max-w-7xl mx-auto">
      {/* 大促横幅：参考「一手特价」风格 */}
      <a
        href={content.link || "#"}
        className="group relative block mx-4 mb-4 rounded-2xl overflow-hidden shadow-md aspect-[16/9] md:aspect-[21/9]"
      >
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={headline}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
        ) : (
          <ProductCollage
            images={products.map((p) => p.image_url).filter(Boolean)}
            gradient="bg-gradient-to-br from-[#5a3a3a] via-[#7a5a52] to-[#a89f91]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-6">
          <div>
            <span className="inline-block px-2.5 py-1 bg-white/90 text-[#5a3a3a] text-[11px] md:text-xs font-bold rounded-full shadow-sm">
              {tag}
            </span>
          </div>
          <div>
            <h3 className="text-white font-black text-4xl md:text-6xl tracking-tight drop-shadow-lg">
              {headline}
            </h3>
            <p className="text-white/95 text-sm md:text-lg font-medium mt-1 drop-shadow">
              {subheadline}
            </p>
            <p className="text-white/75 text-[11px] md:text-xs mt-2 drop-shadow">
              {descriptor}
            </p>
          </div>
        </div>
      </a>

      {/* Tab 切换 */}
      <div className="flex items-center gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition ${
              active === t.key ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 商品网格 */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm">该分类暂无特价商品</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
          {products.map((p) => (
            <Link key={p.id} href={`/shop/${p.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm">
              <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">无图</div>
                )}
                {p.discountText && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded">{p.discountText}</span>
                )}
              </div>
              <div className="p-3">
                <div className="text-xs text-gray-400 truncate">{p.category || ""}</div>
                <div className="text-sm font-medium text-gray-800 line-clamp-2 h-10 mt-0.5">{p.title}</div>
                <div className="flex items-baseline gap-1.5 mt-1.5">
                  <span className="text-red-500 font-bold text-base">{p.wholesaleText || "¥" + yuan(p.price)}</span>
                  {p.price ? <span className="text-xs text-gray-400 line-through">¥{yuan(p.price)}</span> : null}
                </div>
                {p.savedText && <div className="text-[10px] text-orange-500 mt-0.5">{p.savedText}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

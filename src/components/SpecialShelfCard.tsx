"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  const [loading, setLoading] = useState(false);

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

  const markets: any[] = (() => {
    if (Array.isArray(content.markets) && content.markets.length) return content.markets;
    const arr: any[] = [];
    for (let i = 0; i < 2; i++) {
      const name = content[`market${i}Name`];
      const link = content[`market${i}Link`];
      if (name) arr.push({ name, link: link || "#" });
    }
    return arr;
  })();

  return (
    <div className="max-w-7xl mx-auto">
      {/* 市场入口卡（可选） */}
      {markets.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4 mb-3">
          {markets.map((m: any, i: number) => (
            <a key={i} href={m.link || "#"} className="group relative rounded-2xl overflow-hidden shadow-sm">
              {m.image ? (
                <img src={m.image} alt={m.name || ""} className="w-full h-24 object-cover group-hover:scale-105 transition" />
              ) : (
                <div className="h-24 bg-gradient-to-br from-[#6b3f70] to-[#d9a7c7]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                <span className="text-white font-bold text-sm">{m.name}</span>
                {m.desc && <span className="text-white/80 text-[11px]">{m.desc}</span>}
              </div>
            </a>
          ))}
        </div>
      )}

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

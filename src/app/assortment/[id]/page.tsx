"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, Flame, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  title: string;
  cover_image: string | null;
  price: number;
  wholesale_price: number | null;
  bulk_price: number | null;
  category: string;
  subcategory?: string | null;
  sales?: number;
}

interface PlanCategory {
  category: string;
  code: string;
  target_sku: number;
  wave: string;
}

interface Marketing {
  headline: string;
  subheadline: string;
  selling_points: string[];
  cta: string;
  hashtags: string[];
  banner_image_url: string;
}

const yuan = (n: number) => (n ? (n / 100).toFixed(2) : "0");

function Countdown({ target }: { target: string }) {
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLeft({ d, h, m, s });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [target]);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <span className="bg-white/20 text-white px-1.5 py-0.5 rounded">{pad(left.d)}</span>天
      <span className="bg-white/20 text-white px-1.5 py-0.5 rounded">{pad(left.h)}</span>:
      <span className="bg-white/20 text-white px-1.5 py-0.5 rounded">{pad(left.m)}</span>:
      <span className="bg-white/20 text-white px-1.5 py-0.5 rounded">{pad(left.s)}</span>
    </div>
  );
}

export default function AssortmentTopicPage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(params.id as string);
  const [plan, setPlan] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCat, setActiveCat] = useState<string>("全部");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/public/assortment/${id}/progress`).then((r) => r.json()),
      fetch("/api/public/products?limit=500").then((r) => r.json()),
    ]).then(([pr, pd]) => {
      if (pr.success) setProgress(pr.data);
      if (pd.success && Array.isArray(pd.data)) setProducts(pd.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const marketing: Marketing | undefined = progress?.marketing || progress?.plan?.marketing;
  const categories: PlanCategory[] = progress?.plan?.categories || progress?.items?.map((i: any) => ({ category: i.category, code: i.code, target_sku: i.target_sku, wave: i.wave })) || [];
  const labels = categories.map((c) => c.category);
  const endDate = progress?.plan?.end_date || new Date(Date.now() + 7 * 86400000).toISOString();

  const filtered = activeCat === "全部" ? products : products.filter((p) => p.category === activeCat);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中…</div>;
  if (!progress) return <div className="text-center py-20 text-gray-400">专题不存在</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={marketing?.banner_image_url || "https://image.pollinations.ai/prompt/fashion%20banner%20autumn?width=800&height=400&nologo=true&seed=1"}
          alt={marketing?.headline || "组货专题"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-red-500 rounded text-xs font-bold">限时专题</span>
            {progress.plan?.season && <span className="text-xs opacity-90">{progress.plan.season}</span>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{marketing?.headline || progress.plan?.title}</h1>
          <p className="text-sm opacity-90 line-clamp-2">{marketing?.subheadline || progress.plan?.title}</p>
          <div className="flex items-center gap-2 mt-3 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <Countdown target={endDate} />
          </div>
        </div>
      </div>

      {/* Selling Points */}
      {marketing?.selling_points && marketing.selling_points.length > 0 && (
        <div className="bg-white mx-4 -mt-4 relative z-10 rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap gap-2">
            {marketing.selling_points.slice(0, 4).map((p, i) => (
              <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">{p}</span>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="sticky top-0 z-20 bg-white mt-4 border-b border-gray-100">
        <div className="flex overflow-x-auto px-4 py-3 gap-3 no-scrollbar">
          <button
            onClick={() => setActiveCat("全部")}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium ${activeCat === "全部" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
          >全部</button>
          {labels.map((l) => (
            <button
              key={l}
              onClick={() => setActiveCat(l)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${activeCat === l ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-4">
        {activeCat !== "全部" && (
          <div className="text-xs text-gray-400 mb-3">
            {activeCat} · 已传 {progress.items?.find((i: any) => i.category === activeCat)?.uploaded || 0} / {progress.items?.find((i: any) => i.category === activeCat)?.target_sku || 0} 件
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">该分类暂无商品，后台正在上传中…</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <Link key={p.id} href={`/shop/${p.id}`} className="group bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden">
                  {p.cover_image ? <img src={p.cover_image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-gray-300">无图</div>}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded">新人福利</div>
                </div>
                <div className="p-3">
                  <div className="text-xs text-gray-400 truncate">{p.category}{p.subcategory ? `·${p.subcategory}` : ""}</div>
                  <div className="text-sm font-medium text-gray-800 line-clamp-2 h-10 mt-0.5">{p.title}</div>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className="text-red-500 font-bold text-base">¥{yuan(p.wholesale_price || p.price)}</span>
                    <span className="text-xs text-gray-400 line-through">¥{yuan(p.price)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-400">{p.sales ? `已售 ${p.sales}` : "新品"}</span>
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center"><ShoppingCart className="w-3.5 h-3.5" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 z-30">
        <Link href="/" className="block w-full py-3 bg-gray-900 text-white text-center rounded-xl font-medium text-sm">
          {marketing?.cta || "返回首页继续逛"}
        </Link>
      </div>
    </div>
  );
}

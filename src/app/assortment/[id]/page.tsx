"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Clock, Flame, ShoppingCart, Layers } from "lucide-react";

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
  note: string;
  retail_band: number[] | null;
  wholesale_band: number[] | null;
  bulk_band: number[] | null;
  uploaded: number;
  progress: number;
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
const bandText = (b: number[] | null) =>
  b && b.length === 2 ? `¥${yuan(b[0])}-${yuan(b[1])}` : "—";

// 近黑内嵌渐变 / pollinations 生成图一律视为不可靠，走品牌粉兜底，避免黑屏
function isSafeImage(u?: string | null): boolean {
  if (!u || u.trim() === "") return false;
  if (u.startsWith("data:image/svg")) return false;
  if (u.includes("pollinations.ai")) return false;
  return true;
}

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

  // 接口返回扁平结构（data 直接含 marketing / categories / items），无 plan 嵌套层
  const data = progress || {};
  const marketing: Marketing | undefined = data.marketing || undefined;
  const endDate = data.end_date || new Date(Date.now() + 7 * 86400000).toISOString();

  // 合并 categories（含目标/说明/波段）与 items（含已传/进度）为品类架构
  const itemsByCat: Record<string, any> = {};
  (data.items || []).forEach((it: any) => { itemsByCat[String(it.category)] = it; });
  const categories: PlanCategory[] = (data.categories || []).map((c: any) => {
    const lbl = String(c.category || "").trim();
    const it = itemsByCat[lbl] || {};
    return {
      category: lbl,
      code: c.code || "",
      target_sku: Number(c.target_sku) || 0,
      wave: c.wave || "",
      note: c.note || "",
      retail_band: c.retail_band || null,
      wholesale_band: c.wholesale_band || null,
      bulk_band: c.bulk_band || null,
      uploaded: it.uploaded || 0,
      progress: it.progress || 0,
    };
  }).filter((c: PlanCategory) => c.category);

  const labels = categories.map((c) => c.category);
  const heroImg = isSafeImage(marketing?.banner_image_url) ? marketing!.banner_image_url! : "";

  const filtered = activeCat === "全部" ? products : products.filter((p) => p.category === activeCat);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中…</div>;
  if (!progress) return <div className="text-center py-20 text-gray-400">专题不存在</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Banner */}
      <div className="relative h-72 md:h-96 overflow-hidden bg-gradient-to-br from-[#6b3f70] via-[#a86fa0] to-[#d9a7c7]">
        {heroImg ? (
          <img
            src={heroImg}
            alt={marketing?.headline || data.title || "组货专题"}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0"; }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-red-500 rounded text-xs font-bold">限时专题</span>
            {data.season && <span className="text-xs opacity-90">{data.season}</span>}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">{marketing?.headline || data.title}</h1>
          <p className="text-sm opacity-90 line-clamp-2">{marketing?.subheadline || data.title}</p>
          <div className="flex items-center gap-2 mt-3 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <Countdown target={endDate} />
          </div>
        </div>
      </div>

      {/* 方案介绍（写进来：之前只在首页卡片上显示，现在放进专题内） */}
      {marketing?.subheadline && (
        <div className="bg-white mx-4 -mt-4 relative z-10 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-800">方案介绍</span>
            {data.season && <span className="text-xs text-gray-400">{data.season}</span>}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{marketing.subheadline}</p>
          {marketing.selling_points && marketing.selling_points.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {marketing.selling_points.slice(0, 6).map((p, i) => (
                <span key={i} className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">{p}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 品类架构（点进来应看到的架构：品类 / 波段 / 目标 / 已传进度 / 说明） */}
      {categories.length > 0 && (
        <div className="bg-white mx-4 mt-4 rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-gray-800">品类架构</span>
            <span className="text-xs text-gray-400">共 {categories.length} 个品类 · 目标 {data.total_target || categories.reduce((s, c) => s + c.target_sku, 0)} SKU</span>
          </div>
          <div className="space-y-3">
            {categories.map((c) => (
              <div key={c.category} className="border border-gray-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{c.category}</span>
                    {c.wave && <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">{c.wave}</span>}
                  </div>
                  <span className="text-xs text-gray-400">已传 {c.uploaded}/{c.target_sku} · {c.progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${c.progress >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${c.progress}%` }} />
                </div>
                {c.note && <p className="text-xs text-gray-500 leading-relaxed">{c.note}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                  <span>零售 {bandText(c.retail_band)}</span>
                  <span>批发 {bandText(c.wholesale_band)}</span>
                  <span>批量 {bandText(c.bulk_band)}</span>
                </div>
              </div>
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
            {activeCat} · 已传 {categories.find((c) => c.category === activeCat)?.uploaded || 0} / {categories.find((c) => c.category === activeCat)?.target_sku || 0} 件
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

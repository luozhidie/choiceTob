"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft, TrendingUp, Palette, Scissors,
  Sparkles, Loader2, AlertCircle, Shirt, Layers, Search,
} from "lucide-react";

/* ===================== 类型 ===================== */
interface TrendItem { name: string; score: number; direction: "up" | "stable" | "down"; }
interface ProductItem { id: string; title: string; price: number; image: string; matchSuggestion?: string; }

/* ===================== 辅助 ===================== */
const directionIcon = (d: TrendItem["direction"]) => {
  if (d === "up") return <span className="text-emerald-500 text-xs">▲ 上升</span>;
  if (d === "down") return <span className="text-rose-500 text-xs">▼ 下降</span>;
  return <span className="text-gray-400 text-xs">→ 稳定</span>;
};
const barWidth = (s: number) => `${Math.max(s, 4)}%`;
const scoreColor = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 50 ? "bg-amber-400" : "bg-rose-400";

/* ===================== 页面 ===================== */
export default function AdminTrendPredictPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 管理员权限检查
  useEffect(() => {
    const check = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/admin/login"); return; }
      const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map(e => e.trim());
      if (!adminEmails.includes(user.email || "")) { router.push("/members"); return; }
      setIsAdmin(true);
      setChecking(false);
    };
    check();
  }, [router]);

  const [keyword, setKeyword] = useState("连衣裙");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
  const [tab, setTab] = useState<"color" | "fabric" | "style" | "cut">("color");

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [outfitPlan, setOutfitPlan] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  const runPredict = async () => {
    if (!keyword.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/trend/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "预测失败");
      setResult(d.data ?? d);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    if (!keyword.trim()) return;
    setLoadingProducts(true); setError("");
    try {
      const res = await fetch("/api/trend/generate-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "获取失败");
      const list = d.products ?? d.data ?? d.hotItems ?? [];
      setProducts(list.map((p: any) => ({
        id: p.id ?? p.item_id ?? `p-${Math.random()}`,
        title: p.title ?? p.name ?? "未知商品",
        price: Number(p.price ?? p.zk_final_price ?? 0),
        image: p.image ?? p.pic_url ?? p.pict_url ?? "",
        matchSuggestion: p.matchSuggestion ?? p.match_tip ?? "",
      })));
      setOutfitPlan(d.outfitPlan ?? "");
    } catch (e: any) { setError(e.message); }
    finally { setLoadingProducts(false); }
  };

  if (checking) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );
  if (!isAdmin) return null;

  const currentData = result ? (result[tab] ?? []) : [];
  const tabs = [
    { key: "color" as const, label: "色彩趋势", icon: <Palette className="w-4 h-4" /> },
    { key: "fabric" as const, label: "面料趋势", icon: <Layers className="w-4 h-4" /> },
    { key: "style" as const, label: "款式趋势", icon: <Shirt className="w-4 h-4" /> },
    { key: "cut" as const, label: "剪裁趋势", icon: <Scissors className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 text-sm">
            <ArrowLeft className="w-4 h-4" /> 返回控制台
          </Link>
          <h1 className="text-base font-semold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> 爆款数据中心
            <span className="text-xs font-normal text-emerald-400 ml-2">● 管理后台</span>
          </h1>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* 1. 趋势预测 */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> 趋势预测
          </h2>
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="输入品类关键词，如：连衣裙"
              className="flex-1 min-w-[200px] rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-sm focus:border-indigo-500 outline-none"
            />
            <button disabled={loading} onClick={runPredict}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-sm font-medium flex items-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              预测
            </button>
          </div>
          {error && (
            <p className="mb-4 text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </p>
          )}
          {result && (
            <>
              <div className="flex gap-2 mb-6 flex-wrap">
                {tabs.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition ${
                      tab === t.key ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <h3 className="font-semibold mb-4">{tabs.find(t => t.key === tab)?.label} Top 10</h3>
                  <div className="space-y-3">
                    {currentData.slice(0, 10).map((item: TrendItem, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 text-right text-xs text-gray-500">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{item.name}</span>
                            <span className="text-xs text-gray-400">{item.score}</span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${scoreColor(item.score)}`} style={{ width: barWidth(item.score) }} />
                          </div>
                        </div>
                        <div className="w-16 text-right">{directionIcon(item.direction)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
                  <h3 className="font-semibold mb-4">趋势详情</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {currentData.slice(0, 8).map((item: TrendItem, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-gray-800/60 border border-gray-700/50">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">{item.name}</span>
                          {directionIcon(item.direction)}
                        </div>
                        <div className="text-2xl font-bold" style={{ color: item.score >= 80 ? "#10b981" : item.score >= 50 ? "#f59e0b" : "#f43f5e" }}>
                          {item.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 2. 爆款单品 + AI 搭配 */}
        <section className="border-t border-gray-800 pt-10">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> 爆款单品 + AI 搭配方案
          </h2>
          <button disabled={loadingProducts} onClick={fetchProducts}
            className="mb-6 px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-sm font-medium flex items-center gap-2">
            {loadingProducts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            生成爆款单品
          </button>
          {products.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {products.map((p, i) => (
                <div key={p.id} className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500/50 transition">
                  {p.image && <img src={p.image} alt={p.title} className="w-full h-44 object-cover" />}
                  <div className="p-4">
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{p.title}</h4>
                    <div className="text-indigo-400 font-bold">¥{p.price}</div>
                    {p.matchSuggestion && <p className="text-xs text-gray-400 mt-2">{p.matchSuggestion}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {outfitPlan && (
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" /> AI 搭配方案
              </h3>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">{outfitPlan}</pre>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

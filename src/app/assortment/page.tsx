"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Package, ExternalLink, TrendingUp } from "lucide-react";

interface PlanItem {
  id: string;
  title: string;
  season: string;
  status: string;
  categories: any[];
  total_sku: number;
  created_at: string;
}
interface Progress {
  id: string;
  title: string;
  season: string;
  items: any[];
  total_target: number;
  total_uploaded: number;
  overall_progress: number;
}

const yuan = (n: number) => (n ? (n / 100).toFixed(2) : "0");
const bandText = (b: number[] | null) => (b && b.length === 2 ? `¥${yuan(b[0])}-${yuan(b[1])}` : "—");

export default function AssortmentBoard() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, Progress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/assortment")
      .then((r) => r.json())
      .then(async (j) => {
        const list: PlanItem[] = j.success ? j.data || [] : [];
        setPlans(list);
        await Promise.all(
          list.map(async (p) => {
            try {
              const r = await fetch(`/api/public/assortment/${p.id}/progress`);
              const pr = await r.json();
              if (pr.success) {
                setProgressMap((m) => ({ ...m, [p.id]: pr.data }));
              }
            } catch {}
          })
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Layers className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-gray-800">组货方案</h1>
      </div>
      <p className="text-sm text-gray-500 mb-6">本季组货架构与上新进度，照品类上传即可。</p>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">加载中…</div>
      ) : plans.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">暂无已发布的组货方案</div>
      ) : (
        <div className="space-y-6">
          {plans.map((p) => {
            const prog = progressMap[p.id];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-800">{p.title}</h2>
                    <div className="text-xs text-gray-400 mt-1">{p.season || "全年"} · 目标 {p.total_sku} SKU · {p.categories?.length || 0} 品类</div>
                  </div>
                  {prog && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{prog.overall_progress}%</div>
                      <div className="text-xs text-gray-400">已传 {prog.total_uploaded}/{prog.total_target}</div>
                    </div>
                  )}
                </div>

                {prog && (
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${prog.overall_progress}%` }}></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {prog.items.map((it: any, idx: number) => (
                        <div key={idx} className="border border-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-800">{it.category}</span>
                            <span className="text-xs text-gray-400">{it.uploaded}/{it.target_sku} · {it.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                            <div className={`h-full ${it.progress >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${it.progress}%` }}></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              零售 {bandText(it.retail_band)} · 批发 {bandText(it.wholesale_band)}
                              {it.margin_pct != null && <span className="text-green-600"> · 毛利{it.margin_pct}%</span>}
                            </span>
                            <Link href={`/category/${encodeURIComponent(it.category)}`} className="text-primary inline-flex items-center gap-0.5 hover:underline">
                              看商品<ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          {it.wave && <div className="text-xs text-gray-400 mt-1">波段：{it.wave}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

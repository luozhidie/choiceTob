"use client";
import { useState } from "react";
import Link from "next/link";
import { Package, BarChart3 } from "lucide-react";

const SEASON_LABELS = {
  S01: "浅暖", S02: "浅暖", S03: "深暖", S04: "深暖",
  S05: "浅冷", S06: "浅冷", S07: "深冷", S08: "深冷",
  S09: "净暖", S10: "净暖", S11: "净冷", S12: "净冷",
};

const STYLE_LABELS = {
  elegant: "优雅型", romantic: "浪漫型", classic: "经典型",
  natural: "自然型", dramatic: "戏剧型", creative: "创意型",
  glamorous: "华丽型", relaxed: "松弛型", bohemian: "波西米亚",
  feminine: "女性化", vintage: "复古", street: "街头",
};

const DEFAULT_MATRIX: Record<string, any> = {
  S01: { elegant: { sku: 3, pct: 15, budget: 4500 } },
  S02: { romantic: { sku: 2, pct: 10, budget: 3000 } },
  S03: { classic: { sku: 2, pct: 10, budget: 3000 } },
  S04: { natural: { sku: 2, pct: 10, budget: 3000 } },
  S05: { dramatic: { sku: 1, pct: 5, budget: 1500 } },
  S06: { creative: { sku: 1, pct: 5, budget: 1500 } },
  S07: { glamorous: { sku: 1, pct: 5, budget: 1500 } },
  S08: { relaxed: { sku: 2, pct: 10, budget: 3000 } },
  S09: { bohemian: { sku: 1, pct: 5, budget: 1500 } },
  S10: { feminine: { sku: 2, pct: 10, budget: 3000 } },
  S11: { vintage: { sku: 1, pct: 5, budget: 1500 } },
  S12: { street: { sku: 1, pct: 5, budget: 1500 } },
};

export default function ProcurementMatrixPage() {
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);
  const [viewMode, setViewMode] = useState("table");

  let totalSku = 0, totalBudget = 0;
  Object.values(matrix).forEach((styles: any) => {
    Object.values(styles).forEach((cell: any) => {
      totalSku += cell.sku || 0;
      totalBudget += cell.budget || 0;
    });
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <Link href="/planning" className="hover:text-primary">商品企划</Link>
            <span>/</span>
            <span className="text-primary font-medium">货盘组合</span>
          </nav>
        </div>
      </div>

      <section className="bg-gradient-to-r from-primary to-accent text-white py-12">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm mb-4">
            <Package className="w-4 h-4" /> 96格矩阵 · 货盘组合可视化
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">货盘组合规划</h1>
          <p className="text-white/70 text-sm">
            基于色彩季型 × 风格维度的96格矩阵，可视化你的货盘SKU分布与预算分配
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">总SKU数</p>
              <p className="text-3xl font-bold text-primary">{totalSku}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">总预算（元）</p>
              <p className="text-3xl font-bold text-accent">¥{totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <p className="text-xs text-gray-500 mb-1">矩阵覆盖率</p>
              <p className="text-3xl font-bold text-green-600">
                {Math.round(Object.keys(matrix).length / 12 * 100)}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-primary">96格矩阵详情</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  viewMode === "table" ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"
                }`}
              >表格视图</button>
              <button
                onClick={() => setViewMode("chart")}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  viewMode === "chart" ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200"
                }`}
              >图表视图</button>
            </div>
          </div>

          {viewMode === "table" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <th className="px-4 py-3 text-left">色彩季型</th>
                    {Object.keys(STYLE_LABELS).map(style => (
                      <th key={style} className="px-4 py-3 text-center">{STYLE_LABELS[style]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SEASON_LABELS).map(([key, label], idx) => (
                    <tr key={key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 font-medium text-primary">{label}</td>
                      {Object.keys(STYLE_LABELS).map(style => {
                        const cell = matrix[key]?.[style] || { sku: 0, pct: 0, budget: 0 };
                        return (
                          <td key={style} className="px-4 py-3 text-center">
                            {cell.sku > 0 ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="font-bold text-primary">{cell.sku} SKU</span>
                                <span className="text-xs text-gray-400">{cell.pct}%</span>
                                <span className="text-xs text-accent">¥{cell.budget.toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === "chart" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-sm font-bold text-primary mb-4">SKU分布条形图</h3>
              <div className="space-y-3">
                {Object.entries(SEASON_LABELS).map(([season, label]) => {
                  const seasonTotal = Object.values(matrix[season] || {}).reduce((s: number, c: any) => s + (c.sku || 0), 0);
                  const maxSku = 5;
                  return (
                    <div key={season} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-16 shrink-0">{label}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, (seasonTotal / maxSku) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">{seasonTotal} SKU</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="pb-12">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <button
            className="px-8 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:bg-accent/90 transition-colors"
            onClick={() => alert("采购清单生成功能开发中，请联系客服")}
          >
            📦 生成采购清单
          </button>
          <p className="text-xs text-gray-400 mt-2">
            基于当前矩阵生成采购订单，可导出Excel
          </p>
        </div>
      </section>
    </div>
  );
}

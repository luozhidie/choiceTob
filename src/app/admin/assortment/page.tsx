"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Package, TrendingUp, Loader2, AlertTriangle, CheckCircle2,
  BarChart3, ShoppingCart, ArrowRight, Sparkles,
} from "lucide-react";

const SEASONS = ["春夏", "夏秋", "秋冬", "冬春"];

export default function AssortmentPage() {
  const [storeId, setStoreId] = useState("");
  const [season, setSeason] = useState("秋冬");
  const [budget, setBudget] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");
  const [stores, setStores] = useState<any[]>([]);

  const supabase = createClient();

  // 加载店铺列表
  useState(() => {
    supabase.from("stores").select("id, name").eq("status", "active").order("name")
      .then(({ data }) => setStores(data || []));
  });

  const handleGenerate = async () => {
    if (!storeId || !season) {
      setError("请选择店铺和季节");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const resp = await fetch("/api/store/assortment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, season, budget: budget ? parseInt(budget) : undefined, keyword }),
      });
      const data = await resp.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const report = result?.report;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Package className="w-6 h-6 text-accent" />
            货盘规划
          </h1>
          <p className="text-muted-foreground mt-1">基于VIP画像+爆款数据+库存现状，生成精准货盘方案，减少库存积压</p>
        </div>

        {/* 输入区 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">店铺 *</label>
              <select value={storeId} onChange={e => setStoreId(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                <option value="">选择店铺</option>
                {stores.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">季节 *</label>
              <select value={season} onChange={e => setSeason(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">采购预算（选填）</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="如 100000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">关键词（选填）</label>
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="如 韩系女装" />
            </div>
          </div>
          <button onClick={handleGenerate} disabled={loading || !storeId}
            className="mt-4 btn-primary flex items-center gap-2 px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "生成中（约30秒）..." : "生成货盘方案"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-600">{error}</div>
        )}

        {/* 数据源信息 */}
        {result?.dataSources && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4">
              <div className="text-xs text-gray-500">VIP客户</div>
              <div className="text-2xl font-bold text-primary">{result.dataSources.vipCount}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-xs text-gray-500">市场爆款</div>
              <div className="text-2xl font-bold text-orange-500">{result.dataSources.trendItems}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-xs text-gray-500">库存SKU</div>
              <div className="text-2xl font-bold text-blue-500">{result.dataSources.inventorySKUs}</div>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <div className="text-xs text-gray-500">动销率</div>
              <div className="text-2xl font-bold text-green-500">{result.dataSources.inventorySellThrough}%</div>
            </div>
          </div>
        )}

        {/* 方案结果 */}
        {report && (
          <div className="space-y-6">
            {/* 概要 */}
            {report.summary && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-primary mb-3">货盘规划概要</h2>
                <p className="text-gray-700">{report.summary}</p>
              </div>
            )}

            {/* 品类结构 */}
            {report.assortmentStructure?.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />品类货盘结构
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-2 text-xs text-gray-500">品类</th>
                        <th className="text-left px-4 py-2 text-xs text-gray-500">占比</th>
                        <th className="text-left px-4 py-2 text-xs text-gray-500">建议SKU数</th>
                        <th className="text-left px-4 py-2 text-xs text-gray-500">策略</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.assortmentStructure.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-medium text-primary">{item.category}</td>
                          <td className="px-4 py-3"><span className="text-accent font-bold">{item.ratio}</span></td>
                          <td className="px-4 py-3">{item.skuCount}</td>
                          <td className="px-4 py-3 text-gray-600">{item.strategy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 颜色配比 */}
            {report.colorAssortment?.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-primary mb-4">颜色配比</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {report.colorAssortment.map((item: any, i: number) => (
                    <div key={i} className="border rounded-lg p-3">
                      <div className="font-medium text-primary">{item.colorGroup}</div>
                      <div className="text-accent font-bold">{item.ratio}</div>
                      <div className="text-xs text-gray-500 mt-1">{item.colors?.join("、")}</div>
                      <div className="text-xs text-gray-400 mt-1">{item.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 深度建议 */}
            {report.depthAdvice?.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-primary mb-4">货盘深度建议（每款几色几码）</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-2 text-xs text-gray-500">品类</th>
                        <th className="text-left px-4 py-2 text-xs text-gray-500">款式深度</th>
                        <th className="text-left px-4 py-2 text-xs text-gray-500">颜色深度</th>
                        <th className="text-left px-4 py-2 text-xs text-gray-500">尺码深度</th>
                        <th className="text-left px-4 py-2 text-xs text-gray-500">原因</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {report.depthAdvice.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-medium text-primary">{item.category}</td>
                          <td className="px-4 py-3">{item.deepStyles}款</td>
                          <td className="px-4 py-3">{item.deepColors}色</td>
                          <td className="px-4 py-3">{item.deepSizes}码</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 库存操作建议 */}
            {report.inventoryActions?.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-accent" />库存操作建议
                </h2>
                <div className="space-y-2">
                  {report.inventoryActions.map((item: any, i: number) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
                      item.action === "补货" ? "bg-green-50" : item.action === "清仓" ? "bg-red-50" : "bg-yellow-50"
                    }`}>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.action === "补货" ? "bg-green-200 text-green-800" :
                        item.action === "清仓" ? "bg-red-200 text-red-800" :
                        "bg-yellow-200 text-yellow-800"
                      }`}>{item.action}</span>
                      <span className="font-medium text-primary">{item.category}</span>
                      <span className="text-sm text-gray-600 flex-1">{item.reason}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        item.urgency === "高" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                      }`}>{item.urgency}优先</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 核心款推荐 */}
            {report.trendingItems?.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />爆款核心款推荐
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.trendingItems.map((item: any, i: number) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-accent text-white text-xs flex items-center justify-center">{i + 1}</span>
                        <span className="font-bold text-primary">{item.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>品类：{item.category} | 建议定价：{item.price}</div>
                        <div className="text-accent">{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 风险提示 */}
            {report.riskWarnings?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h2 className="text-lg font-bold text-amber-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />风险提示
                </h2>
                <ul className="space-y-2">
                  {report.riskWarnings.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                      <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5" />{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!loading && !result && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">选择店铺和季节，生成基于真实数据的货盘规划方案</p>
            <p className="text-xs text-gray-400 mt-2">数据源：VIP画像 + 市场爆款 + 库存现状</p>
          </div>
        )}
      </div>
    </div>
  );
}

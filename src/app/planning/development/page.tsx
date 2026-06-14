"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Package, Truck, BarChart3, CheckCircle2 } from "lucide-react";

export default function DevelopmentDirectionPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    try {
      // 1. 调用趋势预测 API
      const trendRes = await fetch("/api/trend/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const trendData = await trendRes.json();

      // 2. 调用商品企划 API
      const planRes = await fetch("/api/generate-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword,
          market_style: "",
          color_pref: "",
          store_type: "buyer",
          season: "春夏",
        }),
      });
      const planData = await planRes.json();

      setResult({
        keyword,
        trend: trendData,
        plan: planData,
        generated_at: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProcurement = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const res = await fetch("/api/plan/generate-procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: result.keyword,
          trend_data: result.trend,
          plan_data: result.plan,
        }),
      });
      const data = await res.json();
      setResult((prev: any) => ({ ...prev!, procurement: data }));
    } catch (err: any) {
      setError(err.message || "生成采购清单失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-1.5 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary">首页</Link>
            <span>/</span>
            <Link href="/planning" className="hover:text-primary">商品企划</Link>
            <span>/</span>
            <span className="text-primary font-medium">开发方向判断</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-accent text-white py-12 md:py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm mb-4">
            <BarChart3 className="w-4 h-4" /> 开发方向判断
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-3">AI 驱动的商品开发决策</h1>
          <p className="text-white/70 text-sm mb-6">基于趋势预测 + 企划分析，自动判断开发方向、货盘组合、采购建议</p>

          {/* 搜索框 */}
          <div className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              placeholder="输入品类关键词，如：连衣裙、西装外套..."
              className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-900 bg-white shadow-lg focus:outline-none"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? "分析中..." : "开始分析"}
            </button>
          </div>
        </div>
      </section>

      {/* 结果区 */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-4xl">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* 趋势摘要 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-primary mb-4">📊 趋势预测摘要</h2>
                <p className="text-sm text-gray-500 mb-4">关键词：<span className="font-medium text-primary">{result.keyword}</span></p>

                {result.trend?.colors && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">推荐开发色彩</h3>
                      <div className="space-y-1">
                        {(result.trend.colors || []).slice(0, 5).map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{c.name || c.key}</span>
                            <span className="text-accent font-bold">{c.score || c.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">推荐开发面料</h3>
                      <div className="space-y-1">
                        {(result.trend.fabrics || []).slice(0, 5).map((f: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{f.name || f.key}</span>
                            <span className="text-accent font-bold">{f.score || f.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 开发方向建议 */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-primary mb-4">🎯 开发方向建议</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">重点开发色彩</p>
                      <p className="text-xs text-green-600 mt-0.5">
                        {(result.trend?.colors || []).slice(0, 3).map((c: any) => c.name || c.key).join("、") || "待分析"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">货盘组合建议</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        建议 {result.keyword} 占整体货盘 40-50%，搭配 30% 上下装、20% 配饰
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleGenerateProcurement}
                  disabled={loading}
                  className="px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "生成中..." : "📦 生成采购清单"}
                </button>
                <Link
                  href="/trend-predict"
                  className="px-6 py-3 border border-gray-200 text-primary text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                >
                  查看详细趋势 →
                </Link>
              </div>

              {/* 采购清单结果 */}
              {result.procurement && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-lg font-bold text-primary mb-4">📦 采购清单建议</h2>
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                    {JSON.stringify(result.procurement, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {!result && !loading && (
            <div className="text-center py-16">
              <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400">输入品类关键词，开始开发方向分析</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

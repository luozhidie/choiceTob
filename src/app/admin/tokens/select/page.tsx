"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, Tag, Network } from "lucide-react";

const DOMAINS = ["服装", "金融", "股票", "艺术", "其他"];

export default function TokenSelectPage() {
  const [domain, setDomain] = useState("服装");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [usedTokens, setUsedTokens] = useState<string[]>([]);
  const [depTokens, setDepTokens] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!product.trim()) { setError("请粘贴候选商品信息"); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    setUsedTokens([]);
    setDepTokens([]);
    try {
      const res = await fetch("/api/admin/tokens/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ domain, product }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "调用失败");
      } else {
        setResult(data.result);
        setUsedTokens(data.usedTokens || []);
        setDepTokens(data.depTokens || []);
      }
    } catch (e: any) {
      setError(e.message || "调用异常");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">AI 选品判断</h1>
        <p className="text-muted-foreground mt-1">AI 按你在该行业沉淀的「选品判断词源」评估候选商品，给出 推荐 / 观望 / 放弃</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-primary">行业</label>
          <select value={domain} onChange={(e) => setDomain(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">候选商品信息</label>
          <textarea value={product} onChange={(e) => setProduct(e.target.value)} rows={7}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono resize-none"
            placeholder={"粘贴候选商品的要点，例如：\n品名：法式碎花连衣裙\n价格：168\n客群：25-35职场女性\n风格：温柔法式\n面料：聚酯纤维\n卖点：显瘦、通勤可穿\n风险：易皱"} />
        </div>

        <button onClick={run} disabled={loading || !product.trim()}
          className="btn-primary flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "AI 评估中…" : "开始判断"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-4 flex items-start gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-primary">评估结论</h3>
            {usedTokens.length > 0 && (
              <span className="text-xs text-gray-400">主词源 {usedTokens.length} 条{depTokens.length > 0 ? ` · 组合调用子词源 ${depTokens.length} 条` : ""}</span>
            )}
          </div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{result}</div>
          {usedTokens.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> 本次依据的主词源</p>
              <div className="flex flex-wrap gap-2">
                {usedTokens.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
          {depTokens.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Network className="w-3.5 h-3.5" /> 被组合调用的子词源（跨词元编排）</p>
              <div className="flex flex-wrap gap-2">
                {depTokens.map((t, i) => (
                  <span key={i} className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Loader2, Sparkles, Copy } from "lucide-react";

const SERVICES = [
  { key: "outfit", label: "AI搭配", icon: "👗" },
  { key: "plan", label: "商品企划", icon: "📋" },
  { key: "buyer_group", label: "买手组货", icon: "🛒" },
  { key: "display", label: "陈列搭配", icon: "🪟" },
  { key: "marketing", label: "营销策划", icon: "📣" },
  { key: "sales", label: "销售服务", icon: "💡" },
  { key: "brand", label: "品牌管理", icon: "⭐" },
  { key: "design", label: "服装设计", icon: "✏️" },
];

export default function FashionStylistPage() {
  const [service, setService] = useState("outfit");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    try {
      const res = await fetch("/api/ai/fashion-stylist");
      if (res.ok) {
        const d = await res.json();
        if (d.records) setHistory(d.records);
      }
    } catch {
      // ignore
    }
  };

  const submit = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("/api/ai/fashion-stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType: service,
          service: SERVICES.find((s) => s.key === service)?.label,
          input,
        }),
      });
      const d = await res.json();
      if (d.error) {
        alert(d.error);
        setLoading(false);
        return;
      }
      setResult(d.result || "");
      loadHistory();
    } catch {
      alert("网络错误");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (result && navigator.clipboard) navigator.clipboard.writeText(result);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-primary mb-1 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" /> 时尚AI助手
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          AI搭配 / 商品企划 / 买手组货 / 陈列搭配 / 营销策划 / 销售服务 / 品牌管理 / 服装设计
        </p>

        {/* 服务选择 */}
        <div className="flex flex-wrap gap-2 mb-5">
          {SERVICES.map((s) => (
            <button
              key={s.key}
              onClick={() => setService(s.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                service === s.key
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-primary"
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* 输入 */}
        <div className="fashion-card p-6 mb-6">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={5}
            placeholder="描述你的需求，例如：为25-35岁职场女性做秋季通勤胶囊衣橱，预算2000元，偏好极简风"
            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <button
            onClick={submit}
            disabled={loading}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "生成中..." : "生成方案"}
          </button>
        </div>

        {/* 结果 */}
        {result && (
          <div className="fashion-card p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-primary">生成结果</h2>
              <button
                onClick={copy}
                className="text-xs px-3 py-1 rounded-full border border-accent text-accent font-medium hover:bg-accent/10"
              >
                复制
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans">
              {result}
            </pre>
          </div>
        )}

        {/* 历史 */}
        {history.length > 0 && (
          <div className="fashion-card p-6">
            <h2 className="font-bold text-primary mb-3">历史记录</h2>
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{h.service}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(h.created_at).toLocaleString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{h.input_json?.input}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

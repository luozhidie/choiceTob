"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Sparkles, Trash2, Loader2, TrendingUp, TrendingDown } from "lucide-react";

const MARKETS = [
  { value: "hk", label: "港股" },
  { value: "us", label: "美股" },
  { value: "jp", label: "日股" },
  { value: "a", label: "A股" },
];

const SECTORS = ["上游纺织", "中游制造", "下游品牌零售", "电商渠道", "其他"];

export default function StockMonitorPage() {
  const [list, setList] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [form, setForm] = useState({ symbol: "", name: "", market: "hk", sector: "下游品牌零售" });
  const [error, setError] = useState("");
  const [diag, setDiag] = useState<any>(null);

  const loadList = useCallback(async () => {
    setError("");
    setDiag(null);
    try {
      const r = await fetch("/api/finance/watchlist", { credentials: "include" });
      const d = await r.json().catch(() => ({}));
      // 后端返回 { ok:false, error } 或 HTTP 非 200 → 必须现形，不能吞掉
      if (!r.ok || d.error || d.ok === false) {
        setError((d.error || ("HTTP " + r.status)) + (d.mode ? "（模式：" + d.mode + "）" : ""));
        setList([]);
        return;
      }
      const records = d.records || [];
      setList(records);
      // 仍为空：兜底调一次 seed
      if (records.length === 0) {
        try {
          const s = await fetch("/api/finance/seed", { method: "POST", credentials: "include" });
          const sd = await s.json().catch(() => ({}));
          if (sd.seeded) {
            const r2 = await fetch("/api/finance/watchlist", { credentials: "include" });
            const d2 = await r2.json().catch(() => ({}));
            setList(d2.records || []);
          }
        } catch {}
      }
    } catch (e: any) {
      setError("请求异常：" + (e?.message || String(e)));
    }
  }, []);

  const runDiagnose = useCallback(async () => {
    setError("");
    try {
      const r = await fetch("/api/finance/diagnose", { credentials: "include" });
      const d = await r.json().catch(() => ({}));
      setDiag(d);
    } catch (e: any) {
      setError("诊断请求异常：" + (e?.message || String(e)));
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/finance/quote", { method: "POST", credentials: "include" });
      const d = await r.json();
      const map: Record<string, any> = {};
      (d.quotes || []).forEach((q: any) => { if (q.symbol) map[q.symbol] = q; });
      setQuotes(map);
    } finally {
      setLoading(false);
    }
  };

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const r = await fetch("/api/finance/quote", { method: "PUT", credentials: "include" });
      const d = await r.json();
      if (d.analysis) setAnalysis(d.analysis); else alert(d.error || "分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const addItem = async () => {
    if (!form.symbol || !form.name) { alert("请填代码和名称"); return; }
    const r = await fetch("/api/finance/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!r.ok) { alert(d.error || "添加失败"); return; }
    setForm({ symbol: "", name: "", market: "hk", sector: "下游品牌零售" });
    loadList();
  };

  const delItem = async (id: string) => {
    if (!confirm("删除该标的？")) return;
    await fetch("/api/finance/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    loadList();
  };

  const cell = (l: any) => {
    const q = quotes[l.symbol] || {};
    const pct = q.changePct;
    const up = pct != null && pct >= 0;
    return (
      <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="font-medium text-primary">{l.name} <span className="text-xs text-muted-foreground">{l.symbol}</span></div>
          <div className="text-xs text-muted-foreground mt-0.5">{l.sector}</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">
            {q.price != null ? q.price : "—"}
            {q.currency && <span className="text-xs font-normal text-muted-foreground ml-1">{q.currency}</span>}
          </div>
          <div className={`text-sm flex items-center justify-end gap-1 ${up ? "text-emerald-600" : "text-rose-600"}`}>
            {pct != null ? (up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />) : null}
            {pct != null ? `${pct > 0 ? "+" : ""}${pct}%` : (q.error ? "拉取失败" : "未刷新")}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><TrendingUp className="w-6 h-6 text-accent" /> 服装行业股票监控</h1>
        <button onClick={loadList} className="btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4" />刷新清单</button>
        <button onClick={runDiagnose} className="btn-secondary flex items-center gap-2"><TrendingUp className="w-4 h-4" />诊断</button>
        <button onClick={refreshAll} disabled={loading} className="btn-secondary flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}刷新行情
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 mb-4 text-sm">
          <div className="font-semibold mb-1">⚠️ 加载出错</div>
          <div className="break-all">{error}</div>
          <div className="mt-2 text-rose-500">点「诊断」查看详情，把诊断结果发我即可定位。</div>
        </div>
      )}

      {diag && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 mb-4 text-xs font-mono whitespace-pre-wrap break-all">
          {JSON.stringify(diag, null, 2)}
        </div>
      )}
      <p className="text-sm text-muted-foreground mb-5">观察服装全产业链（上游纺织 / 中游制造 / 下游品牌）港股美股行情与财务，辅助判断行业景气度。数据来自 Yahoo（免 token）。阶段2 再接 A股(Tushare)与量化下单。</p>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-primary mb-1">代码</label>
            <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="2020.HK" />
          </div>
          <div>
            <label className="block text-xs font-medium text-primary mb-1">名称</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" placeholder="安踏体育" />
          </div>
          <div>
            <label className="block text-xs font-medium text-primary mb-1">市场</label>
            <select value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              {MARKETS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary mb-1">环节</label>
            <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={addItem} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />添加</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-primary">监控清单（{list.length}）</h2>
        <button onClick={analyze} disabled={analyzing} className="btn-secondary flex items-center gap-2">
          {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}全行业 AI 解读
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {list.map((l) => (
          <div key={l.id} className="relative">
            {cell(l)}
            <button onClick={() => delItem(l.id)} className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {list.length === 0 && <p className="text-muted-foreground text-sm col-span-2">清单为空。先点「刷新清单」，仍为空请点「诊断」并把结果发我。</p>}
      </div>

      {analysis && (
        <div className="bg-accent/5 border border-accent/20 rounded-2xl p-6">
          <h3 className="text-base font-bold text-primary mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> 行业景气度 AI 研判</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{analysis}</div>
        </div>
      )}
    </div>
  );
}

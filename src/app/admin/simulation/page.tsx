"use client";

import { useState, useEffect, useCallback } from "react";
import { Activity, RefreshCw, Loader2 } from "lucide-react";

export default function SimulationPage() {
  const [state, setState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/finance/signal", { credentials: "include" });
      const d = await r.json();
      if (!r.ok || d.error) {
        setError(d.error || "HTTP " + r.status);
        setState(null);
      } else {
        setState(d);
      }
    } catch (e: any) {
      setError("请求异常：" + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const r = await fetch("/api/finance/signal", { method: "POST", credentials: "include" });
      const d = await r.json();
      if (!r.ok || d.error) {
        setError(d.error || "运行失败");
      } else {
        setState((s: any) => ({
          ...s,
          signals: d.signals,
          trades: [...(d.trades || []), ...(s?.trades || [])],
        }));
      }
    } catch (e: any) {
      setError("请求异常：" + (e?.message || String(e)));
    } finally {
      setRunning(false);
    }
  };

  const positions = state?.positions || [];
  const signals = state?.signals || [];
  const trades = state?.trades || [];
  const totalPnl = positions.reduce((a: number, p: any) => a + (p.pnl || 0), 0);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Activity className="w-6 h-6 text-accent" /> 模拟交易（纸面）</h1>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} className="btn-secondary flex items-center gap-2"><RefreshCw className="w-4 h-4" />刷新</button>
          <button onClick={run} disabled={running} className="btn-primary flex items-center gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}运行策略
          </button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-5">纸面交易，虚拟资金，不实盘、无资金风险。信号由均线/RSI/动量规则生成，可回测。定时任务（Vercel Cron）盘后自动运行，也可手动点「运行策略」。</p>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 mb-4 text-sm">{error}</div>
      )}

      {/* 持仓 + 总盈亏 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-primary">模拟持仓（{positions.length}）</h2>
          <div className={`text-sm font-semibold ${totalPnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            总盈亏 {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)}
          </div>
        </div>
        {positions.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无持仓。点「运行策略」触发买入信号后会出现。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2">标的</th><th>数量</th><th>成本价</th><th>现价</th><th>盈亏</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((p: any) => (
                  <tr key={p.symbol} className="border-b border-gray-50">
                    <td className="py-2 font-medium">{p.symbol}</td>
                    <td>{p.qty}</td>
                    <td>{p.avg_cost != null ? p.avg_cost.toFixed(2) : "—"}</td>
                    <td>{p.current_price != null ? p.current_price.toFixed(2) : "—"}</td>
                    <td className={p.pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {p.pnl != null ? (p.pnl >= 0 ? "+" : "") + p.pnl.toFixed(2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 最新信号 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <h2 className="text-lg font-bold text-primary mb-3">最新信号（{signals.length}）</h2>
        {signals.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无信号。点「运行策略」生成。</p>
        ) : (
          <div className="space-y-2">
            {signals.map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                <div>
                  <span className="font-medium">{s.name || s.symbol}</span>
                  <span className="text-xs text-muted-foreground ml-2">{s.symbol}</span>
                  {s.score != null && <span className="text-xs text-muted-foreground ml-2">score {s.score}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${s.signal === "买入" ? "bg-emerald-50 text-emerald-600" : s.signal === "卖出" ? "bg-rose-50 text-rose-600" : "bg-gray-50 text-gray-500"}`}>{s.signal}</span>
                  <span className="text-xs text-muted-foreground w-44 truncate">{s.reason}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 成交记录 */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <h2 className="text-lg font-bold text-primary mb-3">成交记录（{trades.length}）</h2>
        {trades.length === 0 ? (
          <p className="text-muted-foreground text-sm">暂无成交。</p>
        ) : (
          <div className="space-y-1 text-sm">
            {trades.map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-50 pb-1">
                <span>{t.symbol} · {t.side === "buy" ? "买入" : "卖出"} · {t.qty}股</span>
                <span className="text-muted-foreground">{t.price != null ? t.price.toFixed(2) : "—"} · {new Date(t.created_at).toLocaleString("zh-CN")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

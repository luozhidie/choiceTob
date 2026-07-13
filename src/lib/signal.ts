// 模拟交易信号：策略核心逻辑（与 HTTP 路由解耦，供手动/定时/回测复用）
import type { OrderExecutor } from "./broker/types";
import { FutuBrokerExecutor } from "./broker/futu";

// 拉历史日K（Yahoo，A股转 .SS/.SZ 后缀），返回收盘价与成交量
export async function fetchYahooHistory(symbol: string) {
  const ySymbol = symbol.replace(/\.SH$/i, ".SS").replace(/\.SZ$/i, ".SZ");
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=1d&range=6mo`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("Yahoo_HTTP_" + res.status);
  const d = await res.json();
  const quote = d?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
  const closes = (quote?.close || []).filter((x: any) => x != null);
  const volumes = (quote?.volume || []).filter((x: any) => x != null);
  return { closes, volumes };
}

export function ma(closes: number[], n: number) {
  if (closes.length < n) return null;
  const slice = closes.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / n;
}

export function rsi(closes: number[], n = 14) {
  if (closes.length < n + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - n; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgG = gains / n, avgL = losses / n;
  if (avgL === 0) return 100;
  return 100 - 100 / (1 + avgG / avgL);
}

// 规则阈值（来自 signal_rules，带默认值）
export interface RuleThresholds {
  maShort: number;
  maLong: number;
  maTrend: number;
  rsiBuyMin: number;
  rsiBuyMax: number;
  rsiSell: number;
  volRatio: number;
  stopLoss: number;
  trailingStop: number;
}

export async function readRule(supabase: any): Promise<RuleThresholds> {
  const { data: rules } = await supabase.from("signal_rules").select("*").eq("enabled", true).order("created_at").limit(1);
  const r = rules && rules[0] ? rules[0] : {};
  return {
    maShort: r.ma_short || 5,
    maLong: r.ma_long || 20,
    maTrend: r.ma_trend || 60,
    rsiBuyMin: r.rsi_buy_min ?? 40,
    rsiBuyMax: r.rsi_buy_max ?? 70,
    rsiSell: r.rsi_sell ?? 75,
    volRatio: r.vol_ratio ?? 1.2,
    stopLoss: r.stop_loss ?? 0.08,
    trailingStop: r.trailing_stop ?? 0.05,
  };
}

// 在「截至第 i 根（含）」的部分序列上评估信号（实时信号与回测共用，避免规则漂移）
export function evaluateSignal(closes: number[], volumes: number[], i: number, rule: RuleThresholds) {
  const cs = closes.slice(0, i + 1);
  const ma5 = ma(cs, rule.maShort);
  const ma20 = ma(cs, rule.maLong);
  const ma60 = ma(cs, rule.maTrend);
  if (ma5 == null || ma20 == null) return { signal: "持有", reason: "数据不足" };
  const r = rsi(cs, 14);
  const price = closes[i];
  const momentum = i >= 1 ? ((closes[i] - closes[i - 1]) / closes[i - 1]) * 100 : 0;

  // 量比：当日量 / 近 20 日均量
  let volRatioNow = 1;
  if (volumes.length >= i + 1 && i >= 20) {
    const vToday = volumes[i];
    const vAvg = volumes.slice(i - 20, i).reduce((a: number, b: number) => a + b, 0) / 20;
    volRatioNow = vAvg ? vToday / vAvg : 1;
  }

  const goldenCross = ma5 > ma20;
  const midTrendUp = ma60 != null && ma20 > ma60;
  const rsiOk = r == null || (r >= rule.rsiBuyMin && r <= rule.rsiBuyMax);

  let signal = "持有", reason = "无触发";
  if (goldenCross && midTrendUp && rsiOk && momentum > 0 && volRatioNow >= rule.volRatio) {
    signal = "买入";
    reason = `MA${rule.maShort}金叉+站上MA${rule.maTrend}趋势+放量`;
  } else if (ma5 < ma20 || (r != null && r > rule.rsiSell)) {
    signal = "卖出";
    reason = ma5 < ma20 ? "MA死叉" : `RSI超买${r.toFixed(0)}`;
  }
  const score = Math.round((ma5 / ma20 - 1) * 1000) / 10;
  return { signal, reason, price, ma5, ma20, ma60, r, momentum, volRatioNow, score };
}

// 运行一轮策略（实时）：算指标 → 生成信号 → 模拟成交（纸面，不实盘）
export async function runStrategy(supabase: any) {
  const rule = await readRule(supabase);
  const executor = getExecutor(supabase);
  const { data: list } = await supabase.from("stock_watchlist").select("*");
  if (!list || list.length === 0) return { signals: [], trades: [], error: "监控清单为空" };

  const signals: any[] = [];
  const trades: any[] = [];

  async function processOne(item: any) {
    try {
      const { closes, volumes } = await fetchYahooHistory(item.symbol);
      if (closes.length < rule.maTrend + 1) {
        signals.push({ symbol: item.symbol, name: item.name, signal: "持有", reason: "历史数据不足" });
        return;
      }
      const i = closes.length - 1;
      const e = evaluateSignal(closes, volumes, i, rule);
      const { data: pos } = await supabase.from("paper_positions").select("*").eq("symbol", item.symbol).single();
      const qty = 100;
      const currentPeak = pos && pos.qty > 0 ? Math.max(pos.peak_price || 0, e.price) : e.price;
      const hitEntryStop = pos && pos.qty > 0 && pos.avg_cost != null && e.price < pos.avg_cost * (1 - rule.stopLoss);
      const hitTrailingStop = pos && pos.qty > 0 && currentPeak > 0 && e.price < currentPeak * (1 - rule.trailingStop);

      let signal = e.signal, reason = e.reason;
      if (signal === "买入" && (!pos || pos.qty === 0)) {
        await executor.recordTrade({ symbol: item.symbol, side: "buy", price: e.price, qty, source: "rule", note: reason });
        const newQty = (pos?.qty || 0) + qty;
        const newAvg = pos?.qty ? ((pos.qty * pos.avg_cost) + qty * e.price) / newQty : e.price;
        await executor.setPosition({ symbol: item.symbol, qty: newQty, avg_cost: newAvg, peak_price: e.price, updated_at: new Date().toISOString() });
        trades.push({ symbol: item.symbol, side: "buy", price: e.price, qty });
      } else if ((signal === "卖出" || hitEntryStop || hitTrailingStop) && pos && pos.qty > 0) {
        const sellQty = Math.min(qty, pos.qty);
        const note = hitTrailingStop ? `移动止盈-${Math.round(rule.trailingStop * 100)}%` : hitEntryStop ? `止损-${Math.round(rule.stopLoss * 100)}%` : reason;
        await executor.recordTrade({ symbol: item.symbol, side: "sell", price: e.price, qty: sellQty, source: hitTrailingStop ? "trailing" : hitEntryStop ? "stop" : "rule", note });
        await executor.setPosition({ symbol: item.symbol, qty: pos.qty - sellQty, avg_cost: pos.avg_cost, peak_price: currentPeak, updated_at: new Date().toISOString() });
        trades.push({ symbol: item.symbol, side: "sell", price: e.price, qty: sellQty });
        if (signal === "买入") { signal = "持有"; reason = "持仓中，忽略新买点"; }
      } else if (pos && pos.qty > 0) {
        // 持仓中未触发卖出：更新最高点（用于移动止盈）
        await executor.setPosition({ symbol: item.symbol, qty: pos.qty, avg_cost: pos.avg_cost, peak_price: currentPeak, updated_at: new Date().toISOString() });
      }
      signals.push({ symbol: item.symbol, name: item.name, signal, reason, score: e.score, price: e.price });

      await supabase.from("stock_snapshots").upsert({ symbol: item.symbol, price: e.price, change_pct: e.momentum, updated_at: new Date().toISOString() }, { onConflict: "symbol" });
      await supabase.from("signal_calc").insert({ symbol: item.symbol, price: e.price, ma5: e.ma5, ma20: e.ma20, rsi: e.r, momentum: e.momentum, score: e.score, signal });
    } catch (err: any) {
      signals.push({ symbol: item.symbol, name: item.name, signal: "错误", reason: err.message });
    }
  }

  const BATCH = 8;
  for (let i = 0; i < list.length; i += BATCH) {
    await Promise.all(list.slice(i, i + BATCH).map(processOne));
  }
  return { signals, trades };
}

// 回测：用过去半年真实日K，逐日回放同一套规则，统计胜率/收益/回撤
export async function runBacktest(supabase: any) {
  const rule = await readRule(supabase);
  const { data: list } = await supabase.from("stock_watchlist").select("*");
  if (!list || list.length === 0) return { error: "监控清单为空" };

  const perStock: any[] = [];
  const portfolioEquity: number[] = []; // 按日对齐的权益曲线（多股求和）
  let totalSells = 0, totalWins = 0, totalPnl = 0, totalCapital = 0;

  async function backtestOne(item: any) {
    try {
      const { closes, volumes } = await fetchYahooHistory(item.symbol);
      if (closes.length < rule.maTrend + 1) {
        perStock.push({ symbol: item.symbol, name: item.name, status: "数据不足", trades: 0, winRate: 0, pnl: 0, returnPct: 0, maxDD: 0 });
        return;
      }
      const qty = 100;
      let posQty = 0, posCost = 0, realized = 0, posPeak = 0;
      const trades: any[] = [];
      const equity: number[] = [];
      let cap = 0; // 该标的投入本金（全部买入名义金额），作为权益基线，避免回撤>100%
      let peak = 0, maxDD = 0;

      for (let i = rule.maTrend; i < closes.length; i++) {
        const e = evaluateSignal(closes, volumes, i, rule);
        const buy = e.signal === "买入" && posQty === 0;
        if (posQty > 0) posPeak = Math.max(posPeak, e.price);
        const hitEntryStop = posQty > 0 && posCost != null && e.price < posCost * (1 - rule.stopLoss);
        const hitTrailingStop = posQty > 0 && posPeak > 0 && e.price < posPeak * (1 - rule.trailingStop);
        const sell = (e.signal === "卖出" || hitEntryStop || hitTrailingStop) && posQty > 0;

        if (buy) {
          posQty = qty; posCost = e.price; posPeak = e.price;
          trades.push({ day: i, side: "buy", price: e.price });
          cap += e.price * qty;
          totalCapital += e.price * qty;
        } else if (sell) {
          const pnl = (e.price - posCost) * posQty;
          realized += pnl;
          const reason = hitTrailingStop ? "trailing" : hitEntryStop ? "stop" : "rule";
          trades.push({ day: i, side: "sell", price: e.price, pnl, reason });
          posQty = 0; posCost = 0; posPeak = 0;
        }
        const unrealized = posQty * (e.price - posCost); // 持仓浮动盈亏
        const eq = cap + realized + unrealized; // 权益 = 投入本金 + 已实现盈亏 + 浮动盈亏
        equity.push(eq);
      }

      const lastPrice = closes[closes.length - 1];
      const finalPnl = realized + posQty * (lastPrice - posCost); // 累计盈亏（可正可负）
      const finalEq = equity.length ? equity[equity.length - 1] : cap; // 终值权益 = 本金 + 盈亏
      for (const v of equity) {
        peak = Math.max(peak, v);
        if (peak > 0) maxDD = Math.max(maxDD, (peak - v) / peak);
      }
      const sells = trades.filter((t) => t.side === "sell");
      const wins = sells.filter((t) => (t.pnl || 0) > 0).length;
      const capital = trades.filter((t) => t.side === "buy").reduce((a, t) => a + t.price * qty, 0);
      const returnPct = capital > 0 ? (finalPnl / capital) * 100 : 0;

      totalSells += sells.length;
      totalWins += wins;
      totalPnl += finalPnl;

      for (let k = 0; k < equity.length; k++) portfolioEquity[k] = (portfolioEquity[k] || 0) + equity[k];

      perStock.push({
        symbol: item.symbol, name: item.name, status: "ok",
        trades: sells.length, wins, winRate: sells.length ? (wins / sells.length) * 100 : 0,
        pnl: finalPnl, returnPct, maxDD: maxDD * 100,
      });
    } catch (err: any) {
      perStock.push({ symbol: item.symbol, name: item.name, status: "错误:" + err.message, trades: 0, winRate: 0, pnl: 0, returnPct: 0, maxDD: 0 });
    }
  }

  const BATCH = 8;
  for (let i = 0; i < list.length; i += BATCH) {
    await Promise.all(list.slice(i, i + BATCH).map(backtestOne));
  }

  // 组合层回撤（多股按日对齐求和）
  let peak = 0, portfolioMaxDD = 0;
  for (const v of portfolioEquity) {
    peak = Math.max(peak, v);
    if (peak > 0) portfolioMaxDD = Math.max(portfolioMaxDD, (peak - v) / peak);
  }

  return {
    ok: true,
    rule,
    range: "近6个月",
    perStock: perStock.sort((a, b) => (b.pnl || 0) - (a.pnl || 0)),
    summary: {
      stocks: perStock.filter((p) => p.status === "ok").length,
      totalTrades: totalSells,
      winRate: totalSells ? (totalWins / totalSells) * 100 : 0,
      totalPnl,
      totalCapital,
      totalReturnPct: totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0,
      maxDrawdown: portfolioMaxDD * 100,
    },
  };
}

/* ════════════════════════════════════════════════════
   可插拔下单执行层（为两三个月后接券商留干净插口）
   - 现在：PaperExecutor 写数据库（纸面交易）
   - 将来：BrokerExecutor 调券商 OpenAPI（富途/老虎/IB…），逻辑复用
   策略/风控/回测逻辑不依赖具体执行方，只依赖本接口
   ════════════════════════════════════════════════════ */

/** 纸面执行：写入 paper_trades / paper_positions（不实盘） */
export class PaperExecutor implements OrderExecutor {
  constructor(private supabase: any) {}
  async recordTrade(trade: any) {
    await this.supabase.from("paper_trades").insert(trade);
  }
  async setPosition(pos: any) {
    await this.supabase.from("paper_positions").upsert(pos, { onConflict: "symbol" });
  }
}

/**
 * 获取执行方：按环境变量 BROKER_TYPE 切换
 * - 缺省 / "paper" → PaperExecutor（纸面交易，不实盘）
 * - "futu"        → FutuBrokerExecutor（富途真实/模拟下单，经中继转发）
 * 未配置富途中继时 FutuBrokerExecutor 会明确报错，不会静默出错。
 */
export function getExecutor(supabase: any): OrderExecutor {
  if (process.env.BROKER_TYPE === "futu") {
    return new FutuBrokerExecutor(supabase);
  }
  return new PaperExecutor(supabase);
}

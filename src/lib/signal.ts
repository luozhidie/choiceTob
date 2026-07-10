// 模拟交易信号：策略核心逻辑（与 HTTP 路由解耦，供手动/定时复用）

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

// 运行一轮策略：算指标 → 生成信号 → 模拟成交（纸面，不实盘）
export async function runStrategy(supabase: any) {
  const { data: rules } = await supabase.from("signal_rules").select("*").eq("enabled", true).order("created_at").limit(1);
  const rule = rules && rules[0] ? rules[0] : {};
  const maShort = rule.ma_short || 5;
  const maLong = rule.ma_long || 20;
  const maTrend = rule.ma_trend || 60;
  const rsiBuyMin = rule.rsi_buy_min ?? 40;
  const rsiBuyMax = rule.rsi_buy_max ?? 70;
  const rsiSell = rule.rsi_sell ?? 75;
  const volRatio = rule.vol_ratio ?? 1.2;
  const stopLoss = rule.stop_loss ?? 0.08;

  const { data: list } = await supabase.from("stock_watchlist").select("*");
  if (!list || list.length === 0) return { signals: [], trades: [], error: "监控清单为空" };

  const signals: any[] = [];
  const trades: any[] = [];

  async function processOne(item: any) {
    try {
      const { closes, volumes } = await fetchYahooHistory(item.symbol);
      if (closes.length < maTrend + 1) {
        signals.push({ symbol: item.symbol, name: item.name, signal: "持有", reason: "历史数据不足" });
        return;
      }
      const ma5 = ma(closes, maShort)!;
      const ma20 = ma(closes, maLong)!;
      const ma60 = ma(closes, maTrend);
      const r = rsi(closes, 14);
      const momentum = ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100;
      const price = closes[closes.length - 1];

      // 量比：当日量 / 近 20 日均量
      let volRatioNow = 1;
      if (volumes.length >= 21) {
        const recent = volumes.slice(-21);
        const avgVol = recent.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
        volRatioNow = avgVol ? recent[20] / avgVol : 1;
      }

      const goldenCross = ma5 > ma20;
      const midTrendUp = ma60 != null && ma20 > ma60;
      const rsiOk = r == null || (r >= rsiBuyMin && r <= rsiBuyMax);

      let signal = "持有", reason = "无触发";
      if (goldenCross && midTrendUp && rsiOk && momentum > 0 && volRatioNow >= volRatio) {
        signal = "买入";
        reason = `MA${maShort}金叉+站上MA${maTrend}趋势+放量`;
      } else if (ma5 < ma20 || (r != null && r > rsiSell)) {
        signal = "卖出";
        reason = ma5 < ma20 ? "MA死叉" : `RSI超买${r.toFixed(0)}`;
      }
      const score = Math.round((ma5 / ma20 - 1) * 1000) / 10;
      signals.push({ symbol: item.symbol, name: item.name, signal, reason, score, price });

      await supabase.from("stock_snapshots").upsert({ symbol: item.symbol, price, change_pct: momentum, updated_at: new Date().toISOString() }, { onConflict: "symbol" });
      await supabase.from("signal_calc").insert({ symbol: item.symbol, price, ma5, ma20, rsi: r, momentum, score, signal });

      const { data: pos } = await supabase.from("paper_positions").select("*").eq("symbol", item.symbol).single();
      const qty = 100;
      const hitStop = pos && pos.qty > 0 && pos.avg_cost != null && price < pos.avg_cost * (1 - stopLoss);
      if (signal === "买入" && (!pos || pos.qty === 0)) {
        await supabase.from("paper_trades").insert({ symbol: item.symbol, side: "buy", price, qty, source: "rule", note: reason });
        const newQty = (pos?.qty || 0) + qty;
        const newAvg = pos?.qty ? ((pos.qty * pos.avg_cost) + qty * price) / newQty : price;
        await supabase.from("paper_positions").upsert({ symbol: item.symbol, qty: newQty, avg_cost: newAvg, updated_at: new Date().toISOString() }, { onConflict: "symbol" });
        trades.push({ symbol: item.symbol, side: "buy", price, qty });
      } else if ((signal === "卖出" || hitStop) && pos && pos.qty > 0) {
        const sellQty = Math.min(qty, pos.qty);
        const note = hitStop ? `止损-${Math.round(stopLoss * 100)}%` : reason;
        await supabase.from("paper_trades").insert({ symbol: item.symbol, side: "sell", price, qty: sellQty, source: hitStop ? "stop" : "rule", note });
        await supabase.from("paper_positions").upsert({ symbol: item.symbol, qty: pos.qty - sellQty, avg_cost: pos.avg_cost, updated_at: new Date().toISOString() }, { onConflict: "symbol" });
        trades.push({ symbol: item.symbol, side: "sell", price, qty: sellQty });
      }
    } catch (e: any) {
      signals.push({ symbol: item.symbol, name: item.name, signal: "错误", reason: e.message });
    }
  }

  const BATCH = 8;
  for (let i = 0; i < list.length; i += BATCH) {
    const batch = list.slice(i, i + BATCH);
    await Promise.all(batch.map(processOne));
  }

  return { signals, trades };
}

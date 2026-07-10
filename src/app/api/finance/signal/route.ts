import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

// 拉历史日K（Yahoo，A股转 .SS/.SZ 后缀），用于计算技术指标
async function fetchYahooHistory(symbol: string) {
  const ySymbol = symbol.replace(/\.SH$/i, ".SS").replace(/\.SZ$/i, ".SZ");
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ySymbol)}?interval=1d&range=6mo`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error("Yahoo_HTTP_" + res.status);
  const d = await res.json();
  const closes = (d?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter((x: any) => x != null);
  return closes as number[];
}

function ma(closes: number[], n: number) {
  if (closes.length < n) return null;
  const slice = closes.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / n;
}

function rsi(closes: number[], n = 14) {
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

// 手动运行策略：算指标 → 生成信号 → 模拟成交（纸面，不实盘）
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = await createClient();
  const { data: rules } = await supabase.from("signal_rules").select("*").eq("enabled", true).order("created_at").limit(1);
  const rule = rules && rules[0] ? rules[0] : { ma_short: 5, ma_long: 20, momentum_threshold: 5 };
  const maShort = rule.ma_short || 5, maLong = rule.ma_long || 20;

  const { data: list } = await supabase.from("stock_watchlist").select("*");
  if (!list || list.length === 0) return NextResponse.json({ error: "监控清单为空" }, { status: 400 });

  const signals: any[] = [];
  const trades: any[] = [];
  for (const item of list) {
    try {
      const closes = await fetchYahooHistory(item.symbol);
      if (closes.length < maLong + 1) {
        signals.push({ symbol: item.symbol, name: item.name, signal: "持有", reason: "历史数据不足" });
        continue;
      }
      const ma5 = ma(closes, maShort)!;
      const ma20 = ma(closes, maLong)!;
      const r = rsi(closes, 14);
      const momentum = ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100;
      const price = closes[closes.length - 1];
      let signal = "持有", reason = "无触发";
      if (ma5 > ma20 && (r == null || r < 70)) { signal = "买入"; reason = `MA${maShort}上穿MA${maLong}金叉`; }
      else if (ma5 < ma20 || (r != null && r > 75)) { signal = "卖出"; reason = ma5 < ma20 ? "MA死叉" : `RSI超买${r.toFixed(0)}`; }
      const score = Math.round((ma5 / ma20 - 1) * 1000) / 10;
      signals.push({ symbol: item.symbol, name: item.name, signal, reason, score, price });

      await supabase.from("signal_calc").insert({ symbol: item.symbol, price, ma5, ma20, rsi: r, momentum, score, signal });

      const { data: pos } = await supabase.from("paper_positions").select("*").eq("symbol", item.symbol).single();
      const qty = 100;
      if (signal === "买入" && (!pos || pos.qty === 0)) {
        await supabase.from("paper_trades").insert({ symbol: item.symbol, side: "buy", price, qty, source: "rule", note: reason });
        const newQty = (pos?.qty || 0) + qty;
        const newAvg = pos?.qty ? ((pos.qty * pos.avg_cost) + qty * price) / newQty : price;
        await supabase.from("paper_positions").upsert({ symbol: item.symbol, qty: newQty, avg_cost: newAvg, updated_at: new Date().toISOString() }, { onConflict: "symbol" });
        trades.push({ symbol: item.symbol, side: "buy", price, qty });
      } else if (signal === "卖出" && pos && pos.qty > 0) {
        const sellQty = Math.min(qty, pos.qty);
        await supabase.from("paper_trades").insert({ symbol: item.symbol, side: "sell", price, qty: sellQty, source: "rule", note: reason });
        await supabase.from("paper_positions").upsert({ symbol: item.symbol, qty: pos.qty - sellQty, avg_cost: pos.avg_cost, updated_at: new Date().toISOString() }, { onConflict: "symbol" });
        trades.push({ symbol: item.symbol, side: "sell", price, qty: sellQty });
      }
    } catch (e: any) {
      signals.push({ symbol: item.symbol, name: item.name, signal: "错误", reason: e.message });
    }
  }
  return NextResponse.json({ ok: true, signals, trades });
}

// 返回最近一轮信号，供前端展示
export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = await createClient();
  const { data } = await supabase.from("signal_calc").select("*").order("calc_at", { ascending: false }).limit(60);
  return NextResponse.json({ ok: true, signals: data || [] });
}

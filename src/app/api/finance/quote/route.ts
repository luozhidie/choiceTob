import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai";

export const maxDuration = 60;

// 阶段1：港股/美股用 Yahoo 公开接口（免 token，Vercel 海外节点可直连）
// A股（6位纯数字）预留 Tushare，需环境变量 TUSHARE_TOKEN

async function fetchYahoo(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    // @ts-ignore
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Yahoo_HTTP_" + res.status);
  const d = await res.json();
  const meta = d?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("Yahoo_NO_META");
  return {
    symbol: meta.symbol,
    price: meta.regularMarketPrice ?? null,
    changePct: meta.regularMarketChangePercent ?? null,
    volume: meta.regularMarketVolume ?? null,
    currency: meta.currency ?? null,
    name: meta.shortName || meta.longName || symbol,
  };
}

async function fetchTushare(symbol: string) {
  const token = process.env.TUSHARE_TOKEN;
  if (!token) throw new Error("TUSHARE_TOKEN 未配置");
  const res = await fetch("https://api.tushare.pro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_name: "daily",
      token,
      params: { ts_code: symbol, trade_date: "" },
      fields: "close,pct_chg,vol,amount",
    }),
    // @ts-ignore
    signal: AbortSignal.timeout(8000),
  });
  const d = await res.json();
  const row = d?.data?.items?.[0];
  if (!row) throw new Error("Tushare_NO_DATA");
  return {
    symbol,
    price: row[0],
    changePct: row[1],
    volume: row[2],
    currency: "CNY",
    name: symbol,
  };
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "缺少 symbol" }, { status: 400 });
  }

  try {
    const isA = /\.(SH|SZ)$/i.test(symbol);
    const q = isA ? await fetchTushare(symbol) : await fetchYahoo(symbol);
    return NextResponse.json({ ok: true, quote: q });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
  }
}

// 批量刷新 watchlist，写快照
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = await createClient();
  const { data: list } = await supabase.from("stock_watchlist").select("*");
  if (!list || list.length === 0) {
    return NextResponse.json({ ok: true, refreshed: 0, quotes: [] });
  }
  const quotes: any[] = [];
  for (const item of list) {
    try {
      const isA = /\.(SH|SZ)$/i.test(item.symbol);
      const q = isA ? await fetchTushare(item.symbol) : await fetchYahoo(item.symbol);
      q.name = q.name || item.name;
      await supabase.from("stock_snapshots").upsert({ symbol: item.symbol, ...q, updated_at: new Date().toISOString() }, { onConflict: "symbol" });
      quotes.push(q);
    } catch (e: any) {
      quotes.push({ symbol: item.symbol, error: e.message });
    }
  }
  return NextResponse.json({ ok: true, refreshed: quotes.length, quotes });
}

// 全行业 AI 解读
export async function PUT(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = await createClient();
  const { data: list } = await supabase.from("stock_watchlist").select("*");
  const { data: snaps } = await supabase.from("stock_snapshots").select("*");
  if (!list || list.length === 0) {
    return NextResponse.json({ error: "监控清单为空" }, { status: 400 });
  }
  const snapMap = new Map((snaps || []).map((s: any) => [s.symbol, s]));
  const payload = list.map((l: any) => {
    const s = snapMap.get(l.symbol) || {};
    return { 标的: l.name, symbol: l.symbol, 环节: l.sector || "—", 现价: s.price ?? "—", 涨跌幅: s.changePct != null ? s.changePct + "%" : "—" };
  });

  const { content, source } = await callAI({
    system: "你是服装行业投研分析师。根据一组服装产业链公司的实时行情，输出行业景气度研判：1)整体趋势 2)上游/中游/下游各环节表现 3)值得关注的异动 4)对服装批发零售生意的启示。中文，分点，务实。",
    user: "当前监控的服装产业链行情：\n" + JSON.stringify(payload, null, 2),
    temperature: 0.5,
    maxTokens: 2000,
    timeoutMs: 55000,
  });
  if (source === "mock" || !content) {
    return NextResponse.json({ error: "AI 服务未配置" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, analysis: content, source });
}

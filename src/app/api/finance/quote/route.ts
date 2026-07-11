import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { callAI } from "@/lib/ai";

export const maxDuration = 60;

// 阶段1：港股/美股/日股用 Yahoo 公开接口（免 token，Vercel 海外节点可直连）
// A股（.SH/.SZ）用新浪财经接口（免 token，无积分限制）

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
  const price = meta.regularMarketPrice ?? null;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
  let changePct = meta.regularMarketChangePercent ?? null;
  if (changePct == null && price != null && prevClose) {
    changePct = ((price - prevClose) / prevClose) * 100;
  }
  return {
    symbol: meta.symbol,
    price,
    changePct,
    volume: meta.regularMarketVolume ?? null,
    currency: meta.currency ?? null,
    name: meta.shortName || meta.longName || symbol,
  };
}

async function fetchSinaBulk(symbols: string[]) {
  if (symbols.length === 0) return {};
  const sinaSymbols = symbols.map((s) => {
    const code = s.replace(/\.(SH|SZ)$/i, "");
    return /\.SH$/i.test(s) ? `sh${code}` : `sz${code}`;
  });
  const url = `https://hq.sinajs.cn/list=${sinaSymbols.join(",")}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Referer": "https://finance.sina.com.cn",
    },
    // @ts-ignore
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error("Sina_HTTP_" + res.status);
  const buffer = await res.arrayBuffer();
  const text = new TextDecoder("gbk").decode(buffer);
  const result: Record<string, any> = {};
  for (const sinaSymbol of sinaSymbols) {
    const match = text.match(new RegExp(`var hq_str_${sinaSymbol}="([^"]*)";`));
    if (!match) continue;
    const parts = match[1].split(",");
    if (parts.length < 4 || !parts[3]) continue;
    const originalSymbol = symbols.find((s) => {
      const code = s.replace(/\.(SH|SZ)$/i, "");
      return sinaSymbol === (/\.SH$/i.test(s) ? `sh${code}` : `sz${code}`);
    });
    if (!originalSymbol) continue;
    const name = parts[0] || originalSymbol;
    const prevClose = parseFloat(parts[2]);
    const price = parseFloat(parts[3]);
    const volume = parseInt(parts[8], 10) || null;
    const changePct = prevClose && price ? ((price - prevClose) / prevClose) * 100 : null;
    result[originalSymbol] = {
      symbol: originalSymbol,
      price,
      changePct,
      volume,
      currency: "CNY",
      name,
    };
  }
  return result;
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
    const q = isA ? (await fetchSinaBulk([symbol]))[symbol] : await fetchYahoo(symbol);
    if (!q) throw new Error(isA ? "Sina_NO_DATA" : "Yahoo_NO_DATA");
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
  const supabase = createServiceRoleClient();
  const { data: list } = await supabase.from("stock_watchlist").select("*");
  if (!list || list.length === 0) {
    return NextResponse.json({ ok: true, refreshed: 0, quotes: [] });
  }
  const aShares = list.filter((item: any) => /\.(SH|SZ)$/i.test(item.symbol));
  const nonAShares = list.filter((item: any) => !/\.(SH|SZ)$/i.test(item.symbol));

  // A股：新浪批量（一次请求）
  const sinaQuotes = aShares.length > 0 ? await fetchSinaBulk(aShares.map((i: any) => i.symbol)) : {};

  // 非A股：Yahoo 分批并发，避免顺序请求累计超时（Vercel 60s 限制）
  const yahooQuotes: Record<string, any> = {};
  const BATCH = 8;
  for (let i = 0; i < nonAShares.length; i += BATCH) {
    const batch = nonAShares.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (item: any) => {
        try {
          const q = await fetchYahoo(item.symbol);
          return { symbol: item.symbol, q };
        } catch (e: any) {
          return { symbol: item.symbol, error: e.message };
        }
      })
    );
    for (const r of results) {
      if (r.q) yahooQuotes[r.symbol] = r.q;
    }
  }

  const quotes: any[] = [];
  for (const item of list) {
    const isA = /\.(SH|SZ)$/i.test(item.symbol);
    const q = isA ? sinaQuotes[item.symbol] : yahooQuotes[item.symbol];
    try {
      if (!q) throw new Error(isA ? "Sina_NO_DATA" : "Yahoo_NO_DATA");
      q.name = q.name || item.name;
      const { name, ...snapshot } = q;
      await supabase.from("stock_snapshots").upsert({ symbol: item.symbol, ...snapshot, updated_at: new Date().toISOString() }, { onConflict: "symbol" });
      quotes.push(q);
    } catch (e: any) {
      quotes.push({ symbol: item.symbol, error: e.message });
    }
  }
  return NextResponse.json({ ok: true, refreshed: quotes.length, quotes });
}

// 跨行业 AI 解读（按行业分组研判）
export async function PUT(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const supabase = createServiceRoleClient();
  const { data: list } = await supabase.from("stock_watchlist").select("*");
  const { data: snaps } = await supabase.from("stock_snapshots").select("*");
  if (!list || list.length === 0) {
    return NextResponse.json({ error: "监控清单为空" }, { status: 400 });
  }
  const snapMap = new Map((snaps || []).map((s: any) => [s.symbol, s]));
  // 按行业分组
  const byIndustry: Record<string, any[]> = {};
  for (const l of list) {
    const ind = (l.industry || "其他").trim() || "其他";
    if (!byIndustry[ind]) byIndustry[ind] = [];
    const s = snapMap.get(l.symbol) || {};
    const chg = s.change_pct ?? s.changePct;
    byIndustry[ind].push({
      标的: l.name,
      symbol: l.symbol,
      细分: l.sector || "—",
      现价: s.price != null ? s.price : "—",
      涨跌幅: chg != null ? (Math.round(chg * 100) / 100) + "%" : "—",
    });
  }
  const payloadLines: string[] = [];
  for (const [ind, items] of Object.entries(byIndustry)) {
    payloadLines.push(`【${ind}】(${items.length}只)\n` + JSON.stringify(items, null, 2));
  }

  const { content, source } = await callAI({
    system: "你是资深行业投研分析师。下面按「行业」分组给出了一组公司的实时行情。请：1) 分行业点评各环节表现与景气度；2) 指出值得关注的异动标的（涨幅/跌幅异常）；3) 给出对实体生意（尤其消费/零售）的启示与可行动建议。中文，分点，务实，避免空话。",
    user: "当前跨行业监控行情（按行业分组）：\n" + payloadLines.join("\n\n"),
    temperature: 0.5,
    maxTokens: 2000,
    timeoutMs: 55000,
  });
  if (source === "mock" || !content) {
    return NextResponse.json({ error: "AI 服务未配置" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, analysis: content, source });
}

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * 历史爆款查询API
 * GET  /api/trend/history?keyword=连衣裙&days=30
 * POST /api/trend/history  body: { keyword, category, top_items, trend_data }
 */

const API_GATEWAY = "https://eco.taobao.com/router/rest";
const APP_KEY = process.env.TAOBAO_APP_KEY || "";
const APP_SECRET = process.env.TAOBAO_APP_SECRET || "";
const ADZONE_ID = process.env.TAOBAO_ADZONE_ID || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// ============ 淘宝API调用（复用） ============

function generateSign(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  let signStr = APP_SECRET;
  for (const key of sortedKeys) {
    signStr += key + params[key];
  }
  signStr += APP_SECRET;
  return crypto.createHash("md5").update(signStr, "utf8").digest("hex").toUpperCase();
}

/** 淘宝API时间戳格式: yyyy-MM-dd HH:mm:ss */
function formatTaobaoTimestamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function callTaobaoAPI(method: string, bizParams: Record<string, any>): Promise<any> {
  const timestamp = formatTaobaoTimestamp(new Date());
  const sysParams: Record<string, string> = {
    method, app_key: APP_KEY, timestamp, format: "json", v: "2.0", sign_method: "md5",
  };
  const allParams: Record<string, string> = { ...sysParams };
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") {
      allParams[k] = typeof v === "string" ? v : String(v);
    }
  }
  sysParams.sign = generateSign(allParams);
  const url = new URL(API_GATEWAY);
  for (const [k, v] of Object.entries(sysParams)) url.searchParams.append(k, v);
  for (const [k, v] of Object.entries(bizParams)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.append(k, typeof v === "string" ? v : String(v));
    }
  }
  const resp = await fetch(url.toString(), { method: "GET", signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

// ============ Supabase 查询 ============

async function queryTrendHistory(keyword: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const url = `${SUPABASE_URL}/rest/v1/trend_history?keyword=eq.${encodeURIComponent(keyword)}&date=gte.${sinceStr}&order=date.desc`;
  const resp = await fetch(url, {
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(`Supabase查询失败: ${resp.status}`);
  return resp.json();
}

async function saveTrendHistory(record: { keyword: string; category?: string; top_items: any; trend_data: any }) {
  const url = `${SUPABASE_URL}/rest/v1/trend_history`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify([{
      keyword: record.keyword,
      category: record.category || null,
      top_items: record.top_items,
      trend_data: record.trend_data,
    }]),
  });
  if (!resp.ok) throw new Error(`Supabase保存失败: ${resp.status}`);
  return resp.json();
}

// ============ 主接口 ============

/** GET - 查询历史爆款 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword");
    const days = parseInt(searchParams.get("days") || "30");

    if (!keyword) {
      return NextResponse.json({ error: "请提供keyword参数" }, { status: 400 });
    }

    if (!SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ error: "Supabase未配置" }, { status: 500 });
    }

    const history = await queryTrendHistory(keyword, days);

    // 分析趋势变化
    const trendAnalysis = analyzeHistoryTrend(history);

    return NextResponse.json({
      success: true,
      keyword,
      days,
      historyCount: history.length,
      history: history.slice(0, 30),
      trendAnalysis,
    });
  } catch (error: any) {
    console.error("[Trend History] GET错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** POST - 保存当天爆款数据 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, category, top_items, trend_data } = body;

    if (!keyword || !top_items || !trend_data) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const saved = await saveTrendHistory({ keyword, category, top_items, trend_data });

    return NextResponse.json({ success: true, saved });
  } catch (error: any) {
    console.error("[Trend History] POST错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** 分析历史趋势 */
function analyzeHistoryTrend(history: any[]) {
  if (history.length < 2) return { trend: "insufficient_data", message: "数据不足，无法分析趋势" };

  // 按日期排序（旧→新）
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

  // 提取每天top3商品ID，看是否持续出现
  const itemFrequency: Record<string, number> = {};
  sorted.forEach((h: any) => {
    const items = h.top_items?.items || [];
    items.slice(0, 3).forEach((item: any) => {
      const id = item.item_id || item.id || "";
      itemFrequency[id] = (itemFrequency[id] || 0) + 1;
    });
  });

  const persistentItems = Object.entries(itemFrequency)
    .filter(([_, count]) => (count as number) >= 3)
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  return {
    trend: persistentItems.length > 0 ? "stable_hot" : "volatile",
    message: persistentItems.length > 0
      ? `发现${persistentItems.length}个持续爆款，趋势稳定`
      : "爆款更替快，趋势波动大",
    persistentItems: persistentItems.slice(0, 5),
    dataPoints: sorted.length,
  };
}

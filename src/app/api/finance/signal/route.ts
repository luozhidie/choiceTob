import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { runStrategy } from "@/lib/signal";

export const maxDuration = 60;

function checkServiceRole() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量" }, { status: 500 });
  }
  return null;
}

// 手动运行策略（前端按钮，需 admin cookie）
export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const missing = checkServiceRole();
  if (missing) return missing;
  const supabase = createServiceRoleClient();
  const result = await runStrategy(supabase);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, ...result });
}

// 返回最近状态（信号/持仓/成交），供模拟交易页
export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const missing = checkServiceRole();
  if (missing) return missing;
  const supabase = createServiceRoleClient();
  const { data: calc } = await supabase.from("signal_calc").select("*").order("calc_at", { ascending: false }).limit(200);
  const latestMap = new Map();
  for (const c of calc || []) { if (!latestMap.has(c.symbol)) latestMap.set(c.symbol, c); }
  const signals = [...latestMap.values()];
  const { data: positions } = await supabase.from("paper_positions").select("*");
  const { data: trades } = await supabase.from("paper_trades").select("*").order("created_at", { ascending: false }).limit(50);
  const { data: snaps } = await supabase.from("stock_snapshots").select("symbol, price");
  const snapMap = new Map((snaps || []).map((s: any) => [s.symbol, s.price]));
  const positionsWithPnl = (positions || []).map((p: any) => {
    const cur = snapMap.get(p.symbol);
    const pnl = cur != null && p.avg_cost != null ? (cur - p.avg_cost) * p.qty : null;
    return { ...p, current_price: cur, pnl };
  });
  return NextResponse.json({ ok: true, signals, positions: positionsWithPnl, trades: trades || [] });
}

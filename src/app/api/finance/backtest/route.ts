import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { runBacktest } from "@/lib/signal";

export const maxDuration = 60;

function checkAuth(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (!cookieHeader.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量" }, { status: 500 });
  }
  return null;
}

// 回测历史（积累的市场经验）：每次回测沉淀一条
export async function GET(req: NextRequest) {
  const blocked = checkAuth(req);
  if (blocked) return blocked;
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("backtest_runs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ ok: true, runs: data || [] });
}

// 手动回测（前端按钮，需 admin cookie）：可指定策略
export async function POST(req: NextRequest) {
  const blocked = checkAuth(req);
  if (blocked) return blocked;
  const supabase = createServiceRoleClient();
  let strategyId: number | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    if (body.strategyId != null && body.strategyId !== "") {
      const n = Number(body.strategyId);
      if (!Number.isNaN(n)) strategyId = n;
    }
  } catch {}

  const result = await runBacktest(supabase, strategyId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  // 沉淀本次回测，长期积累成「市场经验」
  const { error: insErr } = await supabase.from("backtest_runs").insert({
    strategy_id: result.strategyId ?? null,
    strategy_name: result.strategyName || "默认策略",
    range: result.range,
    summary: result.summary,
    per_stock: result.perStock,
  });
  if (insErr) console.error("backtest_runs insert error:", insErr.message);

  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { generateDailyPicks } from "@/lib/lottery/dailypicks";

/* ════════════════════════════════════════
   GET/POST /api/lottery/dailypick
   定时任务入口：每天基于最新开奖生成 6 种玩法的「每日推荐一注」
   （Vercel cron 每天北京时间 23:00 触发；纯展示，不暗示盈利）
   ════════════════════════════════════════ */

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const snap = await generateDailyPicks(supabase);
    return NextResponse.json({
      success: true,
      date: snap.date,
      count: Object.keys(snap.picks).length,
      message: `每日推荐已生成(${Object.keys(snap.picks).length}种)`,
    });
  } catch (error: any) {
    console.error("[DailyPick] 错误:", error);
    return NextResponse.json({ error: error?.message || "生成失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

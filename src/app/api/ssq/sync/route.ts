import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { fetchGameData, saveGameData } from "@/lib/lottery/fetcher";
import { LotteryType } from "@/lib/lottery/types";

/* ════════════════════════════════════════
   POST/GET /api/ssq/sync
   定时任务入口：同步全部 6 种玩法真实开奖数据
   （Vercel cron 在开奖日北京时间 22:00 触发）
   ════════════════════════════════════════ */

const ALL_TYPES: LotteryType[] = ["ssq", "dlt", "fc3d", "pl3", "pl5", "qxc"];

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const results: any[] = [];

    for (const type of ALL_TYPES) {
      try {
        console.log(`[SSQ Sync] 同步 ${type}...`);
        const { records, source, updatedAt } = await fetchGameData(type, fetch);
        const saved = await saveGameData(supabase, type, { records, source, updatedAt });
        results.push({ type, source, totalDraws: records.length, updatedAt, savedToStorage: saved });
      } catch (e: any) {
        results.push({ type, error: e?.message || "同步失败" });
      }
    }

    const ok = results.filter((r) => !r.error).length;
    return NextResponse.json({
      success: true,
      message: `已同步 ${ok}/${ALL_TYPES.length} 种玩法`,
      results,
    });
  } catch (error: any) {
    console.error("[SSQ Sync] 错误:", error);
    return NextResponse.json({ error: error.message || "同步失败" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}

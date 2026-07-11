import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAllGames, getLotteryGame, formatOdds, expectedValue } from "@/lib/lottery/probability";
import { runSimulation } from "@/lib/lottery/simulator";
import { readStats, writeStats, mergeSimulation } from "@/lib/lottery/data";

/* ───────────── GET: 获取彩票信息 + 统计数据 ───────────── */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "info";

    if (action === "stats") {
      // 返回统计数据
      const stats = await readStats(supabase);
      return NextResponse.json({ success: true, data: stats });
    }

    if (action === "simulate") {
      // 执行一次模拟
      const type = (searchParams.get("type") || "ssq") as any;
      const bets = parseInt(searchParams.get("bets") || "1", 10);
      const sims = parseInt(searchParams.get("simulations") || "1000", 10);

      if (!type || bets < 1 || sims < 1 || sims > 100000) {
        return NextResponse.json({ error: "参数无效" }, { status: 400 });
      }

      const result = runSimulation({ lotteryType: type, bets, simulations });

      // 自动保存到统计快照
      try {
        const stats = await readStats(supabase);
        const updated = mergeSimulation(stats, result);
        await writeStats(supabase, updated);
      } catch (e) {
        console.error("[Lottery API] 保存统计失败:", e);
      }

      return NextResponse.json({ success: true, data: result });
    }

    // 默认：返回所有游戏基本信息
    const games = getAllGames().map(({ type, game }) => ({
      type,
      config: game.config,
      totalCombinations: game.totalCombinations,
      prizes: game.prizes.map(p => ({
        level: p.level,
        condition: p.condition,
        odds: p.odds,
        prize: p.prize,
      })),
      ev: Math.round(expectedValue(game.prizes) * 100) / 100,
    }));

    return NextResponse.json({
      success: true,
      data: {
        games,
        summary: {
          totalTypes: games.length,
          message: "理性购彩，量力而行。所有概率基于数学计算。",
        },
      },
    });
  } catch (error: any) {
    console.error("[Lottery API] Error:", error);
    return NextResponse.json(
      { error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

/* ───────────── POST: 保存模拟结果（可选） ───────────── */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceRoleClient();

    if (body.action === "save_simulation" && body.result) {
      const stats = await readStats(supabase);
      const updated = mergeSimulation(stats, body.result);
      const { success, error } = await writeStats(supabase, updated);

      if (!success) {
        return NextResponse.json({ error }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "已保存" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error: any) {
    console.error("[Lottery POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/* ── 彩票数据管理（Supabase Storage JSON） ── */

import { LotteryStatsSnapshot, SimulationResult } from "./types";

const STORAGE_BUCKET = "products";
const STORAGE_PATH = "lottery/lottery-stats.json";

/* ───────────── 默认空数据 ───────────── */
function emptySnapshot(): LotteryStatsSnapshot {
  return {
    version: "1.0.0",
    updatedAt: new Date().toISOString(),
    games: {
      ssq: { totalSimulations: 0, totalBets: 0, totalCost: 0, totalPrize: 0, avgRoi: 0, lastUpdated: "" },
      dlt: { totalSimulations: 0, totalBets: 0, totalCost: 0, totalPrize: 0, avgRoi: 0, lastUpdated: "" },
      fc3d: { totalSimulations: 0, totalBets: 0, totalCost: 0, totalPrize: 0, avgRoi: 0, lastUpdated: "" },
      pl5: { totalSimulations: 0, totalBets: 0, totalCost: 0, totalPrize: 0, avgRoi: 0, lastUpdated: "" },
    },
    recentSimulations: [],
  };
}

/**
 * 服务端：读取统计快照
 * 需要在 API Route 中调用
 */
export async function readStats(supabaseAdmin: any): Promise<LotteryStatsSnapshot> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .download(STORAGE_PATH);

    if (error || !data) {
      console.log("[Lottery] 未找到统计数据，使用默认值");
      return emptySnapshot();
    }

    const text = await data.text();
    return JSON.parse(text);
  } catch (e) {
    console.error("[Lottery] 读取失败:", e);
    return emptySnapshot();
  }
}

/**
 * 服务端：写入/更新统计快照
 */
export async function writeStats(
  supabaseAdmin: any,
  snapshot: LotteryStatsSnapshot,
): Promise<{ success: boolean; error?: string }> {
  try {
    snapshot.updatedAt = new Date().toISOString();

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });

    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(STORAGE_PATH, blob, { upsert: true });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * 将一次模拟结果合并到快照中
 */
export function mergeSimulation(
  snapshot: LotteryStatsSnapshot,
  result: SimulationResult,
): LotteryStatsSnapshot {
  const gameStats = snapshot.games[result.lotteryType];
  if (gameStats) {
    gameStats.totalSimulations += result.simulations;
    gameStats.totalBets += result.bets * result.simulations;
    gameStats.totalCost += result.totalCost;
    gameStats.totalPrize += result.totalPrize;

    // 计算滚动平均 ROI
    const n = gameStats.totalSimulations / result.simulations;
    gameStats.avgRoi =
      ((n - 1) / n) * gameStats.avgRoi + (1 / n) * result.roi;
    gameStats.lastUpdated = new Date().toISOString();
  }

  // 保留最近50条模拟记录
  snapshot.recentSimulations.unshift(result);
  if (snapshot.recentSimulations.length > 50) {
    snapshot.recentSimulations = snapshot.recentSimulations.slice(0, 50);
  }

  return snapshot;
}

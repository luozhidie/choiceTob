import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAllGames, getLotteryGame, expectedValue } from "@/lib/lottery/probability";
import { runSimulation } from "@/lib/lottery/simulator";
import { readStats, writeStats, mergeSimulation } from "@/lib/lottery/data";
import {
  generateSsqDemoData,
  analyzeSsqHistory,
  generateWeightedPick,
} from "@/lib/lottery/analyzer";
import { fetchSsqData, loadSsqData, saveSsqData } from "@/lib/lottery/fetcher";

/* ── 缓存：历史数据（服务端内存） ──
 * 设计目标：
 * 1. 优先从 Supabase Storage 读取已同步的真实数据（冷启动也能秒开）
 * 2. Storage 不存在则抓取真实数据并写回 Storage（保证后续请求稳定）
 * 3. 数据超过 STALE_HOURS 视为过期 → 后台自动重新同步（实现"准实时"更新）
 */
let _cachedRecords: ReturnType<typeof generateSsqDemoData> | null = null;
let _cachedAnalysis: ReturnType<typeof analyzeSsqHistory> | null = null;
let _dataSource: string = "demo";
let _dataUpdatedAt: string | null = null;
let _refreshing = false;

const STALE_HOURS = 6; // 超过 6 小时未更新视为过期

async function doSync(): Promise<{ source: string; total: number; updatedAt: string }> {
  const supabase = createServiceRoleClient();
  const { records, source, updatedAt } = await fetchSsqData(fetch);
  await saveSsqData(supabase, { records, source, updatedAt });
  _cachedRecords = records;
  _cachedAnalysis = analyzeSsqHistory(records);
  _dataSource = source;
  _dataUpdatedAt = updatedAt;
  return { source, total: records.length, updatedAt };
}

async function getSsqRecords(): Promise<ReturnType<typeof generateSsqDemoData>> {
  if (!_cachedRecords) {
    const supabase = createServiceRoleClient();
    // 1. 优先从 Supabase Storage 读取已同步的真实数据
    const stored = await loadSsqData(supabase);
    if (stored) {
      _cachedRecords = stored.records;
      _dataSource = stored.source;
      _dataUpdatedAt = stored.updatedAt ?? null;
      _cachedAnalysis = analyzeSsqHistory(_cachedRecords);
      return _cachedRecords;
    }
    // 2. Storage 无数据 → 抓取真实数据并写回 Storage（保证下次稳定）
    console.log("[Lottery API] Storage 无数据，触发首次同步...");
    await doSync();
  }
  return _cachedRecords!;
}

async function getSsqAnalysis() {
  await getSsqRecords();
  // 过期自动后台刷新（不阻塞当前请求，下次访问即最新）
  if (_dataUpdatedAt) {
    const ageHours = (Date.now() - new Date(_dataUpdatedAt).getTime()) / 3_600_000;
    if (ageHours > STALE_HOURS && !_refreshing) {
      _refreshing = true;
      doSync()
        .catch((e) => console.error("[Lottery API] 后台自动同步失败:", e))
        .finally(() => { _refreshing = false; });
    }
  }
  return _cachedAnalysis!;
}

/* ───────────── GET ───────────── */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "info";

    switch (action) {
      case "stats": {
        const stats = await readStats(supabase);
        return NextResponse.json({ success: true, data: stats });
      }

      case "simulate": {
        const type = (searchParams.get("type") || "ssq") as any;
        const bets = parseInt(searchParams.get("bets") || "1", 10);
        const sims = parseInt(searchParams.get("simulations") || "1000", 10);

        if (!type || bets < 1 || sims < 1 || sims > 100000) {
          return NextResponse.json({ error: "参数无效" }, { status: 400 });
        }

        const result = runSimulation({ lotteryType: type, bets, simulations: sims });

        try {
          const stats = await readStats(supabase);
          await writeStats(supabase, mergeSimulation(stats, result));
        } catch (e) {
          console.error("[Lottery API] 保存统计失败:", e);
        }

        return NextResponse.json({ success: true, data: result });
      }

      /* ── 历史数据分析接口 ── */
      case "analysis": {
        const analysis = await getSsqAnalysis();
        const sourceName: Record<string, string> = {
          "17500": "乐彩网(17500.cn)",
          "500": "500彩票网",
          "cwl": "中彩网",
          "demo": "演示数据",
        };
        return NextResponse.json({
          success: true,
          data: analysis,
          dataSource: _dataSource,
          lastUpdated: _dataUpdatedAt,
          note: _dataSource === "demo"
            ? "⚠️ 当前为演示数据（2003-2018）。真实数据源暂不可达，已回退。"
            : `✅ 数据源：${sourceName[_dataSource] || _dataSource}，已同步至最新（${analysis.meta.totalDraws}期）。`,
        });
      }

      case "history": {
        const records = await getSsqRecords();
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
        return NextResponse.json({
          success: true,
          dataSource: _dataSource,
          lastUpdated: _dataUpdatedAt,
          data: {
            total: records.length,
            recent: records.slice(-limit),
          },
        });
      }

      case "pick": {
        const strategy = (searchParams.get("strategy") || "balanced") as any;
        const validStrategies = ["hot", "cold", "balanced", "random", "omission"];
        if (!validStrategies.includes(strategy)) {
          return NextResponse.json({ error: "策略参数无效" }, { status: 400 });
        }
        const pickResult = generateWeightedPick(strategy, await getSsqAnalysis());
        return NextResponse.json({ success: true, data: pickResult });
      }

      /* ── 手动触发同步最新开奖 ── */
      case "sync": {
        _refreshing = true;
        try {
          const res = await doSync();
          return NextResponse.json({
            success: true,
            source: res.source,
            totalDraws: res.total,
            lastUpdated: res.updatedAt,
            message: res.source === "demo"
              ? "⚠️ 真实数据源暂不可达，已回退演示数据。"
              : `✅ 已同步 ${res.total} 期最新开奖数据`,
          });
        } catch (e: any) {
          _refreshing = false;
          return NextResponse.json({ error: e?.message || "同步失败" }, { status: 500 });
        } finally {
          _refreshing = false;
        }
      }
    }

    // 默认：返回所有游戏基本信息
    const games = getAllGames().map(({ type, game }) => ({
      type,
      config: game.config,
      totalCombinations: game.totalCombinations,
      prizes: game.prizes.map((p) => ({
        level: p.level,
        condition: p.condition,
        odds: p.odds,
        prize: p.prize,
      })),
      ev: Math.round(expectedValue(game.prizes) * 100) / 100,
    }));

    return NextResponse.json({
      success: true,
      data: { games, summary: { totalTypes: games.length, message: "理性购彩，量力而行。" } },
    });
  } catch (error: any) {
    console.error("[Lottery API] Error:", error);
    return NextResponse.json({ error: error.message || "服务器错误" }, { status: 500 });
  }
}

/* ───────────── POST ───────────── */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServiceRoleClient();

    if (body.action === "save_simulation" && body.result) {
      const stats = await readStats(supabase);
      const { success, error } = await writeStats(supabase, mergeSimulation(stats, body.result));
      if (!success) return NextResponse.json({ error }, { status: 500 });
      return NextResponse.json({ success: true, message: "已保存" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error: any) {
    console.error("[Lottery POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

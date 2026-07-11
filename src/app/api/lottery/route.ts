import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getAllGames, getLotteryGame, expectedValue, getGameDef } from "@/lib/lottery/probability";
import { runSimulation } from "@/lib/lottery/simulator";
import { readStats, writeStats, mergeSimulation } from "@/lib/lottery/data";
import {
  analyzeGame, generateGamePick,
} from "@/lib/lottery/analyzer";
import { fetchGameData, loadGameData, saveGameData } from "@/lib/lottery/fetcher";
import { DrawRecord, UnifiedAnalysis, LotteryType } from "@/lib/lottery/types";

const ALL_TYPES: LotteryType[] = ["ssq", "dlt", "fc3d", "pl3", "pl5", "qxc"];
const STALE_HOURS = 6;

/* ── 每玩法缓存（服务端内存） ── */
interface GameCache {
  records: DrawRecord[];
  analysis: UnifiedAnalysis;
  source: string;
  updatedAt: string | null;
}
const _cache: Partial<Record<LotteryType, GameCache>> = {};
const _refreshing: Partial<Record<LotteryType, boolean>> = {};

async function doSync(type: LotteryType): Promise<{ source: string; total: number; updatedAt: string }> {
  const supabase = createServiceRoleClient();
  const def = getGameDef(type);
  const { records, source, updatedAt } = await fetchGameData(type, fetch);
  await saveGameData(supabase, type, { records, source, updatedAt });
  _cache[type] = { records, analysis: analyzeGame(records, def), source, updatedAt };
  return { source, total: records.length, updatedAt };
}

async function getGameData(type: LotteryType): Promise<GameCache> {
  if (!_cache[type]) {
    const supabase = createServiceRoleClient();
    const def = getGameDef(type);
    const stored = await loadGameData(supabase, type);
    if (stored) {
      _cache[type] = {
        records: stored.records,
        analysis: analyzeGame(stored.records, def),
        source: stored.source,
        updatedAt: stored.updatedAt ?? null,
      };
    } else {
      console.log(`[Lottery API] ${type} Storage 无数据，触发首次同步...`);
      await doSync(type);
    }
  }
  return _cache[type]!;
}

async function getGameAnalysis(type: LotteryType): Promise<UnifiedAnalysis> {
  const c = await getGameData(type);
  // 过期后台自动刷新（不阻塞当前请求）
  if (c.updatedAt) {
    const ageHours = (Date.now() - new Date(c.updatedAt).getTime()) / 3_600_000;
    if (ageHours > STALE_HOURS && !_refreshing[type]) {
      _refreshing[type] = true;
      doSync(type)
        .catch((e) => console.error(`[Lottery API] ${type} 后台自动同步失败:`, e))
        .finally(() => { _refreshing[type] = false; });
    }
  }
  return c.analysis;
}

async function syncAll(): Promise<any[]> {
  const results: any[] = [];
  for (const t of ALL_TYPES) {
    try {
      results.push({ type: t, ...(await doSync(t)) });
    } catch (e: any) {
      results.push({ type: t, error: e?.message || "同步失败" });
    }
  }
  return results;
}

/* ───────────── GET ───────────── */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "info";
    const type = (searchParams.get("type") || "ssq") as LotteryType;

    switch (action) {
      case "stats": {
        const stats = await readStats(supabase);
        return NextResponse.json({ success: true, data: stats });
      }

      case "simulate": {
        const bets = parseInt(searchParams.get("bets") || "1", 10);
        const sims = parseInt(searchParams.get("simulations") || "1000", 10);
        if (bets < 1 || sims < 1 || sims > 100000) {
          return NextResponse.json({ error: "参数无效" }, { status: 400 });
        }
        const result = runSimulation({ lotteryType: type, bets, simulations: sims });
        try {
          const stats = await readStats(supabase);
          await writeStats(supabase, mergeSimulation(stats, result));
        } catch (e) { console.error("[Lottery API] 保存统计失败:", e); }
        return NextResponse.json({ success: true, data: result });
      }

      /* ── 历史数据分析（按玩法） ── */
      case "analysis": {
        const analysis = await getGameAnalysis(type);
        const sourceName: Record<string, string> = {
          "17500": "乐彩网(17500.cn)",
          "demo": "演示数据",
        };
        return NextResponse.json({
          success: true,
          type,
          data: analysis,
          dataSource: _cache[type]?.source,
          lastUpdated: _cache[type]?.updatedAt,
          note: _cache[type]?.source === "demo"
            ? "⚠️ 当前为演示数据（真实数据源暂不可达，已回退）。"
            : `✅ 数据源：${sourceName[_cache[type]!.source] || _cache[type]!.source}，已同步至最新（${analysis.meta.totalDraws}期）。`,
        });
      }

      case "history": {
        const data = await getGameData(type);
        const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 500);
        return NextResponse.json({
          success: true,
          type,
          dataSource: data.source,
          lastUpdated: data.updatedAt,
          data: { total: data.records.length, recent: data.records.slice(-limit) },
        });
      }

      case "pick": {
        const strategy = (searchParams.get("strategy") || "balanced") as any;
        const valid = ["hot", "cold", "balanced", "random", "omission"];
        if (!valid.includes(strategy)) {
          return NextResponse.json({ error: "策略参数无效" }, { status: 400 });
        }
        const analysis = await getGameAnalysis(type);
        const pickResult = generateGamePick(strategy, analysis, getGameDef(type));
        return NextResponse.json({ success: true, type, data: pickResult });
      }

      /* ── 手动触发同步（单玩法或全量） ── */
      case "sync": {
        const target = (searchParams.get("type") || "all") as LotteryType | "all";
        if (target === "all") {
          const results = await syncAll();
          return NextResponse.json({ success: true, results });
        }
        _refreshing[target] = true;
        try {
          const res = await doSync(target);
          return NextResponse.json({
            success: true, type: target,
            source: res.source, totalDraws: res.total, lastUpdated: res.updatedAt,
            message: res.source === "demo" ? "⚠️ 真实数据源暂不可达，已回退演示数据。" : `✅ 已同步 ${res.total} 期最新开奖数据`,
          });
        } catch (e: any) {
          _refreshing[target] = false;
          return NextResponse.json({ error: e?.message || "同步失败" }, { status: 500 });
        } finally {
          _refreshing[target] = false;
        }
      }
    }

    // 默认：返回所有玩法基本信息
    const games = getAllGames().map(({ type, game }) => ({
      type,
      config: game.config,
      totalCombinations: game.totalCombinations,
      prizes: game.prizes.map((p) => ({
        level: p.level, condition: p.condition, odds: p.odds, prize: p.prize,
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

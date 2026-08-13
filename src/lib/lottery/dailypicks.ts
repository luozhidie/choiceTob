/* ── 每日推荐一注（纯展示，不暗示盈利）──
 *
 * 设计原则：
 * 1. 基于最新开奖后的统计（analysis 已含最新一期）生成一注加权随机候选。
 * 2. 用「日期 + 玩法」做种子，保证同一天内推荐稳定不变；跨天自动变化（"每天调整一注"）。
 * 3. 策略按天轮转（balanced/hot/cold/omission/random），增加每日多样性。
 * 4. 明确是加权随机、不预测未来、不保证中奖——仅娱乐/研究参考。
 */

import { LotteryType, PickResult, PickStrategy, GameDef, DrawRecord } from "./types";
import { getGameDef } from "./probability";
import { analyzeGame, generateGamePick } from "./analyzer";
import { loadGameData } from "./fetcher";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

const ALL_TYPES: LotteryType[] = ["ssq", "dlt", "fc3d", "pl3", "pl5", "qxc"];
const STORAGE_BUCKET = "products";
const STORAGE_PATH = "lottery/daily-picks.json";

/** 每日推荐快照 */
export interface DailyPicksSnapshot {
  date: string; // 北京日期 YYYY-MM-DD
  updatedAt: string;
  picks: Partial<Record<LotteryType, PickResult>>;
}

/* ── 确定性随机数（mulberry32），种子由日期+玩法决定 ── */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 北京日期字符串（东八区） */
function beijingDate(d = new Date()): string {
  const bj = new Date(d.getTime() + 8 * 3600 * 1000);
  return bj.toISOString().slice(0, 10);
}

const STRATEGIES: PickStrategy[] = ["balanced", "hot", "cold", "omission", "random"];

/** 为单个玩法生成一注（基于最新统计；同日稳定、跨天变化） */
export async function generateOnePick(type: LotteryType, dateStr: string): Promise<PickResult | null> {
  const def: GameDef = getGameDef(type);
  const supabase = createServiceRoleClient();
  const stored = await loadGameData(supabase, type);
  if (!stored || stored.records.length === 0) return null;
  const records: DrawRecord[] = stored.records;
  const analysis = analyzeGame(records, def);
  const dayIndex = Math.floor(Date.parse(dateStr + "T00:00:00+08:00") / 86400000);
  const typeIdx = ALL_TYPES.indexOf(type);
  const strategy = STRATEGIES[(dayIndex + typeIdx) % STRATEGIES.length];
  const rng = mulberry32(hashStr(dateStr + ":" + type));
  return generateGamePick(strategy, analysis, def, rng);
}

/** 读取已存储的每日推荐 */
export async function loadDailyPicks(supabaseAdmin: any): Promise<DailyPicksSnapshot | null> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(STORAGE_BUCKET).download(STORAGE_PATH);
    if (error || !data) return null;
    const json = JSON.parse(await data.text());
    if (json && json.date && json.picks) return json as DailyPicksSnapshot;
    return null;
  } catch {
    return null;
  }
}

/** 写入每日推荐 */
async function saveDailyPicks(supabaseAdmin: any, snap: DailyPicksSnapshot): Promise<void> {
  const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
  await supabaseAdmin.storage.from(STORAGE_BUCKET).upload(STORAGE_PATH, blob, { upsert: true });
}

/** 生成全部 6 种玩法的当日推荐（无条件重算，日期种子保证同日稳定） */
export async function generateDailyPicks(supabaseAdmin: any): Promise<DailyPicksSnapshot> {
  const dateStr = beijingDate();
  const picks: Partial<Record<LotteryType, PickResult>> = {};
  for (const type of ALL_TYPES) {
    try {
      const p = await generateOnePick(type, dateStr);
      if (p) picks[type] = p;
    } catch (e) {
      console.error(`[DailyPicks] 生成 ${type} 失败:`, e);
    }
  }
  const snap: DailyPicksSnapshot = { date: dateStr, updatedAt: new Date().toISOString(), picks };
  try { await saveDailyPicks(supabaseAdmin, snap); } catch (e) { console.error("[DailyPicks] 写入失败:", e); }
  return snap;
}

/** 确保当日推荐存在：若已为今天直接返回，否则生成（供前端按需调用） */
export async function ensureDailyPicks(supabaseAdmin: any): Promise<DailyPicksSnapshot> {
  const today = beijingDate();
  const existing = await loadDailyPicks(supabaseAdmin);
  if (existing && existing.date === today && Object.keys(existing.picks).length > 0) {
    return existing;
  }
  return generateDailyPicks(supabaseAdmin);
}

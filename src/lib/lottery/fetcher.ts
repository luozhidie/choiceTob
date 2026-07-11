/* ── 统一开奖数据抓取器（覆盖 6 种玩法） ──
 *
 * 设计原则：
 * 1. 优先从 GameDef.sourceUrl 抓取真实开奖数据（17500.cn 等）
 * 2. 所有源失败时回退到按 GameDef 生成的演示数据，保证页面不崩
 * 3. 抓取成功后按玩法分路径存储到 Supabase Storage，下次直接读取
 *
 * 17500.cn 的 *_asc.txt 格式高度统一：期号 日期 号码...（号码间空格分隔，
 * 数字游戏按位、pool 类先主区后特殊区），可用一个通用解析器覆盖全部玩法。
 */

import { DrawRecord, GameDef, LotteryType } from "./types";
import { getGameDef } from "./probability";
import { generateDemoData } from "./analyzer";

/* 通用解析：取日期之后的前 frontCount+backCount 个数字（跳过 "-" 等非数字） */
function parseAscLine(line: string, def: GameDef): DrawRecord | null {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2 + def.frontCount + def.backCount) return null;
  const issue = parts[0];
  const date = parts[1];
  const tokens = parts
    .slice(2)
    .filter((t) => /^\d+$/.test(t))
    .map(Number);
  const front = tokens.slice(0, def.frontCount);
  const back = def.backCount > 0 ? tokens.slice(def.frontCount, def.frontCount + def.backCount) : [];
  if (
    front.length === def.frontCount &&
    (def.backCount === 0 || back.length === def.backCount)
  ) {
    return { issue, date, front, back };
  }
  return null;
}

async function fetchFromUrl(
  url: string,
  def: GameDef,
  fetchImpl: typeof fetch
): Promise<DrawRecord[] | null> {
  try {
    const res = await fetchImpl(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined,
    } as any);

    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    const records: DrawRecord[] = [];

    for (const line of lines) {
      const rec = parseAscLine(line, def);
      if (rec) records.push(rec);
    }

    return records.length > 50 ? records : null;
  } catch (e) {
    console.error(`[Fetcher] 源 ${url} 失败:`, e);
    return null;
  }
}

/**
 * 抓取某玩法数据：真实源优先，失败回退演示数据
 * @returns { records, source } source 为 "17500" | "demo"
 */
export async function fetchGameData(
  type: LotteryType,
  fetchImpl: typeof fetch = fetch
): Promise<{ records: DrawRecord[]; source: string; updatedAt: string }> {
  const def = getGameDef(type);

  if (def.sourceUrl) {
    const records = await fetchFromUrl(def.sourceUrl, def, fetchImpl);
    if (records && records.length > 50) {
      console.log(`[Fetcher] ${type} 数据源 ${def.sourceUrl} 成功，共 ${records.length} 期`);
      return { records, source: "17500", updatedAt: new Date().toISOString() };
    }
  }

  console.log(`[Fetcher] ${type} 真实源不可达，回退演示数据`);
  return { records: generateDemoData(def), source: "demo", updatedAt: new Date().toISOString() };
}

/* ── Supabase Storage（按玩法分路径） ── */
export function gameDataPath(type: LotteryType): string {
  return `lottery/${type}-data.json`;
}

/** 兼容旧路径（ssq → lottery/ssq-data.json，与历史数据一致） */
export const SSQ_DATA_PATH = gameDataPath("ssq");

export async function saveGameData(
  supabaseAdmin: any,
  type: LotteryType,
  data: { records: DrawRecord[]; source: string; updatedAt: string }
): Promise<boolean> {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const { error } = await supabaseAdmin.storage
      .from("products")
      .upload(gameDataPath(type), blob, { upsert: true });
    if (error) {
      console.error(`[Fetcher] ${type} 保存失败:`, error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.error(`[Fetcher] ${type} 保存异常:`, e.message);
    return false;
  }
}

export async function loadGameData(
  supabaseAdmin: any,
  type: LotteryType
): Promise<{ records: DrawRecord[]; source: string; updatedAt: string } | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from("products")
      .download(gameDataPath(type));
    if (error || !data) return null;
    const text = await data.text();
    const json = JSON.parse(text);
    if (json?.records && Array.isArray(json.records) && json.records.length > 50) {
      return json;
    }
    return null;
  } catch {
    return null;
  }
}

/* ── 统一历史数据分析引擎（覆盖 6 种玩法） ── */

import {
  DrawRecord, GameDef, BallFrequency, HotColdAnalysis,
  OmissionEntry, RegionFreq, UnifiedAnalysis, PickStrategy, PickResult,
} from "./types";

/* ───────────── 区域命名 ───────────── */
function frontName(id: string): string {
  return id === "ssq" ? "红球" : id === "dlt" ? "前区" : "前区";
}
function backName(id: string): string {
  return id === "ssq" ? "蓝球" : id === "dlt" ? "后区" : "后区";
}
const CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/* ───────────── 频率统计 ───────────── */
function buildFreqList(
  records: DrawRecord[],
  getBalls: (r: DrawRecord) => number[],
  min: number,
  max: number,
  total: number
): BallFrequency[] {
  const map = new Map<number, number>();
  for (let b = min; b <= max; b++) map.set(b, 0);
  for (const r of records) {
    for (const b of getBalls(r)) {
      if (map.has(b)) map.set(b, (map.get(b) || 0) + 1);
    }
  }
  return Array.from(map.entries()).map(([ball, count]) => ({
    ball,
    count,
    frequency: total > 0 ? count / total : 0,
    percentage: total > 0 ? ((count / total) * 100).toFixed(2) + "%" : "0%",
  }));
}

/* ───────────── 遗漏计算 ───────────── */
function calcOmission(
  records: DrawRecord[],
  getBalls: (r: DrawRecord) => number[],
  min: number,
  max: number
): OmissionEntry[] {
  const balls: number[] = [];
  for (let b = min; b <= max; b++) balls.push(b);

  return balls.map((ball) => {
    let currentOmission = 0;
    let maxOmission = 0;
    let temp = 0;
    let lastIssue: string | undefined;
    let lastDate: string | undefined;

    for (let i = records.length - 1; i >= 0; i--) {
      if (getBalls(records[i]).includes(ball)) {
        lastIssue = records[i].issue;
        lastDate = records[i].date;
        break;
      }
      currentOmission++;
    }

    temp = 0;
    for (let i = 0; i < records.length; i++) {
      if (getBalls(records[i]).includes(ball)) {
        if (temp > maxOmission) maxOmission = temp;
        temp = 0;
      } else {
        temp++;
      }
    }
    if (temp > maxOmission) maxOmission = temp;

    return { ball, currentOmission, maxOmission, lastAppearIssue: lastIssue, lastAppearDate: lastDate };
  });
}

/* ───────────── 冷热分析（pool 前区） ───────────── */
function calcHotCold(frontFreq: BallFrequency[], total: number): HotColdAnalysis {
  const WINDOW = Math.min(100, total);
  // 用整体频率近似近期：按频率高低分桶
  const sorted = [...frontFreq].sort((a, b) => b.frequency - a.frequency);
  const n = sorted.length;
  const hotN = Math.max(1, Math.round(n * 0.25));
  const coldN = Math.max(1, Math.round(n * 0.25));

  const hot = sorted.slice(0, hotN);
  const cold = sorted.slice(n - coldN);
  const warm = sorted.slice(hotN, n - coldN);

  return { hot, cold, warm, windowSize: WINDOW };
}

/* ───────────── 主分析函数 ───────────── */
export function analyzeGame(records: DrawRecord[], def: GameDef): UnifiedAnalysis {
  if (!records || records.length === 0) return emptyAnalysis(def);

  const total = records.length;
  const latest = records[records.length - 1];
  const regions: RegionFreq[] = [];
  const omissions: { name: string; entries: OmissionEntry[] }[] = [];

  let hotCold: HotColdAnalysis | undefined;

  if (def.kind === "pool") {
    const fName = frontName(def.id);
    const bName = backName(def.id);
    const frontFreq = buildFreqList(records, (r) => r.front, def.frontMin, def.frontMax, total);
    regions.push({ name: fName, freqs: frontFreq });
    omissions.push({ name: fName, entries: calcOmission(records, (r) => r.front, def.frontMin, def.frontMax) });
    hotCold = calcHotCold(frontFreq, total);

    if (def.backCount > 0) {
      const backFreq = buildFreqList(records, (r) => r.back, def.backMin, def.backMax, total);
      regions.push({ name: bName, freqs: backFreq, isSpecial: true });
      omissions.push({ name: bName, entries: calcOmission(records, (r) => r.back, def.backMin, def.backMax) });
    }
  } else {
    // 数字游戏：按位分析
    for (let p = 0; p < def.frontCount; p++) {
      const name = `第${CN_NUM[p + 1] || p + 1}位`;
      const freq = buildFreqList(records, (r) => [r.front[p]], 0, 9, total);
      regions.push({ name, freqs: freq });
      omissions.push({ name, entries: calcOmission(records, (r) => [r.front[p]], 0, 9) });
    }
  }

  /* 连号（仅 pool 前区） */
  let consecutiveStats: UnifiedAnalysis["consecutiveStats"] | undefined;
  if (def.kind === "pool") {
    const consecutives: number[] = [];
    let maxConsInOne = 0;
    for (const r of records) {
      const sorted = [...r.front].sort((a, b) => a - b);
      let consLen = 1;
      let maxThis = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === 1) {
          consLen++;
          if (consLen > maxThis) maxThis = consLen;
        } else {
          if (consLen > 1) consecutives.push(consLen);
          consLen = 1;
        }
      }
      if (consLen > 1) consecutives.push(consLen);
      if (maxThis > maxConsInOne) maxConsInOne = maxThis;
    }
    const lenDist: Record<string, number> = {};
    for (const c of consecutives) lenDist[String(c)] = (lenDist[String(c)] || 0) + 1;
    let mostCommon = 0, mostCount = 0;
    for (const [len, cnt] of Object.entries(lenDist)) {
      if (cnt > mostCount) { mostCount = cnt; mostCommon = parseInt(len); }
    }
    consecutiveStats = {
      avgConsecutivePerDraw: consecutives.length / total,
      maxConsecutiveInOneDraw: maxConsInOne,
      mostCommonLength: mostCommon,
      lengthDistribution: lenDist,
    };
  }

  /* 和值（前区/主号码之和） */
  const sums = records.map((r) => r.front.reduce((a, b) => a + b, 0)).sort((a, b) => a - b);
  const mean = sums.reduce((a, b) => a + b, 0) / total;
  const variance = sums.reduce((a, b) => a + (b - mean) ** 2, 0) / total;
  const modeMap = new Map<number, number>();
  for (const s of sums) modeMap.set(s, (modeMap.get(s) || 0) + 1);
  let mode = sums[0], modeCount = 0;
  for (const [val, cnt] of modeMap) if (cnt > modeCount) { modeCount = cnt; mode = val; }

  return {
    meta: {
      totalDraws: total,
      dateRange: `${records[0]?.date || ""} ~ ${latest?.date || ""}`,
      latestIssue: latest?.issue || "",
      latestDraw: latest || null,
      gameId: def.id,
    },
    regions,
    hotCold,
    omissions,
    consecutiveStats,
    sumStats: {
      mean: Math.round(mean * 10) / 10,
      stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
      min: sums[0],
      max: sums[sums.length - 1],
      mode,
    },
  };
}

function emptyAnalysis(def: GameDef): UnifiedAnalysis {
  const regions: RegionFreq[] = [];
  const omissions: { name: string; entries: OmissionEntry[] }[] = [];
  if (def.kind === "pool") {
    regions.push({ name: frontName(def.id), freqs: [] });
    omissions.push({ name: frontName(def.id), entries: [] });
    if (def.backCount > 0) {
      regions.push({ name: backName(def.id), freqs: [], isSpecial: true });
      omissions.push({ name: backName(def.id), entries: [] });
    }
  } else {
    for (let p = 0; p < def.frontCount; p++) {
      const name = `第${CN_NUM[p + 1] || p + 1}位`;
      regions.push({ name, freqs: [] });
      omissions.push({ name, entries: [] });
    }
  }
  return {
    meta: { totalDraws: 0, dateRange: "", latestIssue: "", latestDraw: null, gameId: def.id },
    regions,
    hotCold: { hot: [], cold: [], warm: [], windowSize: 100 },
    omissions,
    consecutiveStats: { avgConsecutivePerDraw: 0, maxConsecutiveInOneDraw: 0, mostCommonLength: 0, lengthDistribution: {} },
    sumStats: { mean: 0, stdDev: 0, min: 0, max: 0, mode: 0 },
  };
}

/* ════════════════════════════════════════
   选号辅助（加权随机，不预测未来）
   ════════════════════════════════════════ */

/** 从某区域按策略抽取 k 个不重复号码（pool 用） */
function sampleFromRegion(
  region: RegionFreq,
  strategy: PickStrategy,
  k: number,
  omissionMap: Map<number, number>,
  rng: () => number
): number[] {
  const freqs = region.freqs;
  if (freqs.length === 0) return [];
  const maxFreq = Math.max(...freqs.map((f) => f.frequency), 0.0001);
  const median = maxFreq / 2;

  const weightOf = (f: BallFrequency): number => {
    switch (strategy) {
      case "hot": return f.frequency + 0.0001;
      case "cold": return 1 / (f.frequency + 0.0001);
      case "balanced": return 1 - Math.abs(f.frequency - median) / (maxFreq + 0.0001); // 偏向中等频率
      case "omission": return (omissionMap.get(f.ball) || 0) + 0.5;
      case "random":
      default: return 1;
    }
  };

  const items = freqs.map((f) => ({ ball: f.ball, w: Math.max(weightOf(f), 0.0001) }));
  const result: number[] = [];

  for (let i = 0; i < k && items.length > 0; i++) {
    const totalW = items.reduce((s, it) => s + it.w, 0);
    let r = rng() * totalW;
    let idx = 0;
    for (let j = 0; j < items.length; j++) {
      r -= items[j].w;
      if (r <= 0) { idx = j; break; }
      idx = j;
    }
    result.push(items[idx].ball);
    items.splice(idx, 1);
  }
  // 不足补齐
  while (result.length < k) {
    const cand = freqs[Math.floor(rng() * freqs.length)].ball;
    if (!result.includes(cand)) result.push(cand);
  }
  return result.sort((a, b) => a - b);
}

/** 从某区域按策略抽取 1 个号码（digit 按位用） */
function pickOneFromRegion(
  region: RegionFreq,
  strategy: PickStrategy,
  omissionMap: Map<number, number>,
  rng: () => number
): number {
  return sampleFromRegion(region, strategy, 1, omissionMap, rng)[0];
}

function omissionMapFor(analysis: UnifiedAnalysis, regionName: string): Map<number, number> {
  const om = analysis.omissions.find((o) => o.name === regionName);
  const m = new Map<number, number>();
  if (om) for (const e of om.entries) m.set(e.ball, e.currentOmission);
  return m;
}

export function generateGamePick(
  strategy: PickStrategy,
  analysis: UnifiedAnalysis,
  def: GameDef,
  rng: () => number = () => Math.random()
): PickResult {
  const reasoningMap: Record<PickStrategy, string> = {
    hot: "偏热号（高频率加权）",
    cold: "偏冷号（低频追冷）",
    balanced: "均衡（中等频率优先）",
    random: "纯随机",
    omission: "高遗漏追号",
  };

  if (def.kind === "pool") {
    const frontRegion = analysis.regions[0];
    const backRegion = analysis.regions[1];
    const front = sampleFromRegion(frontRegion, strategy, def.frontCount, omissionMapFor(analysis, frontRegion.name), rng);
    const back = backRegion
      ? sampleFromRegion(backRegion, strategy, def.backCount, omissionMapFor(analysis, backRegion.name), rng)
      : [];
    return { front, back, strategy, reasoning: reasoningMap[strategy] };
  } else {
    // 数字游戏：逐位抽取
    const front: number[] = [];
    for (let p = 0; p < def.frontCount; p++) {
      const region = analysis.regions[p];
      front.push(pickOneFromRegion(region, strategy, omissionMapFor(analysis, region.name), rng));
    }
    return { front, back: [], strategy, reasoning: reasoningMap[strategy] };
  }
}

/* ════════════════════════════════════════
   演示数据生成（按 GameDef 结构，确定性）
   ════════════════════════════════════════ */

/** 生成某玩法的演示历史数据（真实源不可达时回退，明确标注为演示） */
export function generateDemoData(def: GameDef): DrawRecord[] {
  const records: DrawRecord[] = [];
  // 每种玩法用不同种子保证不重复
  const SEEDS: Record<LotteryType, number> = { ssq: 20030216, dlt: 20070528, fc3d: 20020101, pl3: 20041114, pl5: 20041114, qxc: 20040518 };
  let seed = SEEDS[def.id] ?? 20240101;

  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const startYear = def.kind === "pool" ? (def.id === "ssq" ? 2003 : 2007) : 2004;
  let current = new Date(startYear, 0, 1);
  let issueNum = 1;
  const TARGET = def.kind === "digit" ? 6000 : 2500; // 数字游戏更多期数

  const pickDistinct = (count: number, min: number, max: number): number[] => {
    const pool: number[] = [];
    for (let i = min; i <= max; i++) pool.push(i);
    const out: number[] = [];
    for (let i = 0; i < count; i++) {
      if (pool.length === 0) break;
      const idx = Math.floor(rng() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    return out.sort((a, b) => a - b);
  };
  const pickDigit = (): number => Math.floor(rng() * 10);

  while (records.length < TARGET && current.getFullYear() <= 2026) {
    const day = current.getDay();
    const isDrawDay =
      def.kind === "digit"
        ? true
        : def.id === "ssq"
          ? (day === 2 || day === 4 || day === 0)
          : (day === 1 || day === 3 || day === 6);

    if (isDrawDay) {
      const front =
        def.kind === "pool"
          ? pickDistinct(def.frontCount, def.frontMin, def.frontMax)
          : Array.from({ length: def.frontCount }, () => pickDigit());
      const back =
        def.kind === "pool" && def.backCount > 0
          ? pickDistinct(def.backCount, def.backMin, def.backMax)
          : [];
      const y = current.getFullYear();
      records.push({
        issue: `${y}${String(issueNum).padStart(3, "0")}`,
        date: `${y}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`,
        front,
        back,
      });
      issueNum++;
    }
    current.setDate(current.getDate() + 1);
  }

  return records;
}

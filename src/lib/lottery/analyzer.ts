/* ── 历史数据分析引擎（频率/冷热/遗漏） ── */

import { LotteryType, BallDraw } from "./types";

/* ───────────── 基础类型 ───────────── */

/** 单期开奖记录（存储格式） */
export interface SsqRecord {
  issue: string;       // 期号，如 "2023010"
  date: string;        // 开奖日期
  reds: number[];      // 6个红球 1-33
  blue: number;        // 1个蓝球 1-16
}

/** 号码频率统计 */
export interface BallFrequency {
  ball: number;
  count: number;       // 总出现次数
  frequency: number;   // 频率 = count / totalDraws
  percentage: string;  // 百分比显示
  /** 近 N 期出现次数 */
  recentCount?: { period: number; count: number }[];
}

/** 冷热号分析 */
export interface HotColdAnalysis {
  /** 热号：近100期高频出现的号码 */
  hot: BallFrequency[];
  /** 冷号：近100期低频出现的号码 */
  cold: BallFrequency[];
  /** 温号 */
  warm: BallFrequency[];
  /** 分析的期数范围 */
  windowSize: number;
}

/** 遗漏值（某号码连续多少期未出） */
export interface OmissionEntry {
  ball: number;
  currentOmission: number;  // 当前遗漏（至今未出的期数）
  maxOmission: number;      // 历史最大遗漏
  lastAppearIssue?: string; // 上次出现的期号
  lastAppearDate?: string;  // 上次出现日期
}

/** 完整分析结果 */
export interface SsqAnalysis {
  meta: {
    totalDraws: number;
    dateRange: string;
    latestIssue: string;
    latestDraw: SsqRecord | null;
  };
  redFrequency: BallFrequency[];     // 红球总频率（33个）
  blueFrequency: BallFrequency[];     // 蓝球总频率（16个）
  redHotCold: HotColdAnalysis;       // 红球冷热分布
  redOmission: OmissionEntry[];      // 红球遗漏榜（33个）
  blueOmission: OmissionEntry[];     // 蓝球遗漏榜（16个）
  /** 连号统计 */
  consecutiveStats: {
    avgConsecutivePerDraw: number;
    maxConsecutiveInOneDraw: number;
    mostCommonLength: number;
    lengthDistribution: Record<string, number>;
  };
  /** 和值统计 */
  sumStats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    mode: number;
  };
}

/* ───────────── 内置历史数据生成 ───────────── */

/**
 * 生成双色球模拟历史数据（2003-2018，约2298期）
 * 使用确定性伪随机确保每次生成一致
 * 注意：这是**演示数据**，生产环境应替换为真实开奖数据
 */
export function generateSsqDemoData(): SsqRecord[] {
  const records: SsqRecord[] = [];
  const startDate = new Date(2003, 1, 16); // 双色球首开 2003-02-16
  let issueNum = 1;

  // LCG 伪随机（固定种子，保证可复现）
  let seed = 42;
  const rng = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  // 模拟到 2018 年底 ≈ 2298 期
  const endDate = new Date(2018, 11, 31);
  let currentDate = new Date(startDate);

  while (currentDate <= endDate && records.length < 2300) {
    // 每周二、四、日开奖
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 0) {
      // 生成红球（1-33选6不重复）
      const pool = Array.from({ length: 33 }, (_, i) => i + 1);
      const reds: number[] = [];
      for (let i = 0; i < 6; i++) {
        const idx = Math.floor(rng() * pool.length);
        reds.push(pool.splice(idx, 1)[0]);
      }
      reds.sort((a, b) => a - b);

      // 生成蓝球（1-16选1）
      const blue = Math.floor(rng() * 16) + 1;

      const year = currentDate.getFullYear();
      const issueStr = `${year}${String(issueNum).padStart(3, "0")}`;

      records.push({
        issue: issueStr,
        date: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`,
        reds,
        blue,
      });

      issueNum++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return records;
}

/* ───────────── 分析引擎 ───────────── */

/**
 * 对一组双色球历史数据进行全面统计分析
 * @param records 历史开奖记录数组（按时间升序排列）
 * @returns 完整分析结果
 */
export function analyzeSsqHistory(records: SsqRecord[]): SsqAnalysis {
  if (!records || records.length === 0) {
    return emptyAnalysis();
  }

  const total = records.length;
  const latest = records[records.length - 1];

  // ---- 红球频率统计（33个红球）----
  const redFreqMap = new Map<number, number>();
  for (let b = 1; b <= 33; b++) redFreqMap.set(b, 0);

  const blueFreqMap = new Map<number, number>();
  for (let b = 1; b <= 16; b++) blueFreqMap.set(b, 0);

  for (const r of records) {
    for (const red of r.reds) {
      redFreqMap.set(red, (redFreqMap.get(red) || 0) + 1);
    }
    blueFreqMap.set(r.blue, (blueFreqMap.get(r.blue) || 0) + 1);
  }

  const buildFreq = (ball: number, count: number): BallFrequency => ({
    ball,
    count,
    frequency: count / total,
    percentage: ((count / total) * 100).toFixed(2) + "%",
  });

  const redFrequency = Array.from(redFreqMap.entries()).map(([b, c]) => buildFreq(b, c));
  const blueFrequency = Array.from(blueFreqMap.entries()).map(([b, c]) => buildFreq(b, c));

  // ---- 冷热分析（默认近100期窗口）----
  const WINDOW = Math.min(100, total);
  const recentRecords = records.slice(-WINDOW);

  const recentRedCount = new Map<number, number>();
  for (let b = 1; b <= 33; b++) recentRedCount.set(b, 0);
  for (const r of recentRecords) {
    for (const red of r.reds) {
      recentRedCount.set(red, (recentRedCount.get(red) || 0) + 1);
    }
  }

  const recentBalls = Array.from(recentRedCount.entries())
    .map(([b, c]) => ({ ball: b, recentCount: c }))
    .sort((a, b) => b.recentCount - a.recentCount);

  const coldThreshold = Math.floor(WINDOW * 6 / 33 * 0.7); // 低于均值70%为冷
  const hotThreshold = Math.ceil(WINDOW * 6 / 33 * 1.3);  // 高于均值130%为热

  const hotCold: HotColdAnalysis = {
    hot: recentBalls.filter(b => b.recentCount >= hotThreshold)
      .map(b => ({
        ...buildFreq(b.ball, redFreqMap.get(b.ball)!),
        recentCount: [{ period: WINDOW, count: b.recentCount }],
      })),
    cold: recentBalls.filter(b => b.recentCount <= coldThreshold && b.recentCount > 0)
      .map(b => ({
        ...buildFreq(b.ball, redFreqMap.get(b.ball)!),
        recentCount: [{ period: WINDOW, count: b.recentCount }],
      })),
    warm: recentBalls.filter(b => b.recentCount > coldThreshold && b.recentCount < hotThreshold)
      .map(b => ({
        ...buildFreq(b.ball, redFreqMap.get(b.ball)!),
        recentCount: [{ period: WINDOW, count: b.recentCount }],
      })),
    windowSize: WINDOW,
  };

  // ---- 遗漏榜计算 ----
  const calcOmission = (
    balls: number[],
    getBallsFromRecord: (r: SsqRecord) => number[]
  ): OmissionEntry[] => {
    return balls.map(ball => {
      let currentOmission = 0;
      let maxOmission = 0;
      let tempOmission = 0;
      let lastAppearIssue: string | undefined;
      let lastAppearDate: string | undefined;

      // 从最新往回遍历计算当前遗漏
      for (let i = records.length - 1; i >= 0; i--) {
        const recordBalls = getBallsFromRecord(records[i]);
        if (recordBalls.includes(ball)) {
          lastAppearIssue = records[i].issue;
          lastAppearDate = records[i].date;
          break;
        }
        currentOmission++;
      }

      // 全量扫描计算最大遗漏
      tempOmission = 0;
      for (let i = 0; i < records.length; i++) {
        const recordBalls = getBallsFromRecord(records[i]);
        if (recordBalls.includes(ball)) {
          if (tempOmission > maxOmission) maxOmission = tempOmission;
          tempOmission = 0;
        } else {
          tempOmission++;
        }
      }
      if (tempOmission > maxOmission) maxOmission = tempOmission;

      return { ball, currentOmission, maxOmission, lastAppearIssue, lastAppearDate };
    });
  };

  const redOmission = calcOmission(
    Array.from({ length: 33 }, (_, i) => i + 1),
    r => r.reds
  );
  const blueOmission = calcOmission(
    Array.from({ length: 16 }, (_, i) => i + 1),
    r => [r.blue]
  );

  // ---- 连号统计 ----
  const consecutives: number[] = [];
  let maxConsInOne = 0;

  for (const r of records) {
    const sorted = [...r.reds].sort((a, b) => a - b);
    let consLen = 1;
    let maxThisDraw = 1;

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] === 1) {
        consLen++;
        if (consLen > maxThisDraw) maxThisDraw = consLen;
      } else {
        if (consLen > 1) consecutives.push(consLen);
        consLen = 1;
      }
    }
    if (consLen > 1) consecutives.push(consLen);
    if (maxThisDraw > maxConsInOne) maxConsInOne = maxThisDraw;
  }

  const lenDist: Record<string, number> = {};
  for (const c of consecutives) {
    lenDist[String(c)] = (lenDist[String(c)] || 0) + 1;
  }

  // 找最常见的连号长度
  let mostCommonLen = 0;
  let mostCommonCount = 0;
  for (const [len, cnt] of Object.entries(lenDist)) {
    if (cnt > mostCommonCount) {
      mostCommonCount = cnt;
      mostCommonLen = parseInt(len);
    }
  }

  const consecutiveStats = {
    avgConsecutivePerDraw: consecutives.length / total,
    maxConsecutiveInOneDraw: maxConsInOne,
    mostCommonLength: mostCommonLen,
    lengthDistribution: lenDist,
  };

  // ---- 和值统计（红球和值）----
  const sums = records.map(r => r.reds.reduce((a, b) => a + b, 0));
  sums.sort((a, b) => a - b);

  const mean = sums.reduce((a, b) => a + b, 0) / total;
  const variance = sums.reduce((a, b) => a + (b - mean) ** 2, 0) / total;

  // 计算众数
  const modeMap = new Map<number, number>();
  for (const s of sums) modeMap.set(s, (modeMap.get(s) || 0) + 1);
  let mode = sums[0];
  let modeCount = 0;
  for (const [val, cnt] of modeMap) {
    if (cnt > modeCount) { modeCount = cnt; mode = val; }
  }

  const sumStats = {
    mean: Math.round(mean * 10) / 10,
    stdDev: Math.round(Math.sqrt(variance) * 10) / 10,
    min: sums[0],
    max: sums[sums.length - 1],
    mode,
  };

  return {
    meta: {
      totalDraws: total,
      dateRange: `${records[0]?.date || "N/A"} ~ ${latest?.date || "N/A"}`,
      latestIssue: latest?.issue || "N/A",
      latestDraw: latest,
    },
    redFrequency,
    blueFrequency,
    redHotCold: hotCold,
    redOmission,
    blueOmission,
    consecutiveStats,
    sumStats,
  };
}

function emptyAnalysis(): SsqAnalysis {
  return {
    meta: { totalDraws: 0, dateRange: "", latestIssue: "", latestDraw: null },
    redFrequency: [],
    blueFrequency: [],
    redHotCold: { hot: [], cold: [], warm: [], windowSize: 100 },
    redOmission: [],
    blueOmission: [],
    consecutiveStats: {
      avgConsecutivePerDraw: 0,
      maxConsecutiveInOneDraw: 0,
      mostCommonLength: 0,
      lengthDistribution: {},
    },
    sumStats: { mean: 0, stdDev: 0, min: 0, max: 0, mode: 0 },
  };
}

/* ───────────── 选号辅助（加权随机，不预测） ───────────── */

export type PickStrategy = "hot" | "cold" | "balanced" | "random" | "omission";

export interface PickResult {
  reds: number[];
  blue: number;
  strategy: PickStrategy;
  reasoning: string;
}

/**
 * 基于历史统计数据生成候选组合
 * ⚠️ 仅基于频率加权随机，不预测未来，不提高中奖率
 */
export function generateWeightedPick(
  strategy: PickStrategy,
  analysis: SsqAnalysis,
  rng: () => number = () => Math.random()
): PickResult {
  switch (strategy) {
    case "hot":
      return pickByTemperature(analysis.redHotCold.hot, "热号偏重", rng);
    case "cold":
      return pickByTemperature(analysis.redHotCold.cold, "冷号偏重（追冷）", rng);
    case "balanced":
      return pickBalanced(analysis, rng);
    case "omission":
      return pickByOmission(analysis.redOmission, "高遗漏追号", rng);
    case "random":
    default:
      return pickRandom(rng);
  }
}

/** 热号/冷号加权选取 */
function pickByTemperature(
  source: BallFrequency[],
  label: string,
  rng: () => number
): PickResult {
  // 如果源数据不足，退化为随机
  if (source.length < 6) return pickRandom(rng);

  // 按频率作为权重
  const weights = source.map(f => f.frequency);
  const reds = weightedSampleWithoutReplacement(
    source.map(f => f.ball),
    weights,
    6,
    rng
  ).sort((a, b) => a - b);
  const blue = Math.floor(rng() * 16) + 1;

  return { reds, blue, strategy: label.includes("热") ? "hot" : "cold", reasoning: label };
}

/** 均衡选取（2热+2温+2冷） */
function pickBalanced(analysis: SsqAnalysis, rng: () => number): PickResult {
  const hot = analysis.redHotCold.hot.slice();
  const cold = analysis.redHotCold.cold.slice();
  const warm = analysis.redHotCold.warm.slice();

  const shuffle = <T>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const reds: number[] = [];

  // 取2个热号
  const shuffledHot = shuffle(hot);
  for (let i = 0; i < Math.min(2, shuffledHot.length); i++) {
    reds.push(shuffledHot[i].ball);
  }

  // 取2个温号
  const shuffledWarm = shuffle(warm);
  for (let i = 0; i < Math.min(2, shuffledWarm.length); i++) {
    reds.push(shuffledWarm[i].ball);
  }

  // 取2个冷号
  const shuffledCold = shuffle(cold);
  for (let i = 0; i < Math.min(2, shuffledCold.length); i++) {
    reds.push(shuffledCold[i].ball);
  }

  // 不够的用随机补齐
  while (reds.length < 6) {
    const candidate = Math.floor(rng() * 33) + 1;
    if (!reds.includes(candidate)) reds.push(candidate);
  }

  reds.sort((a, b) => a - b);
  const blue = Math.floor(rng() * 16) + 1;

  return { reds, blue, strategy: "balanced", reasoning: "均衡策略：2热+2温+2冷组合" };
}

/** 按遗漏值选取（高遗漏优先） */
function pickByOmission(
  omissions: OmissionEntry[],
  label: string,
  rng: () => number
): PickResult {
  // 按当前遗漏值排序，取遗漏最大的
  const sorted = [...omissions].sort((a, b) => b.currentOmission - a.currentOmission);
  const topPool = sorted.slice(0, 15); // 取前15个高遗漏号

  const reds: number[] = [];
  while (reds.length < 6 && topPool.length > 0) {
    const idx = Math.floor(rng() * Math.min(topPool.length, 10));
    const ball = topPool[idx].ball;
    if (!reds.includes(ball)) reds.push(ball);
  }

  // 补足
  while (reds.length < 6) {
    const candidate = Math.floor(rng() * 33) + 1;
    if (!reds.includes(candidate)) reds.push(candidate);
  }

  reds.sort((a, b) => a - b);
  const blue = Math.floor(rng() * 16) + 1;

  return { reds, blue, strategy: "omission", reasoning: label };
}

/** 完全随机选取 */
function pickRandom(rng: () => number): PickResult {
  const pool = Array.from({ length: 33 }, (_, i) => i + 1);
  const reds: number[] = [];
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(rng() * pool.length);
    reds.push(pool.splice(idx, 1)[0]);
  }
  reds.sort((a, b) => a - b);
  const blue = Math.floor(rng() * 16) + 1;
  return { reds, blue, strategy: "random", reasoning: "纯随机选取" };
}

/**
 * 加权无放回抽样
 */
function weightedSampleWithoutReplacement(
  items: number[],
  weights: number[],
  k: number,
  rng: () => number
): number[] {
  const result: number[] = [];
  const remaining = items.map((item, i) => ({ item, weight: weights[i] }));

  for (let i = 0; i < k && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, r) => sum + Math.max(r.weight, 0.001), 0);
    let rand = rng() * totalWeight;

    for (let j = 0; j < remaining.length; j++) {
      rand -= Math.max(remaining[j].weight, 0.001);
      if (rand <= 0) {
        result.push(remaining[j].item);
        remaining.splice(j, 1);
        break;
      }
    }
  }

  // 不足时随机补齐
  while (result.length < k) {
    const idx = Math.floor(rng() * items.length);
    if (!result.includes(items[idx])) result.push(items[idx]);
  }

  return result;
}

/* ── 彩票模块统一类型定义 ── */

/** 支持的彩票玩法（6 种，均可计算概率；历史统计/选号已通用化支持） */
export type LotteryType = "ssq" | "dlt" | "fc3d" | "pl3" | "pl5" | "qxc";

/** 彩票玩法配置 */
export interface LotteryConfig {
  id: LotteryType;
  name: string;
  fullName: string;
  price: number;
  poolDesc: string;
  drawSchedule: string;
}

/** 双色球/大乐透 红蓝球号码 */
export interface BallDraw {
  reds: number[];
  blues?: number[];
}

/** 开奖结果 */
export interface DrawResult {
  issue: string;
  date: string;
  balls: BallDraw;
  sales?: number;
  pool?: number;
}

/** 中奖等级 */
export interface PrizeLevel {
  level: string;
  condition: string;
  odds: string;
  prize: string;
  probability: number;
}

/** 玩法完整定义 */
export interface LotteryGame {
  config: LotteryConfig;
  rules: string;
  prizes: PrizeLevel[];
  totalCombinations: number;
}

/** 模拟投注结果 */
export interface SimulationResult {
  id: string;
  lotteryType: LotteryType;
  bets: number;
  simulations: number;
  wins: Record<string, number>;
  totalCost: number;
  totalPrize: number;
  roi: number;
  createdAt: string;
}

/** 统计快照 - 存入 Storage 的 JSON 结构 */
export interface LotteryStatsSnapshot {
  version: string;
  updatedAt: string;
  games: Record<LotteryType, {
    totalSimulations: number;
    totalBets: number;
    totalCost: number;
    totalPrize: number;
    avgRoi: number;
    lastUpdated: string;
  }>;
  recentSimulations: SimulationResult[];
}

/* ════════════════════════════════════════════════════
   统一数据结构（覆盖 6 种玩法）
   ════════════════════════════════════════════════════ */

/** 统一开奖记录：front=主号码区，back=特殊球区（数字游戏 back 为空） */
export interface DrawRecord {
  issue: string;
  date: string;
  front: number[];
  back: number[];
}

/** 玩法结构定义 —— 驱动解析、分析与 UI 渲染 */
export interface GameDef {
  id: LotteryType;
  name: string;
  /** pool: 红球/蓝球式（SSQ/DLT）；digit: 按位数字式（3D/PL3/PL5/QXC） */
  kind: "pool" | "digit";
  frontCount: number;   // SSQ 6 / DLT 5 / 3D 3 / PL3 3 / PL5 5 / QXC 7
  frontMin: number;     // pool 1 / digit 0
  frontMax: number;     // pool 33|35 / digit 9
  backCount: number;    // SSQ 1 / DLT 2 / digit 0
  backMin: number;      // pool 1
  backMax: number;      // SSQ 16 / DLT 12
  drawSchedule: string;
  /** 抓取源 URL（17500.cn 等）；为空则仅演示数据 */
  sourceUrl?: string;
}

/** 单号码频率统计 */
export interface BallFrequency {
  ball: number;
  count: number;
  frequency: number;
  percentage: string;
  recentCount?: { period: number; count: number }[];
}

/** 冷热号分析 */
export interface HotColdAnalysis {
  hot: BallFrequency[];
  cold: BallFrequency[];
  warm: BallFrequency[];
  windowSize: number;
}

/** 遗漏值 */
export interface OmissionEntry {
  ball: number;
  currentOmission: number;
  maxOmission: number;
  lastAppearIssue?: string;
  lastAppearDate?: string;
}

/** 一个"区域"的频率分组（红球区 / 蓝球区 / 第 N 位） */
export interface RegionFreq {
  name: string;
  freqs: BallFrequency[];
  isSpecial?: boolean;
}

/** 统一分析结果（前端按 kind 渲染） */
export interface UnifiedAnalysis {
  meta: {
    totalDraws: number;
    dateRange: string;
    latestIssue: string;
    latestDraw: DrawRecord | null;
    gameId: LotteryType;
  };
  /** 频率区域：pool=[前区,后区]；digit=[第1位…第N位] */
  regions: RegionFreq[];
  /** 仅 pool 前区有冷热 */
  hotCold?: HotColdAnalysis;
  /** 每个区域一个遗漏榜 */
  omissions: { name: string; entries: OmissionEntry[] }[];
  /** 仅 pool 有连号统计 */
  consecutiveStats?: {
    avgConsecutivePerDraw: number;
    maxConsecutiveInOneDraw: number;
    mostCommonLength: number;
    lengthDistribution: Record<string, number>;
  };
  sumStats: {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    mode: number;
  };
}

export type PickStrategy = "hot" | "cold" | "balanced" | "random" | "omission";

export interface PickResult {
  front: number[];
  back: number[];
  strategy: PickStrategy;
  reasoning: string;
}

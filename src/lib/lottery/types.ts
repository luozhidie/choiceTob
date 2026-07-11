/* ── 福利彩票类型定义 ── */

/** 支持的彩票玩法 */
export type LotteryType = "ssq" | "dlt" | "fc3d" | "pl3" | "pl5" | "qxc";

/** 彩票玩法配置 */
export interface LotteryConfig {
  /** 玩法标识 */
  id: LotteryType;
  /** 显示名称 */
  name: string;
  /** 全称 */
  fullName: string;
  /** 单注价格（元） */
  price: number;
  /** 奖池描述 */
  poolDesc: string;
  /** 开奖周期 */
  drawSchedule: string;
}

/** 双色球/大乐透 红蓝球号码 */
export interface BallDraw {
  reds: number[];   // 红球/前区
  blues?: number[]; // 蓝球/后区（可选）
}

/** 开奖结果 */
export interface DrawResult {
  /** 期号 */
  issue: string;
  /** 开奖日期 */
  date: string;
  /** 号码 */
  balls: BallDraw;
  /** 销售额(元) */
  sales?: number;
  /** 奖池余额(元) */
  pool?: number;
}

/** 中奖等级 */
export interface PrizeLevel {
  level: string;      // 等级名称，如"一等奖"
  condition: string;   // 中奖条件描述
  odds: string;        // 概率描述，如"1/17,721,088"
  prize: string;       // 奖金范围
  probability: number; // 精确概率值
}

/** 玩法完整定义 */
export interface LotteryGame {
  config: LotteryConfig;
  rules: string;           // 玩法说明
  prizes: PrizeLevel[];    // 奖级设置
  totalCombinations: number; // 总组合数
}

/** 模拟投注结果 */
export interface SimulationResult {
  id: string;
  lotteryType: LotteryType;
  /** 投注注数 */
  bets: number;
  /** 模拟期数 */
  simulations: number;
  /** 各等级中奖次数 */
  wins: Record<string, number>;
  /** 总花费 */
  totalCost: number;
  /** 总奖金 */
  totalPrize: number;
  /** ROI */
  roi: number;
  /** 创建时间 */
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

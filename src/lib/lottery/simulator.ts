/* ── 彩票蒙特卡洛模拟投注 ── */

import { LotteryType, SimulationResult, BallDraw } from "./types";
import { getLotteryGame } from "./probability";

/* ───────────── 随机数生成器（可复现） ───────────── */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/** 从池中随机抽取不重复的 n 个球 */
function pickBalls(pool: number, count: number, rng: () => number): number[] {
  const balls = Array.from({ length: pool }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * balls.length);
    result.push(balls.splice(idx, 1)[0]);
  }
  return result.sort((a, b) => a - b);
}

/* ───────────── 生成一注随机号码 ───────────── */
export function generateRandomBet(type: LotteryType, rng?: () => number): BallDraw {
  const _rng = rng ?? (() => Math.random());

  switch (type) {
    case "ssq":
      return { reds: pickBalls(33, 6, _rng), blues: pickBalls(16, 1, _rng) };
    case "dlt":
      return { reds: pickBalls(35, 5, _rng), blues: pickBalls(12, 2, _rng) };
    case "fc3d":
    case "pl3": {
      const digits = Array.from({ length: 3 }, () => Math.floor(_rng() * 10));
      return { reds: digits };
    }
    case "pl5": {
      const digits = Array.from({ length: 5 }, () => Math.floor(_rng() * 10));
      return { reds: digits };
    }
    case "qxc": {
      const digits = Array.from({ length: 7 }, () => Math.floor(_rng() * 10));
      return { reds: digits };
    }
    default:
      return { reds: pickBalls(33, 6, _rng), blues: pickBalls(16, 1, _rng) };
  }
}

/* ───────────── 判定中奖等级 ───────────── */
function checkPrize(bet: BallDraw, draw: BallDraw, type: LotteryType): string | null {
  switch (type) {
    case "ssq": {
      const redMatch = bet.reds.filter(r => draw.reds.includes(r)).length;
      const blueMatch = (bet.blues && draw.blues)
        ? bet.blues.filter(b => draw.blues.includes(b)).length
        : 0;
      if (redMatch === 6 && blueMatch === 1) return "一等奖";
      if (redMatch === 6 && blueMatch === 0) return "二等奖";
      if (redMatch === 5 && blueMatch === 1) return "三等奖";
      if (redMatch === 5 || (redMatch === 4 && blueMatch === 1)) return "四等奖";
      if (redMatch === 4 || (redMatch === 3 && blueMatch === 1)) return "五等奖";
      if (blueMatch === 1 && redMatch <= 2) return "六等奖";
      return null;
    }

    case "dlt": {
      const frontMatch = bet.reds.filter(r => draw.reds.includes(r)).length;
      const backMatch = (bet.blues && draw.blues)
        ? bet.blues.filter(b => draw.blues.includes(b)).length
        : 0;
      if (frontMatch === 5 && backMatch === 2) return "一等奖";
      if (frontMatch === 5 && backMatch === 1) return "二等奖";
      if ((frontMatch === 5 && backMatch === 0) || (frontMatch === 4 && backMatch === 2)) return "三等奖";
      if ((frontMatch === 4 && backMatch === 1) || (frontMatch === 3 && backMatch === 2)) return "四等奖";
      if ((frontMatch === 4 && backMatch === 0) || (frontMatch === 2 && backMatch === 2)) return "五等奖";
      if (frontMatch === 3 && backMatch === 1) return "六等奖";
      if ((frontMatch === 3 && backMatch === 0) || (frontMatch === 2 && backMatch === 1) || (frontMatch === 1 && backMatch === 2)) return "七等奖";
      if ((frontMatch === 2 && backMatch === 0) || (frontMatch === 1 && backMatch === 1) || (frontMatch === 0 && backMatch === 2)) return "八等奖";
      return null;
    }

    case "fc3d":
    case "pl3": {
      // 直选
      if (bet.reds.every((v, i) => v === draw.reds[i])) return "直选";
      // 组选
      const sortedBet = [...bet.reds].sort();
      const sortedDraw = [...draw.reds].sort();
      if (sortedBet.every((v, i) => v === sortedDraw[i])) {
        // 检查是否有重复数字
        const uniqCount = new Set(sortedBet).size;
        return uniqCount === 2 ? "组选3" : "组选6";
      }
      return null;
    }

    case "pl5":
    case "qxc":
      if (bet.reds.every((v, i) => v === draw.reds[i])) return bet.reds.length === 7 ? "一等奖" : "直选";
      return null;

    default:
      return null;
  }
}

/** 奖金估算表（取中间值） */
const PRIZE_ESTIMATES: Record<string, number> = {
  "一等奖": 5000000,
  "二等奖": 200000,
  "三等奖": 3000,
  "四等奖": 200,
  "五等奖": 10,
  "六等奖": 5,
  "七等奖": 5,
  "八等奖": 2,
  "直选": 1040,
  "组选3": 346,
  "组选6": 173,
};

/* ───────────── 执行一次模拟 ───────────── */
export interface SimulationParams {
  lotteryType: LotteryType;
  bets: number;       // 每期投注注数
  simulations: number; // 模拟期数
  seed?: number;       // 随机种子（可选，用于复现）
}

/**
 * 运行蒙特卡洛模拟
 * @returns 模拟结果 + 详细每期记录（前100期）
 */
export function runSimulation(params: SimulationParams): SimulationResult & { details: Array<{ issue: string; wins: Record<string, number>; prize: number }> } {
  const { lotteryType, bets, simulations, seed } = params;
  const game = getLotteryGame(lotteryType);
  const rng = seededRandom(seed ?? Date.now());

  const wins: Record<string, number> = {};
  let totalPrize = 0;
  const details: Array<{ issue: string; wins: Record<string, number>; prize: number }> = [];

  for (let i = 0; i < simulations; i++) {
    // 生成开奖号码
    const draw = generateRandomBet(lotteryType, rng);

    let roundPrize = 0;
    const roundWins: Record<string, number> = {};

    for (let j = 0; j < bets; j++) {
      // 生成一注投注
      const bet = generateRandomBet(lotteryType, rng);
      const prizeLevel = checkPrize(bet, draw, lotteryType);

      if (prizeLevel) {
        wins[prizeLevel] = (wins[prizeLevel] || 0) + 1;
        roundWins[prizeLevel] = (roundWins[prizeLevel] || 0) + 1;
        roundPrize += PRIZE_ESTIMATES[prizeLevel] || 0;
      }
    }

    totalPrize += roundPrize;

    // 只记录前100期的详细信息
    if (i < 100) {
      details.push({
        issue: `第${i + 1}期`,
        wins: roundWins,
        prize: roundPrize,
      });
    }
  }

  const totalCost = bets * game.config.price * simulations;
  const roi = totalCost > 0 ? (totalPrize - totalCost) / totalCost : 0;

  return {
    id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    lotteryType,
    bets,
    simulations,
    wins,
    totalCost,
    totalPrize,
    roi,
    createdAt: new Date().toISOString(),
    details,
  };
}

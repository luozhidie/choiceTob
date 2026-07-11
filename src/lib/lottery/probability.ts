/* ── 彩票概率计算核心 ── */

import { LotteryType, LotteryGame, PrizeLevel, BallDraw, GameDef } from "./types";

/* ─────────────────── 组合数 C(n,k) ─────────────────── */
function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = result * (n - i + 1) / i;
  }
  return Math.round(result);
}

/* ─────────────────── 阶乘 ─────────────────── */
function factorial(n: number): number {
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/* ───────────── 双色球 (SSQ) 定义 ───────────── */
function getSsqGame(): LotteryGame {
  const RED_POOL = 33;   // 红球 1-33
  const RED_PICK = 6;    // 选6个红
  const BLUE_POOL = 16;  // 蓝球 1-16
  const BLUE_PICK = 1;   // 选1个蓝

  const total = combinations(RED_POOL, RED_PICK) * combinations(BLUE_POOL, BLUE_PICK); // 17,721,088

  const prizes: PrizeLevel[] = [
    { level: "一等奖", condition: "6红+1蓝", odds: "1/17,721,088", prize: "5,000,000~1000万+", probability: 1 / total },
    { level: "二等奖", condition: "6红+0蓝", odds: "1/11,813,572", prize: "10万~500万", probability: combinations(BLUE_POOL - BLUE_PICK, 1) / total },
    { level: "三等奖", condition: "5红+1蓝", odds: "1/109,169", prize: "3,000元", probability: combinations(RED_PICK, 5) * combinations(RED_POOL - RED_PICK, 1) * 1 / total },
    { level: "四等奖", condition: "5红+0蓝 或 4红+1蓝", odds: "1/7,293", prize: "200元", probability: (combinations(RED_PICK, 5) * combinations(RED_POOL - RED_PICK, 1) * (BLUE_POOL - 1) + combinations(RED_PICK, 4) * combinations(RED_POOL - RED_PICK, 2) * 1) / total },
    { level: "五等奖", condition: "4红+0蓝 或 3红+1蓝", odds: "1/431", prize: "10元", probability: (combinations(RED_PICK, 4) * combinations(RED_POOL - RED_PICK, 2) * (BLUE_POOL - 1) + combinations(RED_PICK, 3) * combinations(RED_POOL - RED_PICK, 3) * 1) / total },
    { level: "六等奖", condition: "2红+1蓝 或 1红+1蓝 或 0红+1蓝", odds: "1/17", prize: "5元", probability: (combinations(RED_PICK, 2) * combinations(RED_POOL - RED_PICK, 4) + combinations(RED_PICK, 1) * combinations(RED_POOL - RED_PICK, 5) + combinations(RED_POOL - RED_PICK, 6)) * 1 / total },
  ];

  return {
    config: { id: "ssq", name: "双色球", fullName: "中国福利彩票双色球", price: 2, poolDesc: "最高1000万", drawSchedule: "每周二、四、日" },
    rules: `从 01-33 中选 6 个红球，从 01-16 中选 1 个蓝球。单注2元。
中奖规则：
• 一等奖：6红+1蓝
• 二等奖：6红（无蓝）
• 三等奖：5红+1蓝
• 四等奖：5红 或 4红+1蓝
• 五等奖：4红 或 3红+1蓝
• 六等奖：有蓝（2红及以下）`,
    prizes,
    totalCombinations: total,
  };
}

/* ───────────── 大乐透 (DLT) 定义 ───────────── */
function getDltGame(): LotteryGame {
  const FRONT_POOL = 35;  // 前区 1-35
  const FRONT_PICK = 5;   // 选5个前区
  const BACK_POOL = 12;   // 后区 1-12
  const BACK_PICK = 2;    // 选2个后区

  const total = combinations(FRONT_POOL, FRONT_PICK) * combinations(BACK_POOL, BACK_PICK); // 21,425,712

  const prizes: PrizeLevel[] = [
    { level: "一等奖", condition: "5前+2后", odds: "1/21,425,712", prize: "500万~1000万+", probability: 1 / total },
    { level: "二等奖", condition: "5前+1后", odds: "1/3,571,952", prize: "10万~500万", probability: 2 / total },
    { level: "三等奖", condition: "5前+0后 或 4前+2后", odds: "1/476,673", prize: "3,000~10,000元", probability: (1 + combinations(FRONT_PICK, 4) * combinations(FRONT_POOL - FRONT_PICK, 1)) / total },
    { level: "四等奖", condition: "4前+1后 或 3前+2后", odds: "1/26,482", prize: "200~3000元", probability: (combinations(FRONT_PICK, 4) * combinations(FRONT_POOL - FRONT_PICK, 1) * 2 + combinations(FRONT_PICK, 3) * combinations(FRONT_POOL - FRONT_PICK, 2) * 1) / total },
    { level: "五等奖", condition: "4前+0后 或 2前+2后", odds: "1/3,099", prize: "10~200元", probability: (combinations(FRONT_PICK, 4) * combinations(FRONT_POOL - FRONT_PICK, 1) * 1 + combinations(FRONT_PICK, 2) * combinations(FRONT_POOL - FRONT_PICK, 3) * 1) / total },
    { level: "六等奖", condition: "3前+1后", odds: "1/883", prize: "5~10元", probability: combinations(FRONT_PICK, 3) * combinations(FRONT_POOL - FRONT_PICK, 2) * 2 / total },
    { level: "七等奖", condition: "3前+0后 或 2前+1后 或 1前+2后", odds: "1/107", prize: "5元", probability: (combinations(FRONT_PICK, 3) * combinations(FRONT_POOL - FRONT_PICK, 2) * 1 + combinations(FRONT_PICK, 2) * combinations(FRONT_POOL - FRONT_PICK, 3) * 2 + combinations(FRONT_PICK, 1) * combinations(FRONT_POOL - FRONT_PICK, 4) * 1) / total },
    { level: "八等奖", condition: "2前+0后 或 1前+1后 或 0前+2后", odds: "1/19", prize: "2元", probability: (combinations(FRONT_PICK, 2) * combinations(FRONT_POOL - FRONT_PICK, 3) * 1 + combinations(FRONT_PICK, 1) * combinations(FRONT_POOL - FRONT_PICK, 4) * 2 + combinations(FRONT_POOL - FRONT_PICK, 5) * 1) / total },
  ];

  return {
    config: { id: "dlt", name: "大乐透", fullName: "中国体育彩票超级大乐透", price: 2, poolDesc: "最高1000万", drawSchedule: "每周一、三、六" },
    rules: `从 01-35 中选 5 个前区号码，从 01-12 中选 2 个后区号码。单注2元。
追加投注每注+1元，奖金翻倍（一/二等奖）。`,
    prizes,
    totalCombinations: total,
  };
}

/* ───────── 福彩3D / 排列3 ───────── */
function getFc3dGame(): LotteryGame {
  const total = 1000; // 000-999

  const prizes: PrizeLevel[] = [
    { level: "直选", condition: "3位完全匹配", odds: "1/1,000", prize: "1040元", probability: 1 / total },
    { level: "组选3", condition: "2位相同，顺序不限", odds: "1/333", prize: "346元", probability: 3 / total },
    { level: "组选6", condition: "3位各不同，顺序不限", odds: "1/167", prize: "173元", probability: 6 / total },
  ];

  return {
    config: { id: "fc3d", name: "福彩3D", fullName: "中国福利彩票3D游戏", price: 2, poolDesc: "固定奖", drawSchedule: "每日" },
    rules: `从 000-999 中选择一个三位数。
• 直选：号码和顺序完全一致
• 组选3：含一对相同数字（如112），顺序不限
• 组选6：三个数字各不相同，顺序不限`,
    prizes,
    totalCombinations: total,
  };
}

/* ───────── 排列5 ───────── */
function getPl5Game(): LotteryGame {
  const total = 100000;

  const prizes: PrizeLevel[] = [
    { level: "直选", condition: "5位完全匹配", odds: "1/100,000", prize: "100,000元", probability: 1 / total },
  ];

  return {
    config: { id: "pl5", name: "排列5", fullName: "中国体育彩票排列5", price: 2, poolDesc: "固定奖10万", drawSchedule: "每日" },
    rules: `从 00000-99999 中选择一个五位数。号码和顺序必须完全一致。`,
    prizes,
    totalCombinations: total,
  };
}

/* ───────── 七星彩 ───────── */
function getQxcGame(): LotteryGame {
  const total = 10000000;

  const prizes: PrizeLevel[] = [
    { level: "一等奖", condition: "7位全中", odds: "1/10,000,000", prize: "500万元", probability: 1 / total },
    { level: "二等奖", condition: "前6位中", odds: "1/1,000,000", prize: "5,000~50,000元", probability: 10 / total },
    { level: "三等奖", condition: "前5位中 或 后4位中", odds: "1/110,000", prize: "300~3,000元", probability: (100 + 90) / total },
    { level: "四等奖", condition: "前4位中 或 后3位中", odds: "1/11,000", prize: "20~200元", probability: (1000 + 900) / total },
    { level: "五等奖", condition: "前3位中 或 后2位中", odds: "1/1,100", prize: "5元", probability: (10000 + 9000) / total },
    { level: "六等奖", condition: "前2位中", odds: "1/110", prize: "5元", probability: 100000 / total },
  ];

  return {
    config: { id: "qxc", name: "七星彩", fullname: "中国体育彩票七星彩", price: 2, poolDesc: "最高500万", draw: "每周二、五、日" },
    rules: `从 0000000-9999999 中选择一个七位数。
按位匹配，从前到后或从后往前计奖。`,
    prizes,
    totalCombinations: total,
  };
}

/* ───────────── 玩法结构定义（驱动解析/分析/UI） ───────────── */

const GAME_DEFS: Record<LotteryType, GameDef> = {
  ssq:  { id: "ssq",  name: "双色球", kind: "pool",  frontCount: 6, frontMin: 1, frontMax: 33, backCount: 1, backMin: 1, backMax: 16, drawSchedule: "每周二、四、日", sourceUrl: "http://data.17500.cn/ssq_asc.txt" },
  dlt:  { id: "dlt",  name: "大乐透", kind: "pool",  frontCount: 5, frontMin: 1, frontMax: 35, backCount: 2, backMin: 1, backMax: 12, drawSchedule: "每周一、三、六", sourceUrl: "http://data.17500.cn/dlt_asc.txt" },
  fc3d: { id: "fc3d", name: "福彩3D", kind: "digit", frontCount: 3, frontMin: 0, frontMax: 9,  backCount: 0, backMin: 0, backMax: 0,  drawSchedule: "每日",       sourceUrl: "http://data.17500.cn/3d_asc.txt" },
  pl3:  { id: "pl3",  name: "排列3",  kind: "digit", frontCount: 3, frontMin: 0, frontMax: 9,  backCount: 0, backMin: 0, backMax: 0,  drawSchedule: "每日",       sourceUrl: "http://data.17500.cn/pl3_asc.txt" },
  pl5:  { id: "pl5",  name: "排列5",  kind: "digit", frontCount: 5, frontMin: 0, frontMax: 9,  backCount: 0, backMin: 0, backMax: 0,  drawSchedule: "每日",       sourceUrl: "http://data.17500.cn/pl5_asc.txt" },
  qxc:  { id: "qxc",  name: "七星彩", kind: "digit", frontCount: 7, frontMin: 0, frontMax: 9,  backCount: 0, backMin: 0, backMax: 0,  drawSchedule: "每周二、五、日" },
};

/** 获取玩法结构定义 */
export function getGameDef(type: LotteryType): GameDef {
  return GAME_DEFS[type] || GAME_DEFS.ssq;
}

/** ───────────── 导出 ───────────── */

/** 获取指定玩法完整定义 */
export function getLotteryGame(type: LotteryType): LotteryGame {
  switch (type) {
    case "ssq": return getSsqGame();
    case "dlt": return getDltGame();
    case "fc3d": return getFc3dGame();
    case "pl3": return getFc3dGame(); // 排列3与福彩3D规则类似
    case "pl5": return getPl5Game();
    case "qxc": return getQxcGame();
    default: return getSsqGame();
  }
}

/** 获取所有支持的游戏列表（6 种） */
export function getAllGames(): { type: LotteryType; game: LotteryGame }[] {
  return (["ssq", "dlt", "fc3d", "pl3", "pl5", "qxc"] as LotteryType[]).map(type => ({
    type,
    game: getLotteryGame(type),
  }));
}

/* ───────────── 概率工具函数 ───────────── */

/** 将概率转换为易读的分数形式 */
export function formatOdds(probability: number): string {
  if (probability <= 0) return "不可能";
  if (probability >= 1) return "必然";
  const denom = Math.round(1 / probability);
  return `1/${denom.toLocaleString()}`;
}

/** 计算期望值（基于概率和奖金） */
export function expectedValue(prizes: PrizeLevel[]): number {
  return prizes.reduce((sum, p) => {
    // 取奖金中间值做估算
    const avgPrize = parsePrize(p.prize);
    return sum + p.probability * avgPrize;
  }, 0);
}

/** 解析奖金字符串为数值 */
function parsePrize(prizeStr: string): number {
  const nums = prizeStr.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return 0;
  // 取范围的平均值
  const values = nums.map(n => parseFloat(n));
  return values.reduce((a, b) => a + b, 0) / values.length;
}

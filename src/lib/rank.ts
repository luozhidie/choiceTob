/**
 * 全国销售排名估算（前端包装）
 *
 * 当前平台刚起步，暂无真实全国店主销售额数据库，
 * 排名基于输入的上月销售额做分段映射，用于认证后的激励展示。
 * 后续接入真实数据后可替换为后端计算。
 *
 * 返回：超过全国百分之多少的店主（0-100 整数）
 */

// 分段阈值（单位：元）
const TIERS: { min: number; exceed: number }[] = [
  { min: 1_000_000, exceed: 95 }, // ≥100万 → 超过 95%
  { min: 300_000,  exceed: 85 }, // ≥30万  → 超过 85%
  { min: 100_000,  exceed: 60 }, // ≥10万  → 超过 60%
  { min: 30_000,   exceed: 35 }, // ≥3万   → 超过 35%
  { min: 0,        exceed: 15 }, // 其他   → 超过 15%
];

export function estimateRankPercent(monthlySalesYuan: number): number {
  const s = Number(monthlySalesYuan) || 0;
  for (const t of TIERS) {
    if (s >= t.min) return t.exceed;
  }
  return 15;
}

/** 友好的排名文案 */
export function rankText(monthlySalesYuan: number): string {
  const pct = estimateRankPercent(monthlySalesYuan);
  return `您上月超过了全国 ${pct}% 的店主`;
}

/** 千分位格式化（元） */
export function formatYuan(n: number): string {
  return (n || 0).toLocaleString("zh-CN");
}

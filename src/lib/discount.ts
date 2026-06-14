/**
 * 会员折扣计算模块
 *
 * 会员等级体系（基于充值金额）：
 * - 非会员: 原价
 * - 银卡 (充5万): 2.8折 + 返利5%
 * - 金卡 (充10万): 2.8折 + 返利10%
 * - 钻石 (充30万): 2.6折 + 返利20%
 */

export interface MemberTier {
  key: string;
  label: string;
  discount: number;      // 折扣率 0.28 = 2.8折
  rebate: number;        // 返利率 0.05 = 5%
  minRecharge: number;   // 最低充值额（分）
  color: string;         // UI 配色
  icon: string;          // 图标
}

export const MEMBER_TIERS: MemberTier[] = [
  {
    key: "none",
    label: "非会员",
    discount: 1.0,
    rebate: 0,
    minRecharge: 0,
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: "👤",
  },
  {
    key: "tier_5w",
    label: "银卡会员",
    discount: 0.28,
    rebate: 0.05,
    minRecharge: 5_000_000,
    color: "text-slate-600 bg-slate-50 border-slate-300",
    icon: "🥈",
  },
  {
    key: "tier_10w",
    label: "金卡会员",
    discount: 0.28,
    rebate: 0.10,
    minRecharge: 10_000_000,
    color: "text-amber-600 bg-amber-50 border-amber-300",
    icon: "🥇",
  },
  {
    key: "tier_30w",
    label: "钻石会员",
    discount: 0.26,
    rebate: 0.20,
    minRecharge: 30_000_000,
    color: "text-purple-600 bg-purple-50 border-purple-300",
    icon: "💎",
  },
];

export interface DiscountResult {
  originalPrice: number;    // 原价（分）
  discountRate: number;     // 折扣率
  discountPrice: number;    // 折后价（分）
  savedAmount: number;      // 节省金额（分）
  rebateRate: number;       // 返利率
  rebateAmount: number;     // 返利金额（分）
  memberLevel: string;      // 会员等级 key
  memberLabel: string;      // 会员等级名称
}

/**
 * 计算会员折扣价
 * @param originalPrice 原价（分）
 * @param memberLevel 会员等级 key
 */
export function calcDiscount(
  originalPrice: number,
  memberLevel: string = "none"
): DiscountResult {
  const tier = MEMBER_TIERS.find((t) => t.key === memberLevel) || MEMBER_TIERS[0];

  const discountPrice = Math.round(originalPrice * tier.discount);
  const savedAmount = originalPrice - discountPrice;
  const rebateAmount = Math.round(discountPrice * tier.rebate);

  return {
    originalPrice,
    discountRate: tier.discount,
    discountPrice,
    savedAmount,
    rebateRate: tier.rebate,
    rebateAmount,
    memberLevel: tier.key,
    memberLabel: tier.label,
  };
}

/**
 * 格式化价格（分 → 元）
 */
export function formatPrice(price: number): string {
  return `¥${(price / 100).toFixed(0)}`;
}

/**
 * 格式化折扣率显示（0.28 → "2.8折"）
 */
export function formatDiscountRate(rate: number): string {
  return `${(rate * 10).toFixed(1)}折`;
}

/**
 * 格式化返利率显示（0.05 → "5%"）
 */
export function formatRebateRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

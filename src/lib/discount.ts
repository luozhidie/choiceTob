/**
 * 会员折扣计算模块
 *
 * 新会员等级体系（基于套餐）：
 * - 非会员: 原价（无法查看批发价）
 * - 体验会员 (¥19.9): 7天体验，9折优惠
 * - 年度会员 (¥399): 全年有效，8折优惠 + 返利5%
 * - 两年会员 (¥599): 2年有效，75折优惠 + 返利8%
 * - 三年会员 (¥699): 3年有效，7折优惠 + 返利10%
 */

export interface MemberTier {
  key: string;
  label: string;
  subLabel?: string;       // 副标题说明
  discount: number;        // 折扣率 0.8 = 8折 = 打8折
  rebate: number;          // 返利率 0.05 = 5%
  price?: number;          // 套餐价格（分），用于显示
  duration?: string;       // 有效期
  minRecharge?: number;    // 兼容旧字段
  color: string;           // UI 配色
  icon: string;            // 图标
  highlight?: boolean;     // 是否推荐
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
    key: "trial",
    label: "体验会员",
    subLabel: "7天体验",
    discount: 0.9,         // 9折
    rebate: 0,
    price: 1990,           // ¥19.9
    duration: "7天",
    minRecharge: 1990,
    color: "text-blue-600 bg-blue-50 border-blue-300",
    icon: "🌟",
  },
  {
    key: "annual",
    label: "年度会员",
    subLabel: "最畅销 · 推荐",
    discount: 0.8,         // 8折 = 打8折
    rebate: 0.05,          // 5%返利
    price: 39900,          // ¥399
    duration: "1年",
    minRecharge: 39900,
    color: "text-green-600 bg-green-50 border-green-300",
    icon: "⭐",
    highlight: true,
  },
  {
    key: "two_year",
    label: "两年会员",
    subLabel: "超值优选",
    discount: 0.75,        // 7.5折
    rebate: 0.08,          // 8%返利
    price: 59900,          // ¥599
    duration: "2年",
    minRecharge: 59900,
    color: "text-purple-600 bg-purple-50 border-purple-300",
    icon: "👑",
  },
  {
    key: "three_year",
    label: "三年会员",
    subLabel: "极致性价比",
    discount: 0.7,         // 7折
    rebate: 0.10,          // 10%返利
    price: 69900,          // ¥699
    duration: "3年（实得40个月）",
    minRecharge: 69900,
    color: "text-pink-600 bg-pink-50 border-pink-300",
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
 * 格式化折扣率显示（0.8 → "8折"）
 */
export function formatDiscountRate(rate: number): string {
  if (rate === 1.0) return "原价";
  return `${(rate * 10).toFixed(1)}折`;
}

/**
 * 格式化返利率显示（0.05 → "5%"）
 */
export function formatRebateRate(rate: number): string {
  if (rate === 0) return "无";
  return `${(rate * 100).toFixed(0)}%`;
}

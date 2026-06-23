/**
 * 会员折扣计算模块
 *
 * 三类会员体系：
 *
 * 1. 价格会员 (view_price) - ¥299/年
 *    查看批发价、对比价差
 *
 * 2. 商城会员 (deposit_discount)
 *    - 基础VIP: ¥3,980/年 - 9折
 *    - 进阶VIP: ¥13,800/年 - 8折 + 返利5%
 *    - 高阶VIP: ¥29,800/年 - 7折 + 返利8%
 *
 * 3. 拿货会员 (wholesale) - ¥599/年
 *    同色同款三件起批发价、退换服务
 */

export interface MemberTier {
  key: string;
  label: string;
  subLabel?: string;
  category?: string;       // price | mall | wholesale
  discount: number;        // 折扣率 0.9 = 打9折
  rebate: number;          // 返利率 0.05 = 5%
  minRecharge?: number;    // 兼容旧字段
  color: string;
  icon: string;
  highlight?: boolean;
}

export const MEMBER_TIERS: MemberTier[] = [
  // ====== 非会员 ======
  {
    key: "none",
    label: "非会员",
    subLabel: "原价购买",
    category: "",
    discount: 1.0,
    rebate: 0,
    minRecharge: 0,
    color: "text-gray-500 bg-gray-50 border-gray-200",
    icon: "👤",
  },

  // ====== 第一类：价格会员 ======
  {
    key: "view_price",
    label: "价格会员",
    subLabel: "查看批发价",
    category: "price",
    discount: 1.0,         // 价格会员不改变售价，只是解锁查看权限
    rebate: 0,
    minRecharge: 29900,
    color: "text-blue-600 bg-blue-50 border-blue-300",
    icon: "👁️",
  },

  // ====== 第二类：商城会员（基础/进阶/高阶） ======
  {
    key: "basic",
    label: "基础VIP",
    subLabel: "商城会员",
    category: "mall",
    discount: 0.9,         // 9折 = 打9折
    rebate: 0,
    minRecharge: 398000,   // ¥3,980
    color: "text-amber-600 bg-amber-50 border-amber-300",
    icon: "⭐",
  },
  {
    key: "pro",
    label: "进阶VIP",
    subLabel: "商城会员（推荐）",
    category: "mall",
    discount: 0.8,         // 8折
    rebate: 0.05,          // 5%返利
    minRecharge: 1380000,  // ¥13,800
    color: "text-purple-600 bg-purple-50 border-purple-300",
    icon: "💜",
    highlight: true,
  },
  {
    key: "premium",
    label: "高阶VIP",
    subLabel: "商城会员",
    category: "mall",
    discount: 0.7,         // 7折
    rebate: 0.08,          // 8%返利
    minRecharge: 2980000,  // ¥29,800
    color: "text-pink-600 bg-pink-50 border-pink-300",
    icon: "👑",
  },

  // ====== 第三类：拿货会员 ======
  {
    key: "wholesale",
    label: "拿货会员",
    subLabel: "三件起批发",
    category: "wholesale",
    discount: 0.75,        // 拿货折扣（低于零售）
    rebate: 0.03,          // 3%返利
    minRecharge: 59900,    // ¥599
    color: "text-green-600 bg-green-50 border-green-300",
    icon: "📦",
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

/** 格式化价格（分 → 元） */
export function formatPrice(price: number): string {
  return `¥${(price / 100).toFixed(0)}`;
}

/** 格式化折扣率显示 */
export function formatDiscountRate(rate: number): string {
  if (rate === 1.0) return "原价";
  return `${(rate * 10).toFixed(1)}折`;
}

/** 格式化返利率显示 */
export function formatRebateRate(rate: number): string {
  if (rate === 0) return "无";
  return `${(rate * 100).toFixed(0)}%`;
}

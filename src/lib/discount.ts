/**
 * 会员折扣计算模块
 *
 * 三类会员体系：
 *
 * 1. 价格会员：19.9元14天体验 / 399元年 / 599元2年 / 699元3年
 *    功能：查看批发价
 *
 * 2. 商城会员：基础VIP 3980 / 进阶VIP 13800 / 高阶VIP 29800
 *    功能：享受商城服务与资源优惠
 *    - 基础VIP: 9折
 *    - 进阶VIP: 8折 + 5%返利
 *    - 高阶VIP: 7折 + 8%返利
 *
 * 3. 拿货会员：充5万/10万/30万
 *    功能：同色同款三件起批，2.8折拿货，退换服务
 *    - 充5万: 2.8折, 退换额度5%
 *    - 充10万: 2.8折, 退换额度10%
 *    - 充30万: 2.8折, 退换额度20%
 */

export interface MemberTier {
  key: string;
  label: string;
  subLabel?: string;
  category?: string;       // price | mall | wholesale
  discount: number;        // 折扣率 0.9 = 打9折
  rebate: number;          // 返利率 0.05 = 5%
  minRecharge?: number;    // 充值金额（分）
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
    key: "price_trial",
    label: "价格会员·体验",
    subLabel: "14天体验",
    category: "price",
    discount: 1.0,
    rebate: 0,
    minRecharge: 1990,      // ¥19.9
    color: "text-blue-600 bg-blue-50 border-blue-300",
    icon: "👁️",
  },
  {
    key: "price_1y",
    label: "价格会员·年卡",
    subLabel: "查看批发价",
    category: "price",
    discount: 1.0,
    rebate: 0,
    minRecharge: 39900,     // ¥399
    color: "text-blue-600 bg-blue-50 border-blue-300",
    icon: "👁️",
  },
  {
    key: "price_2y",
    label: "价格会员·两年卡",
    subLabel: "查看批发价",
    category: "price",
    discount: 1.0,
    rebate: 0,
    minRecharge: 59900,     // ¥599
    color: "text-blue-600 bg-blue-50 border-blue-300",
    icon: "👁️",
  },
  {
    key: "price_3y",
    label: "价格会员·三年卡",
    subLabel: "查看批发价",
    category: "price",
    discount: 1.0,
    rebate: 0,
    minRecharge: 69900,     // ¥699
    color: "text-blue-600 bg-blue-50 border-blue-300",
    icon: "👁️",
  },

  // ====== 第二类：商城会员 ======
  {
    key: "basic",
    label: "基础VIP",
    subLabel: "商城会员",
    category: "mall",
    discount: 0.9,          // 9折
    rebate: 0,
    minRecharge: 398000,    // ¥3,980
    color: "text-amber-600 bg-amber-50 border-amber-300",
    icon: "⭐",
  },
  {
    key: "pro",
    label: "进阶VIP",
    subLabel: "商城会员（推荐）",
    category: "mall",
    discount: 0.8,          // 8折
    rebate: 0.05,           // 5%返利
    minRecharge: 1380000,   // ¥13,800
    color: "text-purple-600 bg-purple-50 border-purple-300",
    icon: "💜",
    highlight: true,
  },
  {
    key: "premium",
    label: "高阶VIP",
    subLabel: "商城会员",
    category: "mall",
    discount: 0.7,          // 7折
    rebate: 0.08,           // 8%返利
    minRecharge: 2980000,   // ¥29,800
    color: "text-pink-600 bg-pink-50 border-pink-300",
    icon: "👑",
  },

  // ====== 第三类：拿货会员 ======
  {
    key: "wholesale_5w",
    label: "拿货会员·充5万",
    subLabel: "2.8折·退换5%",
    category: "wholesale",
    discount: 0.28,         // 2.8折
    rebate: 0,
    minRecharge: 5000000,   // 充5万
    color: "text-green-600 bg-green-50 border-green-300",
    icon: "📦",
  },
  {
    key: "wholesale_10w",
    label: "拿货会员·充10万",
    subLabel: "2.8折·退换10%",
    category: "wholesale",
    discount: 0.28,         // 2.8折
    rebate: 0,
    minRecharge: 10000000,  // 充10万
    color: "text-green-600 bg-green-50 border-green-300",
    icon: "📦",
    highlight: true,
  },
  {
    key: "wholesale_30w",
    label: "拿货会员·充30万",
    subLabel: "2.8折·退换20%",
    category: "wholesale",
    discount: 0.28,         // 2.8折
    rebate: 0,
    minRecharge: 30000000,  // 充30万
    color: "text-green-600 bg-green-50 border-green-300",
    icon: "📦",
  },
];

export interface DiscountResult {
  originalPrice: number;
  discountRate: number;
  discountPrice: number;
  savedAmount: number;
  rebateRate: number;
  rebateAmount: number;
  memberLevel: string;
  memberLabel: string;
}

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

export function formatPrice(price: number): string {
  return `¥${(price / 100).toFixed(0)}`;
}

export function formatDiscountRate(rate: number): string {
  if (rate === 1.0) return "原价";
  return `${(rate * 10).toFixed(1)}折`;
}

export function formatRebateRate(rate: number): string {
  if (rate === 0) return "无";
  return `${(rate * 100).toFixed(0)}%`;
}

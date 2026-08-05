// 词元 API 计费（Stripe 外币收款）公共配置
import Stripe from "stripe";

export interface BillingPackage {
  key: string;
  nameZh: string;
  nameEn: string;
  calls: number; // 授予的调用次数
  amount: number; // 外币最小单位（美分）— USD
  cny: number;   // 人民币最小单位（分）— 微信支付实际扣款额，按 FX_RATE_CNY 折算
  descZh: string;
  descEn: string;
}

// 美元 → 人民币折算汇率（固定，避免汇率波动；需调整改这里）
export const FX_RATE_CNY = 7.2;

// 正式定价：美元计价（$9/$29/$99）不变，微信支付按等值人民币扣款。
// 改这里即可调整套餐价与次数；cny 为人民币分（1 美元 ≈ 7.2 元）。
export const PACKAGES: BillingPackage[] = [
  { key: "trial",   nameZh: "试用",  nameEn: "Trial",   calls: 50,   amount: 900,  cny: 6500,  descZh: "先跑通接口，验证词元效果", descEn: "Validate the API before committing" },
  { key: "starter", nameZh: "入门",  nameEn: "Starter", calls: 200,  amount: 2900, cny: 20900, descZh: "中小跨境卖家日常选品", descEn: "For daily buying & curation" },
  { key: "pro",     nameZh: "专业",  nameEn: "Pro",     calls: 1000, amount: 9900, cny: 71300, descZh: "高频调用团队 / 二开平台", descEn: "High-volume teams & platforms" },
];

export function getPackage(key: string): BillingPackage | undefined {
  return PACKAGES.find((p) => p.key === key);
}

let _stripe: Stripe | null = null;
let _stripeMissingWarned = false;

// 返回 Stripe 实例；未配置密钥时返回 null（调用方需优雅降级提示去配置）
export function getStripe(): Stripe | null {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) {
    if (!_stripeMissingWarned) {
      console.warn("[billing] STRIPE_SECRET_KEY 未配置，计费下单不可用");
      _stripeMissingWarned = true;
    }
    return null;
  }
  if (!_stripe) {
    // 不传 apiVersion：使用 SDK 内置默认版本，避免版本类型不匹配
    _stripe = new Stripe(sk);
  }
  return _stripe;
}

export const STRIPE_CONFIGURED = () => !!process.env.STRIPE_SECRET_KEY;

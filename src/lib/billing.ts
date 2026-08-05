// 词元 API 计费（Stripe 外币收款）公共配置
// 注意：stripe 为可选依赖。原项目被旧代码覆盖部署时 stripe 已从 package.json 移除，
// 此处改为运行时惰性 require，避免顶部静态 import 在依赖缺失时导致 next build 失败。
// 微信支付链路（unifiedOrder + qrcode）不依赖 stripe，不受影响。

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

let _stripe: any = null;
let _stripeInit = false;
let _stripeInstanced = false;
let _stripeInstance: any = null;
let _stripeMissingWarned = false;

function loadStripeLib(): any {
  try {
    // 用变量名动态 require，绕开构建期对缺失模块的静态解析
    const name = "stripe";
    const mod = require(name);
    return mod && mod.default ? mod.default : mod;
  } catch {
    return null;
  }
}

// 返回 Stripe 实例；未配置密钥或依赖未安装时返回 null（调用方需优雅降级）
export function getStripe(): any {
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk) {
    if (!_stripeMissingWarned) {
      console.warn("[billing] STRIPE_SECRET_KEY 未配置，计费下单不可用");
      _stripeMissingWarned = true;
    }
    return null;
  }
  if (!_stripeInit) {
    _stripe = loadStripeLib();
    _stripeInit = true;
    if (!_stripe) {
      console.warn("[billing] stripe 未安装，Stripe 外币收款不可用（微信支付不受影响）");
    }
  }
  if (!_stripe) return null;
  if (!_stripeInstanced) {
    // 不传 apiVersion：使用 SDK 内置默认版本，避免版本类型不匹配
    _stripeInstance = new _stripe(sk);
    _stripeInstanced = true;
  }
  return _stripeInstance;
}

export const STRIPE_CONFIGURED = () => !!process.env.STRIPE_SECRET_KEY;

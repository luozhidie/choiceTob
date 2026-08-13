// 公开：返回可购买的词元 API 调用额度套餐（供 /tokens-market 展示）
import { NextResponse } from "next/server";
import { PACKAGES } from "@/lib/billing";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    currency: "usd",
    testMode: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes("test")),
    packages: PACKAGES.map((p) => ({
      key: p.key,
      nameZh: p.nameZh,
      nameEn: p.nameEn,
      calls: p.calls,
      amount: p.amount, // 美分 (USD)
      cny: p.cny,       // 分 (RMB)，微信支付实际扣款
      descZh: p.descZh,
      descEn: p.descEn,
    })),
  });
}

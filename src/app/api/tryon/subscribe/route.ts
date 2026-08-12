import { NextRequest, NextResponse } from "next/server";
import { createUnifiedOrder, decodeToken, getSupabase } from "../wechat-pay/_lib";

/**
 * 购买虚拟试衣月卡 / 首单 1 元换衣
 * POST /api/tryon/subscribe
 * Body: { token, tier }
 *   tier: tryon_first_1yuan(¥1/1次·每人仅1次) | tryon_personal_basic(¥99/80次)
 *       | tryon_personal_pro(¥199/200次) | tryon_shop(¥699/600次) | tryon_brand(¥1999/1500次)
 * 返回: { ok, jsapi, out_trade_no }
 */
const TIERS: Record<string, { price: number; credits: number; title: string; firstOffer?: boolean }> = {
  tryon_first_1yuan: { price: 1, credits: 1, title: "虚拟试衣·首单体验(1元)", firstOffer: true },
  tryon_personal_basic: { price: 99, credits: 80, title: "虚拟试衣·个人基础版" },
  tryon_personal_pro: { price: 199, credits: 200, title: "虚拟试衣·个人进阶版" },
  tryon_shop: { price: 699, credits: 600, title: "虚拟试衣·企业店铺版" },
  tryon_brand: { price: 1999, credits: 1500, title: "虚拟试衣·企业品牌版" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, tier } = body;
    const tk = decodeToken(token);
    if (!tk?.uid) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const userId = tk.uid;

    const t = TIERS[tier];
    if (!t) return NextResponse.json({ error: "未知套餐" }, { status: 400 });

    // 首单 1 元优惠：每人仅 1 次，已用过则拒绝
    if (t.firstOffer) {
      const supabase = getSupabase();
      const { data: profile, error: pe } = await supabase
        .from("profiles")
        .select("tryon_first_offer_used")
        .eq("id", userId)
        .maybeSingle();
      if (pe) return NextResponse.json({ error: "查询失败" }, { status: 500 });
      if (profile?.tryon_first_offer_used) {
        return NextResponse.json({ error: "首单1元优惠已使用，请选择套餐" }, { status: 409 });
      }
    }

    const r = await createUnifiedOrder({
      product_id: tier,
      product_title: t.title,
      total_fee: t.price * 100,
      token,
      req,
    });

    if (!r.ok) return NextResponse.json({ error: r.error || "下单失败" }, { status: 400 });
    return NextResponse.json({ ok: true, jsapi: r.jsapi, out_trade_no: r.out_trade_no, tier, credits: t.credits });
  } catch (err: any) {
    console.error("[tryon/subscribe] 异常:", err?.message || err);
    return NextResponse.json({ error: "下单失败", detail: err?.message || String(err) }, { status: 500 });
  }
}

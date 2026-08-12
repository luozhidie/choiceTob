import { NextRequest, NextResponse } from "next/server";
import { createUnifiedOrder } from "../_lib";

/**
 * 微信支付 · 统一下单入口（小程序）
 * POST /api/wechat-pay/unified-order
 * Body: { product_id, product_title, total_fee(分), quantity?, platform?, openid?, token? }
 * 返回: { ok, jsapi:{appId,timeStamp,nonceStr,package,signType,paySign}, out_trade_no }
 *
 * ⚠️ 本地仓库此前缺失此路由（生产环境原有），此为按小程序调用契约重建版。
 *    部署前请与线上版本逐行 diff，尤其商户号/签名/notify 地址配置。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, product_title, total_fee, openid, token } = body;

    if (!product_id || !product_title || !total_fee) {
      return NextResponse.json({ error: "缺少商品参数" }, { status: 400 });
    }

    const r = await createUnifiedOrder({
      product_id,
      product_title,
      total_fee: Number(total_fee),
      openid,
      token,
      req,
    });

    if (!r.ok) {
      return NextResponse.json({ error: r.error || "统一下单失败" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, jsapi: r.jsapi, out_trade_no: r.out_trade_no });
  } catch (err: any) {
    console.error("[unified-order] 异常:", err?.message || err);
    return NextResponse.json({ error: "下单失败", detail: err?.message || String(err) }, { status: 500 });
  }
}

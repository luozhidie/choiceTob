// app/api/virtual-pay/sign/route.ts
// 虚拟支付签名下发：服务端生成 signData / paySig / signature，客户端原样传给 wx.requestVirtualPayment
// 关键点：signData 必须由服务端序列化成字符串并返回，客户端不得二次拼装，否则签名校验必失败。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  VIRTUAL_PAY_ENABLED,
  VIRTUAL_OFFER_ID,
  VIRTUAL_ENV,
  getGoods,
  genOutTradeNo,
  calcPaySig,
  calcSignature,
  code2Session,
  configError,
} from "@/lib/virtual-pay";

export async function POST(request: NextRequest) {
  try {
    if (!VIRTUAL_PAY_ENABLED) {
      return NextResponse.json({ error: "虚拟支付未开启", fallback: true }, { status: 400 });
    }
    const cfgErr = configError();
    if (cfgErr) {
      console.error("[虚拟支付] 配置缺失:", cfgErr);
      return NextResponse.json({ error: cfgErr }, { status: 500 });
    }

    const body = await request.json();
    const { code, goodsKey, buyQuantity, attach } = body || {};
    if (!code) return NextResponse.json({ error: "缺少 code", fallback: true }, { status: 400 });

    const goods = getGoods(String(goodsKey || ""));
    if (!goods) return NextResponse.json({ error: "未知商品: " + goodsKey, fallback: true }, { status: 400 });

    // 1) code 换 openid + session_key
    const { openid, sessionKey } = await code2Session(code);
    if (!sessionKey) {
      return NextResponse.json({ error: "获取 session_key 失败，请重试", fallback: true }, { status: 500 });
    }

    const qty = Math.max(1, Math.min(99, Number(buyQuantity) || 1));
    const outTradeNo = genOutTradeNo();
    const attachStr = String(attach || goods.productId).slice(0, 180);

    // 2) 组装 signData（字段顺序与官方示例一致，客户端原样透传）
    const signData = JSON.stringify({
      offerId: VIRTUAL_OFFER_ID,
      buyQuantity: qty,
      env: VIRTUAL_ENV,
      currencyType: "CNY",
      productId: goods.productId,
      goodsPrice: goods.priceFen,
      outTradeNo,
      attach: attachStr,
    });

    const paySig = calcPaySig(signData, VIRTUAL_ENV);
    const signature = calcSignature(signData, sessionKey);

    // 3) 预建订单（pending），供回调 / 轮询对账
    const supabase = await createClient();
    const { error: insErr } = await supabase.from("virtual_orders").insert({
      out_trade_no: outTradeNo,
      openid,
      goods_key: goods.productId,
      product_id: goods.productId,
      goods_name: goods.name,
      amount_cents: goods.priceFen * qty,
      quantity: qty,
      env: VIRTUAL_ENV,
      attach: attachStr,
      status: "pending",
    });
    if (insErr) {
      console.error("[虚拟支付] 建单失败", insErr);
      return NextResponse.json(
        { error: "建单失败（请确认已执行 virtual_orders 建表 SQL）", detail: insErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signData,
      paySig,
      signature,
      mode: "short_series_goods",
      outTradeNo,
      env: VIRTUAL_ENV,
      openid,
      productId: goods.productId,
      goodsPrice: goods.priceFen,
    });
  } catch (err: any) {
    console.error("[虚拟支付签名] 异常", err);
    return NextResponse.json({ error: err.message || "系统错误", fallback: true }, { status: 500 });
  }
}

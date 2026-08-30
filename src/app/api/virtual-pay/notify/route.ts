// app/api/virtual-pay/notify/route.ts
// 微信虚拟支付「道具发货推送」回调：xpay_goods_deliver_notify
// 配置路径：MP 后台 → 虚拟支付 → 基本配置 → 发货订阅，URL 填 https://colour-choice.art/api/virtual-pay/notify
// 响应必须返回 ErrCode=0，否则微信最多重推 15 次
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { deliverVirtualGoods } from "@/lib/virtual-deliver";

// 从 XML 中取字段值
function xmlField(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

function okJson() {
  return NextResponse.json({ ErrCode: 0, ErrMsg: "success" });
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    let outTradeNo = "";
    let openid = "";
    let env = 0;

    if (raw.trim().startsWith("{")) {
      const j = JSON.parse(raw);
      outTradeNo = String(j.OutTradeNo || j.out_trade_no || "");
      openid = String(j.OpenId || j.openid || "");
      env = Number(j.Env ?? j.env ?? 0);
    } else {
      outTradeNo = xmlField(raw, "OutTradeNo");
      openid = xmlField(raw, "OpenId");
      env = Number(xmlField(raw, "Env") || 0);
    }

    console.log("[虚拟支付推送] 收到", { outTradeNo, openid, env, rawLen: raw.length });
    if (!outTradeNo) return okJson();

    const svc = createServiceRoleClient();
    const { data: order } = await svc
      .from("virtual_orders")
      .select("out_trade_no, openid, goods_key, product_id, status")
      .eq("out_trade_no", outTradeNo)
      .maybeSingle();

    if (!order) {
      console.warn("[虚拟支付推送] 订单不存在", outTradeNo);
      return okJson();
    }

    await deliverVirtualGoods(svc, order.openid, order.goods_key || order.product_id, outTradeNo);
    return okJson();
  } catch (err: any) {
    console.error("[虚拟支付推送] 处理异常", err);
    // 仍然返回成功，避免微信无限重推；实际发货由 /grant 兜底
    return okJson();
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "virtual-pay-notify" });
}

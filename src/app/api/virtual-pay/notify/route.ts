// app/api/virtual-pay/notify/route.ts
// 微信虚拟支付「道具发货推送」回调：xpay_goods_deliver_notify
// 配置路径：MP 后台 → 虚拟支付 → 基本配置 → 发货订阅
//
// 安全：本接口对外网开放，必须先调 /xpay/query_order 核实订单确实已支付，
//       否则任何人拿到订单号就能白嫖权益。核实失败时不发货并让微信重推。
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { deliverVirtualGoods } from "@/lib/virtual-deliver";
import { queryOrder, isPaidStatus } from "@/lib/virtual-pay";

function xmlField(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}

// 推送是 XML 就回 XML，是 JSON 就回 JSON
function okResp(isXml: boolean, errCode = 0, errMsg = "success") {
  if (isXml) {
    return new NextResponse(
      `<xml><ErrCode>${errCode}</ErrCode><ErrMsg><![CDATA[${errMsg}]]></ErrMsg></xml>`,
      { headers: { "Content-Type": "application/xml; charset=utf-8" } }
    );
  }
  return NextResponse.json({ ErrCode: errCode, ErrMsg: errMsg });
}

/** 调 query_order 核实订单确已支付（严格：查不到/状态不符一律不发，让微信重推） */
async function verifyPaid(outTradeNo: string, openid: string, env: number): Promise<boolean> {
  try {
    const r: any = await queryOrder(outTradeNo, openid, env);
    if (!r) return false;
    if (r.errcode !== 0 && r.errCode !== 0) {
      console.warn("[虚拟支付推送] query_order 返回错误", JSON.stringify(r).slice(0, 300));
      return false;
    }
    // 官方返回体是 { errcode, errmsg, order: { status, ... } }
    const info = r.order || r.order_info || null;
    if (!info) {
      console.warn("[虚拟支付推送] query_order 无 order 数据", JSON.stringify(r).slice(0, 300));
      return false;
    }
    // 仅 status ∈ {2 已支付待发货, 3 发货中, 4 已发货} 才发货
    if (!isPaidStatus(info.status)) {
      console.warn("[虚拟支付推送] 订单状态不可发货", { outTradeNo, status: info.status });
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn("[虚拟支付推送] query_order 异常", e?.message);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.text().catch(() => "");
  const isXml = !raw.trim().startsWith("{");

  let outTradeNo = "";
  let openid = "";
  let env = 0;

  if (isXml) {
    outTradeNo = xmlField(raw, "OutTradeNo");
    openid = xmlField(raw, "OpenId");
    env = Number(xmlField(raw, "Env") || 0);
  } else {
    try {
      const j = JSON.parse(raw);
      outTradeNo = String(j.OutTradeNo || j.out_trade_no || "");
      openid = String(j.OpenId || j.openid || "");
      env = Number(j.Env ?? j.env ?? 0);
    } catch (e) {
      return okResp(isXml);
    }
  }

  console.log("[虚拟支付推送] 收到", { outTradeNo, env, isXml, len: raw.length });
  if (!outTradeNo) return okResp(isXml);

  const svc = createServiceRoleClient();
  const { data: order } = await svc
    .from("virtual_orders")
    .select("out_trade_no, openid, goods_key, product_id, env, status")
    .eq("out_trade_no", outTradeNo)
    .maybeSingle();

  if (!order) {
    console.warn("[虚拟支付推送] 订单不存在", outTradeNo);
    return okResp(isXml); // 不是我们的单，直接成功避免重推
  }
  // 已由 /grant 发过货 → 直接成功
  if (order.status === "paid") return okResp(isXml);

  const orderEnv = Number(order.env ?? env) === 1 ? 1 : 0;
  const paid = await verifyPaid(outTradeNo, order.openid, orderEnv);
  if (!paid) {
    // 未核实到支付：不发货，返回失败让微信重推（最多 15 次）
    console.warn("[虚拟支付推送] 未核实到支付，暂不发货", outTradeNo);
    return okResp(isXml, 1, "not verified");
  }

  await deliverVirtualGoods(svc, order.openid, order.goods_key || order.product_id, outTradeNo);
  console.log("[虚拟支付推送] 发货完成", outTradeNo);
  return okResp(isXml);
}

export async function GET(request: NextRequest) {
  // 微信配置消息推送时会发 GET 校验：原样返回 echostr，否则后台保存不了 URL
  const echostr = new URL(request.url).searchParams.get("echostr");
  if (echostr) {
    return new NextResponse(echostr, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return NextResponse.json({ ok: true, service: "virtual-pay-notify" });
}

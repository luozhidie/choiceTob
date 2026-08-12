import { NextRequest, NextResponse } from "next/server";
import { getSupabase, buildSign, xmlToObj } from "../_lib";

/**
 * 微信支付 · 支付结果通知（notify_url）
 * POST /api/wechat-pay/notify
 *
 * 校验签名后，按 payment_orders.product_type 分支：
 *  - wholesale → apply_agent_recharge（充值即代理 + 自动开店 + 批发价 + 退换）
 *  - tryon    → apply_tryon_subscription（虚拟试衣月卡）
 *  - product  → bump_agent_level（累计订单金额 → 成长等级）
 *  - vip      → 标记会员生效
 *
 * ⚠️ 本地仓库此前缺失此路由（生产环境原有），此为按契约重建版，部署前请与线上 diff。
 */
export async function POST(req: NextRequest) {
  const xml = await req.text();
  const data = xmlToObj(xml);

  const okXml = "<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>";
  const failXml = "<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名失败]]></return_msg></xml>";

  if (data.return_code !== "SUCCESS") return new NextResponse(okXml, { status: 200, headers: xmlHeader() });

  // 签名校验
  const APIKEY = process.env.WECHAT_PAY_KEY || "";
  const sign = data.sign;
  const calc = buildSign(data, APIKEY);
  if (!sign || calc !== String(sign).toUpperCase()) {
    console.error("[notify] 签名校验失败");
    return new NextResponse(failXml, { status: 200, headers: xmlHeader() });
  }

  const outTradeNo = data.out_trade_no;
  const openid = data.openid;
  const totalFeeFen = Number(data.total_fee || 0);
  const amountYuan = totalFeeFen / 100;

  const supabase = getSupabase();

  // 查支付订单
  const { data: order } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("out_trade_no", outTradeNo)
    .maybeSingle();

  if (!order) {
    console.error("[notify] 未知订单:", outTradeNo);
    return new NextResponse(okXml, { status: 200, headers: xmlHeader() }); // 防重试风暴
  }
  if (order.status === "paid") {
    return new NextResponse(okXml, { status: 200, headers: xmlHeader() });
  }

  // 解析 user_id
  let userId = order.user_id;
  if (!userId && openid) {
    const { data: p } = await supabase.from("profiles").select("id").eq("wechat_openid", openid).maybeSingle();
    if (p) userId = p.id;
  }

  // 标记已支付
  await supabase.from("payment_orders").update({ status: "paid", paid_at: new Date().toISOString(), user_id: userId }).eq("out_trade_no", outTradeNo);

  if (!userId) {
    console.error("[notify] 无法定位用户:", outTradeNo, openid);
    return new NextResponse(okXml, { status: 200, headers: xmlHeader() });
  }

  try {
    if (order.product_type === "wholesale") {
      const { error } = await supabase.rpc("apply_agent_recharge", {
        p_user_id: userId,
        p_amount: amountYuan,
        p_out_trade_no: outTradeNo,
      });
      if (error) console.error("[notify] apply_agent_recharge 失败:", error);
    } else if (order.product_type === "tryon") {
      const credits = tryonCreditsOf(order.product_id);
      const { error } = await supabase.rpc("apply_tryon_subscription", {
        p_user_id: userId,
        p_tier: order.product_id,
        p_price: amountYuan,
        p_credits: credits,
        p_out_trade_no: outTradeNo,
      });
      if (error) console.error("[notify] apply_tryon_subscription 失败:", error);
      // 首单 1 元换衣：支付成功后标记已用（每人仅 1 次）
      if (order.product_id === "tryon_first_1yuan") {
        const { error: ue } = await supabase
          .from("profiles")
          .update({ tryon_first_offer_used: true })
          .eq("id", userId);
        if (ue) console.error("[notify] 标记首单优惠已用失败:", ue);
      }
    } else if (order.product_type === "product") {
      const { error } = await supabase.rpc("bump_agent_level", {
        p_user_id: userId,
        p_amount: amountYuan,
      });
      if (error) console.error("[notify] bump_agent_level 失败:", error);
    } else if (order.product_type === "vip") {
      await supabase.from("profiles").update({
        membership_type: "active",
        membership_expires_at: new Date(Date.now() + 365 * 864e5).toISOString(),
      }).eq("id", userId);
    }
  } catch (e: any) {
    console.error("[notify] 落地处理异常:", e?.message || e);
  }

  return new NextResponse(okXml, { status: 200, headers: xmlHeader() });
}

function tryonCreditsOf(productId: string): number {
  switch (productId) {
    case "tryon_first_1yuan": return 1;
    case "tryon_personal_basic": return 80;
    case "tryon_personal_pro": return 200;
    case "tryon_shop": return 600;
    case "tryon_brand": return 1500;
    default: return 80;
  }
}

function xmlHeader() {
  return { "Content-Type": "text/xml" };
}

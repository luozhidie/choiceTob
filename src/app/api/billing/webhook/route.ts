// 公开：Stripe Webhook —— 支付完成后履约（激活 key、标记订单 paid）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Webhook 未配置" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ ok: false, error: "缺少签名" }, { status: 400 });

  const rawBody = await request.text();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "签名校验失败: " + e.message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const apiKeyId = session.metadata?.api_key_id;
      const orderId = session.metadata?.order_id;
      const supabase = getServiceRoleClient();
      if (orderId) {
        await supabase
          .from("token_orders")
          .update({ status: "paid", stripe_payment_intent: session.payment_intent || null })
          .eq("id", orderId);
      }
      if (apiKeyId) {
        await supabase.from("token_api_keys").update({ status: "active" }).eq("id", apiKeyId);
      }
    }
    return NextResponse.json({ ok: true, received: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

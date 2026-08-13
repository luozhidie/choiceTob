// 公开：支付成功后凭 Stripe session_id 取回 API Key（仅服务端向 Stripe 核实已付款才返回）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/billing";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe();
    const sessionId = new URL(request.url).searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ ok: false, error: "缺少 session_id" }, { status: 400 });

    // 若 Stripe 未配置（纯本地），退回用订单表直接查（兜底，不验证支付）
    if (!stripe) {
      const supabase = getServiceRoleClient();
      const { data } = await supabase
        .from("token_orders")
        .select("api_key, package_key, calls, status")
        .eq("stripe_session_id", sessionId)
        .is("deleted_at", null)
        .single();
      if (!data) return NextResponse.json({ ok: false, error: "订单不存在" }, { status: 404 });
      return NextResponse.json({ ok: true, paid: data.status === "paid", api_key: data.api_key, package: data.package_key, calls: data.calls });
    }

    // 向 Stripe 核实支付状态
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("token_orders")
      .select("api_key, package_key, calls, status")
      .eq("stripe_session_id", sessionId)
      .is("deleted_at", null)
      .single();
    if (!data) return NextResponse.json({ ok: false, error: "订单不存在" }, { status: 404 });

    const paid = session.payment_status === "paid" || data.status === "paid";
    // 支付成功但 webhook 尚未履约时，这里兜底激活，确保买家拿得到 key
    if (paid && data.status !== "paid") {
      await supabase.from("token_orders").update({ status: "paid", stripe_payment_intent: (session as any).payment_intent || null }).eq("stripe_session_id", sessionId);
      if (data.api_key) await supabase.from("token_api_keys").update({ status: "active" }).eq("api_key", data.api_key);
    }
    return NextResponse.json({ ok: true, paid, api_key: data.api_key, package: data.package_key, calls: data.calls });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "查询失败" }, { status: 500 });
  }
}

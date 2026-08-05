// 公开：海外买家购买词元 API 调用额度 → 创建 Stripe Checkout 会话
// 流程：生成待激活 key + 待支付订单 → 重定向到 Stripe 托管收银台（test 模式）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { getStripe, getPackage } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { ok: false, error: "支付通道未配置（请在 Vercel 环境变量设置 STRIPE_SECRET_KEY）" },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const pkg = getPackage(body.package);
    if (!pkg) return NextResponse.json({ ok: false, error: "套餐不存在" }, { status: 400 });

    const buyerEmail = (body.email || "").trim();
    const buyerName = (body.name || "").trim() || "API Buyer";
    const origin = new URL(request.url).origin;

    const supabase = getServiceRoleClient();
    const apiKey = "tk_" + crypto.randomBytes(16).toString("hex");

    // 1) 先落 key（pending，待支付后由 webhook 激活）
    const { data: keyRow, error: keyErr } = await supabase
      .from("token_api_keys")
      .insert({
        api_key: apiKey,
        name: buyerName,
        owner: buyerEmail || "api-buyer",
        status: "pending",
        credit_balance: pkg.calls,
        credit_used: 0,
      })
      .select()
      .single();
    if (keyErr) throw keyErr;

    // 2) 落订单（pending）
    const { data: order, error: orderErr } = await supabase
      .from("token_orders")
      .insert({
        api_key_id: keyRow.id,
        api_key: apiKey,
        package_key: pkg.key,
        amount: pkg.amount,
        currency: "usd",
        calls: pkg.calls,
        buyer_email: buyerEmail || null,
        buyer_name: buyerName,
        status: "pending",
      })
      .select()
      .single();
    if (orderErr) throw orderErr;

    // 3) 创建 Stripe Checkout 会话（托管收银台，支持外币/信用卡/支付宝等）
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `词元 API 调用额度 · ${pkg.nameEn} (${pkg.calls} calls)`,
              description: "Luo Zhidie Choice — Token API call credits",
            },
            unit_amount: pkg.amount,
          },
          quantity: 1,
        },
      ],
      customer_email: buyerEmail || undefined,
      metadata: { api_key_id: String(keyRow.id), order_id: String(order.id), package: pkg.key },
      success_url: `${origin}/tokens-market?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/tokens-market`,
    });

    // 4) 回写 session id
    await supabase.from("token_orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return NextResponse.json({ ok: true, url: session.url, sessionId: session.id });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "下单失败" }, { status: 500 });
  }
}

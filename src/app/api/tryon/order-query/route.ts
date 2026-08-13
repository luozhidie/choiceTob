// app/api/tryon/order-query/route.ts
// 手动查单补发：前端支付后若回调延迟，可调此接口主动同步微信订单状态并发放权益。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orderQuery } from "@/lib/wechat-pay";

const PACKAGES: Record<string, { type: string; days: number; normal: number; pro: number }> = {
  tryon_first_1yuan:       { type: "first",        days: 365, normal: 9,   pro: 1 },
  tryon_normal_monthly_59: { type: "normal_month", days: 30,  normal: 70,  pro: 0 },
  tryon_pro_monthly_199:   { type: "pro_month",    days: 30,  normal: 0,   pro: 200 },
  tryon_pro_year_999:      { type: "pro_year",     days: 365, normal: 0,   pro: 1000 },
  tryon_test_cent:         { type: "test",         days: 7,   normal: 1,   pro: 1 },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let order_no = searchParams.get("order_no");
    const suffix = searchParams.get("suffix");

    const supabase = await createClient();
    let order: any = null;

    if (order_no) {
      const { data } = await supabase.from("tryon_orders").select("*").eq("order_no", order_no).single();
      order = data;
    } else if (suffix) {
      const { data } = await supabase
        .from("tryon_orders")
        .select("*")
        .like("order_no", `%${suffix}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      order = data;
      order_no = order?.order_no || suffix;
    }

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    const wx = await orderQuery(order_no);
    const tradeState = wx.trade_state;

    if (tradeState === "SUCCESS" && order.status !== "paid") {
      await supabase
        .from("tryon_orders")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          transaction_id: wx.transaction_id,
        })
        .eq("order_no", order_no);

      await grantEntitlement(supabase, order.openid, order.package_id);
    }

    const { data: ent } = await supabase
      .from("tryon_entitlements")
      .select("*")
      .eq("openid", order.openid)
      .single();

    return NextResponse.json({
      success: true,
      wechat_state: tradeState,
      order: { order_no: order.order_no, status: order.status, package_id: order.package_id, openid: order.openid },
      entitlement: ent || null,
    });
  } catch (err: any) {
    console.error("[试衣查单] 异常", err);
    return NextResponse.json({ error: err.message || "查单失败" }, { status: 500 });
  }
}

async function grantEntitlement(supabase: any, openid: string, package_id: string) {
  const pkg = PACKAGES[package_id];
  if (!pkg) return;
  const now = Date.now();
  const windowMs = pkg.days * 86400000;
  const computedExpires = now + windowMs;

  const { data: exist } = await supabase
    .from("tryon_entitlements")
    .select("*")
    .eq("openid", openid)
    .single();

  let normalLeft: number;
  let proLeft: number;
  let finalExpires: number;
  let type: string;

  if (exist) {
    const existExpires = new Date(exist.expires_at).getTime();
    finalExpires = Math.max(existExpires, computedExpires);
    const expired = existExpires <= now;
    if (pkg.type === "first") {
      normalLeft = Math.min((exist.normal_left || 0) + pkg.normal, pkg.normal);
      proLeft = Math.min((exist.pro_left || 0) + pkg.pro, pkg.pro);
    } else if (expired) {
      normalLeft = pkg.normal;
      proLeft = pkg.pro;
    } else {
      normalLeft = (exist.normal_left || 0) + pkg.normal;
      proLeft = (exist.pro_left || 0) + pkg.pro;
    }
    type = pkg.type === "first" ? (exist.type !== "first" ? exist.type : "first") : pkg.type;
  } else {
    finalExpires = computedExpires;
    normalLeft = pkg.normal;
    proLeft = pkg.pro;
    type = pkg.type;
  }

  await supabase.from("tryon_entitlements").upsert(
    {
      openid,
      type,
      expires_at: new Date(finalExpires).toISOString(),
      normal_left: normalLeft,
      pro_left: proLeft,
      tries_left: normalLeft + proLeft,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "openid" }
  );
}

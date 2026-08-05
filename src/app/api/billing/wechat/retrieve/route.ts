// 公开：微信支付完成后凭订单号取回 API Key
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const orderNo = new URL(request.url).searchParams.get("order_no");
    if (!orderNo) return NextResponse.json({ ok: false, error: "缺少 order_no" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("token_orders")
      .select("api_key, package_key, calls, status")
      .eq("out_trade_no", orderNo)
      .is("deleted_at", null)
      .single();
    if (!data) return NextResponse.json({ ok: false, error: "订单不存在" }, { status: 404 });

    const paid = data.status === "paid";
    return NextResponse.json({
      ok: true,
      paid,
      api_key: paid ? data.api_key : null,
      package: data.package_key,
      calls: data.calls,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "查询失败" }, { status: 500 });
  }
}

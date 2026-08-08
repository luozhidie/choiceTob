// 公开：微信支付完成后凭订单号取回 API Key
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { orderQuery } from "@/lib/wechat-pay";

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

    let paid = data.status === "paid";

    // 兜底履约：DB 仍为 pending 时，直接向微信核实支付状态并激活，
    // 防止 webhook 未达/延迟导致买家已付款却长期拿不到 key。
    if (!paid) {
      try {
        const wx = await orderQuery(orderNo);
        if (wx.trade_state === "SUCCESS") {
          paid = true;
          await supabase
            .from("token_orders")
            .update({ status: "paid", updated_at: new Date().toISOString() })
            .eq("out_trade_no", orderNo);
          if (data.api_key) {
            await supabase.from("token_api_keys").update({ status: "active" }).eq("api_key", data.api_key);
          }
        }
      } catch {
        /* 微信查询失败则保持 pending，下次轮询再试 */
      }
    }

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

// app/api/virtual-pay/grant/route.ts
// 虚拟支付发货：客户端 wx.requestVirtualPayment success 后调用本接口发放权益
// 双重保险：本接口 + /api/virtual-pay/notify（微信发货推送），任一成功即到账，且幂等
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { deliverVirtualGoods } from "@/lib/virtual-deliver";
import { queryOrder, notifyProvideGoods, isPaidStatus, VIRTUAL_ENV } from "@/lib/virtual-pay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const outTradeNo = String(body.outTradeNo || "");
    if (!outTradeNo) return NextResponse.json({ error: "缺少 outTradeNo" }, { status: 400 });

    const svc = createServiceRoleClient();

    const { data: order } = await svc
      .from("virtual_orders")
      .select("out_trade_no, openid, goods_key, product_id, env, status")
      .eq("out_trade_no", outTradeNo)
      .maybeSingle();

    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    if (order.status === "paid") {
      return NextResponse.json({ success: true, granted: true, duplicate: true });
    }

    // 1) 尽力核实：调 /xpay/query_order 确认真实支付
    //    仅在「明确查到订单且状态不是已支付」时拒绝；接口异常/限频时放行，
    //    因为客户端已拿到 wx.requestVirtualPayment 的 success 回调作为背书，
    //    卡住真实付费用户比多放行一单更糟（且 notify 推送仍会兜底核对）。
    const env = Number(order.env ?? VIRTUAL_ENV) === 1 ? 1 : 0;
    let hardFail = false;
    try {
      const r: any = await queryOrder(outTradeNo, order.openid, env);
      if (r && (r.errcode === 0 || r.errCode === 0)) {
        const info = r.order || r.order_info || null;
        if (info && !isPaidStatus(info.status)) {
          console.warn("[虚拟支付] 订单状态不可发货", { outTradeNo, status: info.status });
          hardFail = true;
        }
      } else {
        console.warn("[虚拟支付] query_order 未成功，放行发货", JSON.stringify(r).slice(0, 200));
      }
    } catch (e: any) {
      console.warn("[虚拟支付] query_order 异常，放行发货", e?.message);
    }
    if (hardFail) {
      return NextResponse.json({ error: "订单未支付，发货已拒绝" }, { status: 402 });
    }

    // 2) 发放权益（幂等）
    const result = await deliverVirtualGoods(svc, order.openid, order.goods_key || order.product_id, outTradeNo);

    // 3) 通知平台已发货（失败可忽略，推送分支会兜底）
    try {
      await notifyProvideGoods(outTradeNo, env);
    } catch (e: any) {
      console.warn("[虚拟支付] notifyProvideGoods 失败（可忽略）", e?.message);
    }

    return NextResponse.json({ success: true, granted: result === "granted", result });
  } catch (err: any) {
    console.error("[虚拟支付发货] 异常", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

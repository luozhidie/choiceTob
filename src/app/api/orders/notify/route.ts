import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifySign } from "@/lib/payment";

/**
 * POST /api/orders/notify
 * 虎皮椒支付回调通知
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: Record<string, string> = {};

    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const appSecret = process.env.XUNHU_SECRET!;

    // 验证签名
    if (appSecret && !verifySign(params, appSecret)) {
      console.error("支付回调签名验证失败:", params);
      return new NextResponse("sign error", { status: 400 });
    }

    const tradeOrderId = params.trade_order_id;
    const status = params.status;
    const transactionId = params.transaction_id;

    if (!tradeOrderId) {
      return new NextResponse("missing trade_order_id", { status: 400 });
    }

    // status=OD 表示支付成功
    if (status === "OD") {
      const supabase = await createClient();

      // 幂等处理：先查订单状态
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("status")
        .eq("order_no", tradeOrderId)
        .single();

      if (existingOrder && existingOrder.status === "paid") {
        // 已处理过，直接返回成功
        return new NextResponse("success", { status: 200 });
      }

      // 更新订单状态
      const { error } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_trade_no: transactionId || null,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("order_no", tradeOrderId);

      if (error) {
        console.error("更新订单状态失败:", error);
        return new NextResponse("db error", { status: 500 });
      }

      console.log(`订单 ${tradeOrderId} 支付成功，交易号: ${transactionId}`);
    }

    return new NextResponse("success", { status: 200 });
  } catch (err: any) {
    console.error("支付回调处理异常:", err);
    return new NextResponse("error", { status: 500 });
  }
}

// GET 方式的回调（虎皮椒某些场景会用GET）
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const appSecret = process.env.XUNHU_SECRET!;

  if (appSecret && !verifySign(params, appSecret)) {
    return new NextResponse("sign error", { status: 400 });
  }

  const tradeOrderId = params.trade_order_id;
  const status = params.status;

  if (status === "OD" && tradeOrderId) {

    const { data: existingOrder } = await supabase
      .from("orders")
      .select("status")
      .eq("order_no", tradeOrderId)
      .single();

    if (existingOrder && existingOrder.status !== "paid") {
      await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_trade_no: params.transaction_id || null,
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("order_no", tradeOrderId);
    }
  }

  // 重定向回网站
  return NextResponse.redirect(
    new URL("/buyer?paid=1", req.url).toString()
  );
}

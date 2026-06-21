import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/orders/status?order_no=xxx
 * 查询订单支付状态（前端轮询）
 */
export async function GET(req: NextRequest) {
  try {
    const orderNo = req.nextUrl.searchParams.get("order_no");

    if (!orderNo) {
      return NextResponse.json(
        { error: "order_no is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 鉴权：必须登录
    if (authErr || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("order_no, status, paid_at, total_amount")
      .eq("order_no", orderNo)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    return NextResponse.json({
      order_no: data.order_no,
      status: data.status,
      paid_at: data.paid_at,
      total_amount: data.total_amount,
      is_paid: data.status === "paid",
    });
  } catch (err: any) {
    console.error("查询订单状态失败:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// app/api/wechat-pay/query/route.ts
// 查询微信支付订单状态
import { NextRequest, NextResponse } from "next/server";
import { orderQuery } from "@/lib/wechat-pay";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order_no = searchParams.get('order_no');

    if (!order_no) {
      return NextResponse.json({ error: '缺少 order_no 参数' }, { status: 400 });
    }

    const result = await orderQuery(order_no);

    return NextResponse.json({
      success: true,
      trade_state: result.trade_state,
      trade_state_desc: result.trade_state_desc,
      transaction_id: result.transaction_id,
      // SUCCESS—支付成功
      // NOTPAY—未支付
      // CLOSED—已关闭
      // REVOKED—已撤销（刷卡支付）
      // USERPAYING--用户支付中（仅用于付款码支付）
      // PAYERROR--支付失败(其他原因，如银行返回失败)
      is_paid: result.trade_state === 'SUCCESS',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
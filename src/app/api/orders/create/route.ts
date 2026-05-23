import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPayment, generateOrderNo } from "@/lib/payment";

/**
 * POST /api/orders/create
 * 创建订单并获取支付二维码
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      product_id,
      product_title,
      product_price,
      quantity,
      contact,
      address,
      note,
      payment_type = "wechat",
    } = body;

    if (!product_id || !contact) {
      return NextResponse.json(
        { error: "product_id and contact are required" },
        { status: 400 }
      );
    }

    const qty = Math.max(1, quantity || 1);
    const totalAmount = (product_price || 0) * qty;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "订单金额必须大于0" },
        { status: 400 }
      );
    }

    const orderNo = generateOrderNo();
    const totalFeeYuan = (totalAmount / 100).toFixed(2);

    const supabase = await createClient();

    // 写入订单
    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        product_id,
        product_title,
        product_price: product_price,
        quantity: qty,
        total_amount: totalAmount,
        contact,
        address: address || null,
        note: note || null,
        status: "pending",
        payment_method: payment_type,
      })
      .select()
      .single();

    if (dbError) {
      console.error("创建订单失败:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 调用虎皮椒支付
    const appId = process.env.XUNHU_APPID!;
    const appSecret = process.env.XUNHU_SECRET!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://colour-choice.art";

    if (!appId || !appSecret) {
      // 未配置支付密钥时，返回订单信息（测试模式）
      console.warn("支付密钥未配置，订单已创建但未发起支付");
      return NextResponse.json({
        success: true,
        order: order,
        payment: null,
        test_mode: true,
        message: "支付未配置，请联系客服完成付款",
      });
    }

    const paymentResult = await createPayment(
      {
        trade_order_id: orderNo,
        total_fee: totalFeeYuan,
        title: product_title || "骆芷蝶智选-商品采购",
        notify_url: `${siteUrl}/api/orders/notify`,
        return_url: `${siteUrl}/buyer?order=${orderNo}`,
        type: payment_type,
      },
      appId,
      appSecret
    );

    // 更新订单的支付信息
    await supabase
      .from("orders")
      .update({
        payment_url: paymentResult.url,
        payment_qrcode: paymentResult.url_qrcode,
      })
      .eq("order_no", orderNo);

    return NextResponse.json({
      success: true,
      order: order,
      payment: {
        url_qrcode: paymentResult.url_qrcode,
        url: paymentResult.url,
        order_id: paymentResult.order_id,
      },
    });
  } catch (err: any) {
    console.error("创建订单失败:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

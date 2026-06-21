import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateOrderNo } from "@/lib/payment";

/**
 * POST /api/orders/create
 * 创建订单（线下转账模式）
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 检查用户是否已登录
    if (authError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }
    
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

    const price = Number(product_price) || 0;
    const qty = Math.max(1, quantity || 1);
    const totalAmount = price * qty;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "订单金额必须大于0" },
        { status: 400 }
      );
    }

    const orderNo = generateOrderNo();

    const { data: order, error: dbError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        user_id: user.id,
        product_id,
        product_title: product_title || "爆款样衣",
        product_price: price,
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

    return NextResponse.json({
      success: true,
      order: order,
      payment: null,
      offline_mode: true,
      message: "订单已创建，请扫码或转账付款",
    });
  } catch (err: any) {
    console.error("创建订单失败:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 使用 service role 创建订单（绕过 RLS）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      product_id,
      product_title,
      product_image,
      quantity,
      unit_price,
      discount_price,
      total_amount,
      status,
      shipping_address,
      shipping_name,
      shipping_phone,
      note,
      payment_method,
      user_id,
    } = body;

    if (!product_id || !quantity || !total_amount || !user_id) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("buyer_orders")
      .insert([
        {
          product_id,
          product_title,
          product_image,
          quantity,
          unit_price,
          discount_price: discount_price || unit_price,
          total_amount,
          status: status || "pending",
          shipping_address,
          shipping_name,
          shipping_phone,
          note,
          payment_method: payment_method || "wechat_pay",
          user_id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[创建订单] 失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[创建订单] 未捕获错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

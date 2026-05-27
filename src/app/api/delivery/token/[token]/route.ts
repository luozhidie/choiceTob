import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/delivery/token/[token]
 * 通过交付链接token获取订单和交付物信息（无需登录，公开接口）
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "无效的交付链接" }, { status: 400 });
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // 查找订单
    const { data: order, error: orderError } = await supabase
      .from("delivery_plans")
      .select("id, customer_name, title, description, service_type, product_type, status, price, notes, delivery_link, created_at, updated_at, confirmed_at, vip_level")
      .eq("delivery_link", token)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "交付链接无效或不存在" }, { status: 404 });
    }

    // 查找交付物
    const { data: items, error: itemsError } = await supabase
      .from("delivery_items")
      .select("id, item_name, file_url, file_type, file_size, description, sort_order, created_at")
      .eq("order_id", order.id)
      .order("sort_order", { ascending: true });

    // 查找状态日志
    const { data: statusLog } = await supabase
      .from("delivery_status_log")
      .select("from_status, to_status, note, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      order: {
        id: order.id,
        customerName: order.customer_name,
        title: order.title,
        description: order.description,
        serviceType: order.service_type,
        productType: order.product_type,
        status: order.status,
        price: order.price,
        notes: order.notes,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        confirmedAt: order.confirmed_at,
        vipLevel: order.vip_level,
      },
      items: items || [],
      statusLog: statusLog || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/delivery/token/[token]
 * 客户确认收货
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "无效的交付链接" }, { status: 400 });
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    // 查找并更新订单
    const { data: order } = await supabase
      .from("delivery_plans")
      .select("id, status")
      .eq("delivery_link", token)
      .single();

    if (!order) {
      return NextResponse.json({ error: "交付链接无效" }, { status: 404 });
    }

    if (order.status !== "delivered") {
      return NextResponse.json({ error: "当前状态不可确认收货" }, { status: 400 });
    }

    // 更新状态为已确认
    const now = new Date().toISOString();
    await supabase.from("delivery_plans").update({
      status: "confirmed",
      confirmed_at: now,
    }).eq("id", order.id);

    // 记录状态日志
    await supabase.from("delivery_status_log").insert([{
      order_id: order.id,
      from_status: "delivered",
      to_status: "confirmed",
      note: "客户确认收货",
    }]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

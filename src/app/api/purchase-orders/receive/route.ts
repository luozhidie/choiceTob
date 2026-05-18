import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "缺少 orderId" }, { status: 400 });

  const supabase = await createClient();

  // ── 获取订单 + 明细 ──
  const { data: order, error: orderErr } = await supabase
    .from("purchase_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (order.status === "received" || order.status === "completed") {
    return NextResponse.json({ error: "订单已收货，无需重复操作" }, { status: 400 });
  }

  const { data: items } = await supabase
    .from("purchase_order_items")
    .select("*")
    .eq("order_id", order.order_no);

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "订单无明细" }, { status: 400 });
  }

  // ── 逐条写入库存 ──
  let inserted = 0;
  let updated = 0;

  for (const item of items) {
    // 检查是否已有同款号库存
      const { data: existing } = await supabase
      .from("inventory")
      .select("id, stock_in_qty, current_stock, sales_qty")
        .eq("store_id", order.store_id)
        .eq("sku_code", item.sku_code)
        .eq("size", item.sizes || "均码")
        .maybeSingle();

    if (existing) {
      const newStockIn = (existing.stock_in_qty || 0) + (item.quantity || 0);
      const newCurrent = (existing.current_stock || 0) + (item.quantity || 0);
      await supabase.from("inventory").update({
        stock_in_qty: newStockIn,
        current_stock: newCurrent,
        unit_cost: item.cost_price || 0,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
      updated++;
    } else {
      await supabase.from("inventory").insert({
        store_id: order.store_id,
        sku_code: item.sku_code,
        product_name: item.product_name,
        category: item.category,
        color: item.colors || "",
        size: item.sizes || "均码",
        unit_cost: item.cost_price || 0,
        stock_in_qty: item.quantity || 0,
        current_stock: item.quantity || 0,
        sales_qty: 0,
        status: "normal",
      });
      inserted++;
    }
  }

  // ── 更新订单状态为 received ──
  await supabase.from("purchase_orders").update({
    status: "received",
    updated_at: new Date().toISOString(),
  }).eq("id", orderId);

  return NextResponse.json({
    success: true,
    message: `收货完成：新增 ${inserted} 条库存，更新 ${updated} 条库存`,
    inserted,
    updated,
    totalItems: items.length,
  });
}

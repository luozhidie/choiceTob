import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { storeId, supplier, avgCostPrice } = await req.json();
  if (!storeId) return NextResponse.json({ error: "缺少 storeId" }, { status: 400 });

  const supabase = await createClient();

  // ── 获取库存不足的SKU ──
  const { data: allInventory } = await supabase
    .from("inventory")
    .select("*")
    .eq("store_id", storeId);

  if (!allInventory || allInventory.length === 0) {
    return NextResponse.json({ error: "暂无库存数据" }, { status: 400 });
  }

  // 筛选需要补货的SKU
  const replenishItems = allInventory.filter((inv: any) => {
    const sellThrough = inv.stock_in_qty > 0 ? inv.sales_qty / inv.stock_in_qty : 0;
    const isLow = inv.current_stock === 0 || // 断货
      (sellThrough > 0.8 && inv.current_stock < 10) || // 热销低库存
      (inv.current_stock > 0 && inv.current_stock < 5);  // 低于5件
    return isLow;
  });

  if (replenishItems.length === 0) {
    return NextResponse.json({ message: "当前无需补货的SKU" });
  }

  const unitPrice = avgCostPrice || 150;

  // ── 计算补货量 ──
  // 基于销售速度计算：补货量 = 月均销量 × 2（补2个月的量）
  const replenishOrders = replenishItems.map((inv: any) => {
    const monthlySales = inv.sales_qty > 0 ? Math.ceil(inv.sales_qty / 1) : 10; // 假设1个月
    const reorderQty = Math.max(monthlySales * 2, 20); // 至少补20件

    return {
      store_id: storeId,
      sku_code: inv.sku_code,
      product_name: `[补货] ${inv.product_name}`,
      category: inv.category,
      season_type: "",
      style: "",
      colors: inv.color || "",
      sizes: inv.size || "均码",
      cost_price: unitPrice,
      retail_price: Math.round(unitPrice * 2.2),
      gross_margin_pct: Math.round((1 - 1 / 2.2) * 100),
      quantity: reorderQty,
      total_amount: Math.round(reorderQty * unitPrice),
      wave_band: "紧急补货",
      status: "draft",
    };
  });

  // ── 创建补货采购单 ──
  const totalAmount = replenishOrders.reduce((s: number, i: any) => s + i.total_amount, 0);
  const totalQty = replenishOrders.reduce((s: number, i: any) => s + i.quantity, 0);
  const orderNo = `RO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

  const { data: order, error: orderErr } = await supabase.from("purchase_orders").insert({
    store_id: storeId,
    order_no: orderNo,
    supplier: supplier || "待确认",
    total_amount: totalAmount,
    order_date: new Date().toISOString().slice(0, 10),
    payment_terms: "货到付款",
    status: "draft",
  }).select().single();

  if (orderErr) {
    return NextResponse.json({ error: "创建补货单失败: " + orderErr.message }, { status: 500 });
  }

  // 创建明细
  const itemsWithOrderId = replenishOrders.map(item => ({ ...item, order_id: orderNo }));
  await supabase.from("purchase_order_items").insert(itemsWithOrderId);

  return NextResponse.json({
    success: true,
    message: `已生成补货单 ${orderNo}，共 ${replenishOrders.length} 个款，${totalQty} 件，¥${totalAmount.toLocaleString()}`,
    order: {
      order_no: orderNo,
      item_count: replenishOrders.length,
      total_qty: totalQty,
      total_amount: totalAmount,
    },
    items: replenishOrders,
  });
}

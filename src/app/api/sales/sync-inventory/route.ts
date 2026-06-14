import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 销售数据同步库存
 * 
 * 两种模式：
 * 1. 简易模式（默认）：输入总销售件数，按各SKU当前库存比例自动扣减
 * 2. 精确模式：传入 { items: [{sku_code, sold_qty}] } 逐条扣减
 */
export async function POST(req: NextRequest) {
  // 检查用户是否已登录
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  
  const { storeId, mode, totalSold, items } = await req.json();
  if (!storeId) return NextResponse.json({ error: "缺少 storeId" }, { status: 400 });

  // ── 获取当前库存 ──
  const { data: inventory, error: invErr } = await supabase
    .from("inventory")
    .select("id, sku_code, product_name, current_stock, sales_qty, stock_in_qty")
    .eq("store_id", storeId);

  if (invErr || !inventory || inventory.length === 0) {
    return NextResponse.json({ error: "暂无库存数据" }, { status: 400 });
  }

  let updated = 0;

  if (mode === "exact" && items?.length > 0) {
    // ── 精确模式：逐条扣减 ──
    for (const item of items) {
      const inv = inventory.find((i: any) => i.sku_code === item.sku_code);
      if (!inv) continue;

      const newSold = (inv.sales_qty || 0) + (item.sold_qty || 0);
      const newCurrent = Math.max(0, (inv.current_stock || 0) - (item.sold_qty || 0));

      await supabase.from("inventory").update({
        sales_qty: newSold,
        current_stock: newCurrent,
        updated_at: new Date().toISOString(),
      }).eq("id", inv.id);
      updated++;
    }
  } else {
    // ── 简易模式：按比例扣减 ──
    const totalStock = inventory.reduce((s: number, i: any) => s + (i.current_stock || 0), 0);
    if (totalStock === 0) {
      return NextResponse.json({ error: "当前库存为0，无法同步" }, { status: 400 });
    }

    const sold = totalSold || 0;
    if (sold <= 0) {
      return NextResponse.json({ error: "请输入销售件数" }, { status: 400 });
    }

    let remaining = sold;

    // 按库存占比分配销量
    for (let i = 0; i < inventory.length; i++) {
      const inv = inventory[i] as any;
      const ratio = (inv.current_stock || 0) / totalStock;
      let qty = Math.round(sold * ratio);

      // 最后一条补齐差额
      if (i === inventory.length - 1) qty = remaining;

      // 不能超过当前库存
      qty = Math.min(qty, inv.current_stock || 0, remaining);
      if (qty <= 0) continue;

      const newSold = (inv.sales_qty || 0) + qty;
      const newCurrent = Math.max(0, (inv.current_stock || 0) - qty);

      await supabase.from("inventory").update({
        sales_qty: newSold,
        current_stock: newCurrent,
        updated_at: new Date().toISOString(),
      }).eq("id", inv.id);

      remaining -= qty;
      updated++;
    }
  }

  return NextResponse.json({
    success: true,
    message: `已同步 ${updated} 条库存记录`,
    updated,
  });
}

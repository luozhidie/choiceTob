import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_CATEGORIES } from "@/lib/styles";

export async function POST(req: NextRequest) {
  const { storeId, season, supplier, avgCostPrice } = await req.json();
  if (!storeId) return NextResponse.json({ error: "缺少 storeId" }, { status: 400 });

  const supabase = await createClient();

  // 鉴权：必须登录
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  // ── 加载96格矩阵 + 商品结构 ──
  const [{ data: matrix }, { data: structure }] = await Promise.all([
    supabase.from("product_matrix_plan").select("*").eq("store_id", storeId).maybeSingle(),
    supabase.from("product_structure_plan").select("*").eq("store_id", storeId).maybeSingle(),
  ]);

  if (!matrix?.matrix_data) {
    return NextResponse.json({ error: "请先完成96格商品矩阵规划" }, { status: 400 });
  }

  const matrixData = matrix.matrix_data as Record<string, Record<string, { sku: number; pct: number; budget: number }>>;
  const items = (structure?.items || []) as any[];
  const unitPrice = avgCostPrice || 150;

  // ── 从矩阵生成采购明细 ──
  const procurementItems: any[] = [];
  let seq = 1;

  const categories = items.length > 0
    ? items.map((i: any) => i.category)
    : PRODUCT_CATEGORIES.map(c => `${c.code}-${c.label}`);

  for (const [colorSeason, styles] of Object.entries(matrixData)) {
    for (const [style, cell] of Object.entries(styles)) {
      if (!cell || cell.sku <= 0) continue;

      const catIdx = (seq - 1) % categories.length;
      const category = categories[catIdx];

      procurementItems.push({
        store_id: storeId,
        sku_code: `SP-${season || "SS"}-${String(seq).padStart(3, "0")}`,
        product_name: `${colorSeason}×${style} ${category}`,
        category,
        season_type: colorSeason,
        style,
        colors: "",
        sizes: "S,M,L,XL",
        cost_price: unitPrice,
        retail_price: Math.round(unitPrice * 2.2),
        gross_margin_pct: Math.round((1 - 1 / 2.2) * 100),
        quantity: cell.sku,
        total_amount: Math.round(cell.sku * unitPrice),
        wave_band: cell.pct > 20 ? "第一波" : cell.pct > 10 ? "第二波" : cell.pct > 5 ? "第三波" : "第四波",
        status: "draft",
      });
      seq++;
    }
  }

  if (procurementItems.length === 0) {
    return NextResponse.json({ error: "矩阵中没有有效SKU，请先在矩阵中填写数据" }, { status: 400 });
  }

  // ── 按波段分组创建采购订单 ──
  const waveGroups: Record<string, any[]> = {};
  procurementItems.forEach(item => {
    const wave = item.wave_band;
    if (!waveGroups[wave]) waveGroups[wave] = [];
    waveGroups[wave].push(item);
  });

  const orders = [];
  for (const [wave, waveItems] of Object.entries(waveGroups)) {
    const totalAmount = waveItems.reduce((s, i) => s + i.total_amount, 0);
    const orderNo = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

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
      console.error("创建采购订单失败:", orderErr);
      continue;
    }

    // 写入采购明细（去掉 order_id 引用，用 order_no 关联）
    const itemsToInsert = waveItems.map(item => {
      const { store_id, sku_code, product_name, category, season_type, style, colors, sizes, cost_price, retail_price, gross_margin_pct, quantity, total_amount, wave_band, status } = item;
      return {
        order_id: orderNo,
        store_id,
        sku_code,
        product_name,
        category,
        season_type,
        style,
        colors,
        sizes,
        cost_price,
        retail_price,
        gross_margin_pct,
        quantity,
        total_amount,
        wave_band,
        status,
      };
    });

    const { error: itemsErr } = await supabase.from("purchase_order_items").insert(itemsToInsert);
    if (itemsErr) {
      console.error("创建采购明细失败:", itemsErr);
    }

    orders.push({
      order_no: orderNo,
      wave,
      item_count: waveItems.length,
      total_sku: waveItems.reduce((s, i) => s + i.quantity, 0),
      total_amount: totalAmount,
    });
  }

  return NextResponse.json({
    success: true,
    message: `已生成 ${orders.length} 张采购订单，共 ${procurementItems.length} 个款`,
    orders,
    totalItems: procurementItems.length,
    totalSku: procurementItems.reduce((s, i) => s + i.quantity, 0),
    totalAmount: procurementItems.reduce((s, i) => s + i.total_amount, 0),
  });
}

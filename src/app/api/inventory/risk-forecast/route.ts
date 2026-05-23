import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 库存风险预测 API
 *
 * 闭环逻辑：
 * 1. 读取指定店铺的库存数据
 * 2. 基于日均销量计算每个 SKU 的可售天数
 * 3. 预测7天/14天/30天的库存风险
 * 4. 返回风险列表 + 补货建议
 * 5. 写回 inventory 表的风险字段（daily_avg_sales, days_of_stock, risk_level, suggested_reorder_qty）
 *
 * 风险等级：
 *   danger   - 已断货或7天内断货
 *   warning  - 14天内断货
 *   overstock - 滞销积压（周转>60天且库存>50件）
 *   normal   - 正常
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const storeId = body.store_id || body.storeId;

    if (!storeId) {
      return NextResponse.json({ error: "缺少 store_id" }, { status: 400 });
    }

    // ── 读取库存数据 ──
    const { data: inventory, error: invError } = await supabase
      .from("inventory")
      .select("*")
      .eq("store_id", storeId);

    if (invError || !inventory || inventory.length === 0) {
      return NextResponse.json({ error: "暂无库存数据" }, { status: 400 });
    }

    // ── 读取销售数据（如果有周期性销售记录）──
    const { data: salesData } = await supabase
      .from("weekly_sales_analysis")
      .select("sales_amount, sales_units, sale_date, period_type")
      .eq("store_id", storeId)
      .order("sale_date", { ascending: false })
      .limit(30);

    // 计算店铺日均销量（从销售记录推算，更准确）
    let storeDailyAvgUnits = 0;
    if (salesData && salesData.length > 0) {
      const totalUnits = salesData.reduce((sum: number, s: any) => sum + (s.sales_units || 0), 0);
      // 根据period_type计算天数
      const totalDays = salesData.reduce((sum: number, s: any) => {
        if (s.period_type === "day") return sum + 1;
        if (s.period_type === "week") return sum + 7;
        if (s.period_type === "month") return sum + 30;
        return sum + 7; // 默认按周
      }, 0);
      storeDailyAvgUnits = totalDays > 0 ? totalUnits / totalDays : 0;
    }

    // ── 逐 SKU 计算风险 ──
    const riskResults = inventory.map((item: any) => {
      // 日均销量：优先用 SKU 自身销量/30，如果有销售记录则用更准确的计算
      const dailyAvgSales = item.sales_qty > 0 ? item.sales_qty / 30 : 0;

      // 可售天数
      const daysOfStock = dailyAvgSales > 0
        ? Math.floor(item.current_stock / dailyAvgSales)
        : 999;

      // 售罄率
      const sellThrough = item.stock_in_qty > 0
        ? item.sales_qty / item.stock_in_qty
        : 0;

      // 风险等级判定
      let riskLevel: "danger" | "warning" | "overstock" | "normal" = "normal";
      let riskLabel = "正常";
      let suggestedReorderQty = 0;
      let urgentAction = "";

      if (item.current_stock === 0) {
        riskLevel = "danger";
        riskLabel = "已断货";
        suggestedReorderQty = Math.max(Math.round(dailyAvgSales * 14), 20);
        urgentAction = "紧急补货：立即下单，库存已归零";
      } else if (daysOfStock <= 7) {
        riskLevel = "danger";
        riskLabel = "7天内断货";
        suggestedReorderQty = Math.max(Math.round(dailyAvgSales * 14), 20);
        urgentAction = `仅剩 ${item.current_stock} 件，预计 ${daysOfStock} 天售罄，建议补 ${suggestedReorderQty} 件`;
      } else if (daysOfStock <= 14) {
        riskLevel = "warning";
        riskLabel = "14天内断货";
        suggestedReorderQty = Math.max(Math.round(dailyAvgSales * 7), 10);
        urgentAction = `预计 ${daysOfStock} 天售罄，建议补 ${suggestedReorderQty} 件`;
      } else if (daysOfStock > 60 && item.current_stock > 50) {
        riskLevel = "overstock";
        riskLabel = "滞销积压";
        suggestedReorderQty = 0;
        urgentAction = `周转 ${daysOfStock} 天，库存 ${item.current_stock} 件，建议促销或退货`;
      } else {
        urgentAction = "库存正常，无需操作";
      }

      return {
        id: item.id,
        sku_code: item.sku_code,
        product_name: item.product_name,
        category: item.category,
        color: item.color,
        size: item.size,
        current_stock: item.current_stock,
        stock_in_qty: item.stock_in_qty,
        sales_qty: item.sales_qty,
        unit_cost: item.unit_cost,
        daily_avg_sales: parseFloat(dailyAvgSales.toFixed(2)),
        days_of_stock: daysOfStock,
        sell_through_pct: parseFloat((sellThrough * 100).toFixed(1)),
        risk_level: riskLevel,
        risk_label: riskLabel,
        suggested_reorder_qty: suggestedReorderQty,
        urgent_action: urgentAction,
        stock_value: item.current_stock * (item.unit_cost || 0),
      };
    });

    // ── 写回 inventory 表的风险字段 ──
    for (const r of riskResults) {
      await supabase
        .from("inventory")
        .update({
          daily_avg_sales: r.daily_avg_sales,
          days_of_stock: r.days_of_stock,
          risk_level: r.risk_level,
          suggested_reorder_qty: r.suggested_reorder_qty,
          updated_at: new Date().toISOString(),
        })
        .eq("id", r.id);
    }

    // ── 汇总统计 ──
    const dangerItems = riskResults.filter(r => r.risk_level === "danger");
    const warningItems = riskResults.filter(r => r.risk_level === "warning");
    const overstockItems = riskResults.filter(r => r.risk_level === "overstock");
    const normalItems = riskResults.filter(r => r.risk_level === "normal");

    // 需要补货的 SKU（danger + warning）
    const replenishNeeded = [...dangerItems, ...warningItems];
    const totalReplenishAmount = replenishNeeded.reduce(
      (sum, r) => sum + r.suggested_reorder_qty * (r.unit_cost || 150), 0
    );

    return NextResponse.json({
      success: true,
      store_id: storeId,
      total_sku: riskResults.length,
      store_daily_avg_units: parseFloat(storeDailyAvgUnits.toFixed(1)),
      summary: {
        danger: dangerItems.length,
        warning: warningItems.length,
        overstock: overstockItems.length,
        normal: normalItems.length,
      },
      replenish_summary: {
        items_need_replenish: replenishNeeded.length,
        total_replenish_qty: replenishNeeded.reduce((s, r) => s + r.suggested_reorder_qty, 0),
        estimated_cost: totalReplenishAmount,
      },
      risks: {
        danger: dangerItems,
        warning: warningItems,
        overstock: overstockItems,
      },
      all_items: riskResults,
    });
  } catch (error: any) {
    console.error("/api/inventory/risk-forecast error:", error);
    return NextResponse.json({ error: error.message || "服务器内部错误" }, { status: 500 });
  }
}

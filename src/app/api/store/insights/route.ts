import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/store/insights?storeId=xxx
 *
 * 统一数据洞察接口 — 所有模块（企划/买手/营销/销售/货盘）共用
 * 返回：VIP画像 + 经营数据 + 市场快照 + 库存概览
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("storeId");
    const sections = searchParams.get("sections")?.split(",") || ["vip", "business", "inventory", "sales"];

    if (!storeId) {
      return NextResponse.json({ error: "缺少storeId" }, { status: 400 });
    }

    const supabase = await createClient();

    // 鉴权：必须登录且为 admin/owner
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["admin", "owner"].includes(profile.role)) {
      return NextResponse.json({ error: "无权限访问" }, { status: 403 });
    }
    const result: Record<string, any> = {};

    // ===== VIP画像 =====
    if (sections.includes("vip")) {
      const { data: vipList } = await supabase
        .from("vip_customers")
        .select("id, full_name, color_season, style_result, total_spent, purchase_count, vip_level, last_purchase_date")
        .eq("store_id", storeId)
        .order("total_spent", { ascending: false })
        .limit(200);

      const { data: styleTests } = await supabase
        .from("style_test_results")
        .select("style_result, color_season")
        .eq("store_id", storeId)
        .limit(500);

      let colorAnalysis: any[] | null = null;
      try {
        const caRes = await supabase
          .from("color_analyses")
          .select("season_type, sub_type")
          .eq("store_id", storeId)
          .limit(500);
        if (!caRes.error) colorAnalysis = caRes.data;
      } catch (e) { /* color_analyses 表可能不存在 */ }

      if (vipList && vipList.length > 0) {
        // 色彩季型分布
        const colorSeasonMap: Record<string, { count: number; totalSpent: number; purchaseCount: number }> = {};
        const styleMap: Record<string, { count: number; totalSpent: number; purchaseCount: number }> = {};
        const vipLevelMap: Record<string, number> = {};
        let totalRevenue = 0;
        let totalPurchases = 0;
        const spendingBands = { "低频低额": 0, "低频高额": 0, "高频低额": 0, "高频高额": 0 };

        for (const vip of vipList) {
          const cs = vip.color_season || "未测试";
          if (!colorSeasonMap[cs]) colorSeasonMap[cs] = { count: 0, totalSpent: 0, purchaseCount: 0 };
          colorSeasonMap[cs].count++;
          colorSeasonMap[cs].totalSpent += (vip.total_spent || 0);
          colorSeasonMap[cs].purchaseCount += (vip.purchase_count || 0);

          const st = vip.style_result || "未测试";
          if (!styleMap[st]) styleMap[st] = { count: 0, totalSpent: 0, purchaseCount: 0 };
          styleMap[st].count++;
          styleMap[st].totalSpent += (vip.total_spent || 0);
          styleMap[st].purchaseCount += (vip.purchase_count || 0);

          vipLevelMap[vip.vip_level || "基础"] = (vipLevelMap[vip.vip_level || "基础"] || 0) + 1;
          totalRevenue += (vip.total_spent || 0);
          totalPurchases += (vip.purchase_count || 0);

          const spent = (vip.total_spent || 0);
          const count = (vip.purchase_count || 0);
          if (count < 3 && spent < 3000) spendingBands["低频低额"]++;
          else if (count < 3 && spent >= 3000) spendingBands["低频高额"]++;
          else if (count >= 3 && spent < 3000) spendingBands["高频低额"]++;
          else spendingBands["高频高额"]++;
        }

        // 风格测试聚合
        const styleTestStats: Record<string, number> = {};
        if (styleTests) for (const t of styleTests) if (t.style_result) styleTestStats[t.style_result] = (styleTestStats[t.style_result] || 0) + 1;

        // 色彩分析聚合
        const colorAnalysisStats: Record<string, number> = {};
        if (colorAnalysis) for (const ca of colorAnalysis) {
          if (ca.season_type) {
            const label = ca.sub_type ? `${ca.season_type}${ca.sub_type}` : ca.season_type;
            colorAnalysisStats[label] = (colorAnalysisStats[label] || 0) + 1;
          }
        }

        result.vip = {
          total: vipList.length,
          tested: vipList.filter((v: any) => v.color_season || v.style_result).length,
          colorSeasonDistribution: Object.fromEntries(
            Object.entries(colorSeasonMap).map(([k, v]) => [k, {
              pct: Math.round(v.count / vipList.length * 100),
              count: v.count,
              avgSpent: Math.round(v.totalSpent / v.count),
              avgPurchases: Math.round(v.purchaseCount / v.count * 10) / 10,
            }])
          ),
          styleDistribution: Object.fromEntries(
            Object.entries(styleMap).map(([k, v]) => [k, {
              pct: Math.round(v.count / vipList.length * 100),
              count: v.count,
              avgSpent: Math.round(v.totalSpent / v.count),
              avgPurchases: Math.round(v.purchaseCount / v.count * 10) / 10,
            }])
          ),
          vipLevelDistribution: vipLevelMap,
          spendingBands,
          totalRevenue,
          totalPurchases,
          avgSpent: Math.round(totalRevenue / vipList.length),
          avgPurchases: Math.round(totalPurchases / vipList.length * 10) / 10,
          styleTestStats,
          colorAnalysisStats,
        };
      } else {
        result.vip = { total: 0, tested: 0 };
      }
    }

    // ===== 经营数据 =====
    if (sections.includes("business")) {
      const { data: store } = await supabase.from("stores").select("business_data, member_stats, business_goals").eq("id", storeId).single();
      result.business = (store as any)?.business_data || {};
      result.memberStats = (store as any)?.member_stats || {};
      result.goals = (store as any)?.business_goals || {};
    }

    // ===== 库存概览 =====
    if (sections.includes("inventory")) {
      const { data: inventory } = await supabase
        .from("inventory")
        .select("category, color, unit_cost, stock_in_qty, current_stock, sales_qty")
        .eq("store_id", storeId)
        .limit(500);

      if (inventory && inventory.length > 0) {
        // 品类库存统计
        const categoryStats: Record<string, { qty: number; sold: number; stockValue: number; sellThrough: number }> = {};
        // 颜色库存统计
        const colorStats: Record<string, { qty: number; sold: number }> = {};

        let totalStock = 0;
        let totalSold = 0;
        let totalValue = 0;
        let overstockCount = 0;
        let lowStockCount = 0;

        for (const item of inventory) {
          const cat = item.category || "其他";
          const color = item.color || "未知";
          const stock = item.current_stock || 0;
          const sold = item.sales_qty || 0;
          const value = stock * (item.unit_cost || 0);
          const sellThrough = item.stock_in_qty > 0 ? Math.round(sold / item.stock_in_qty * 100) : 0;

          if (!categoryStats[cat]) categoryStats[cat] = { qty: 0, sold: 0, stockValue: 0, sellThrough: 0 };
          categoryStats[cat].qty += stock;
          categoryStats[cat].sold += sold;
          categoryStats[cat].stockValue += value;

          if (!colorStats[color]) colorStats[color] = { qty: 0, sold: 0 };
          colorStats[color].qty += stock;
          colorStats[color].sold += sold;

          totalStock += stock;
          totalSold += sold;
          totalValue += value;

          if (sellThrough < 30 && stock > 10) overstockCount++;
          if (stock < 3 && sold > 5) lowStockCount++;
        }

        // 计算品类平均动销率
        for (const cat of Object.keys(categoryStats)) {
          const s = categoryStats[cat];
          categoryStats[cat].sellThrough = s.qty + s.sold > 0 ? Math.round(s.sold / (s.qty + s.sold) * 100) : 0;
        }

        result.inventory = {
          totalSKUs: inventory.length,
          totalStock,
          totalSold,
          totalStockValue: totalValue,
          overallSellThrough: totalStock + totalSold > 0 ? Math.round(totalSold / (totalStock + totalSold) * 100) : 0,
          overstockCount,
          lowStockCount,
          categoryStats: Object.fromEntries(
            Object.entries(categoryStats).sort((a, b) => b[1].sold - a[1].sold)
          ),
          colorStats: Object.fromEntries(
            Object.entries(colorStats).sort((a, b) => b[1].sold - a[1].sold).slice(0, 15)
          ),
        };
      } else {
        result.inventory = { totalSKUs: 0 };
      }
    }

    // ===== 销售趋势 =====
    if (sections.includes("sales")) {
      let salesData: any[] | null = null;
      try {
        const salesRes = await supabase
          .from("weekly_sales_analysis")
          .select("*")
          .eq("store_id", storeId)
          .order("week_ending", { ascending: false })
          .limit(12);
        if (!salesRes.error) salesData = salesRes.data;
      } catch (e) { /* weekly_sales 查询容错 */ }

      result.sales = {
        recentWeeks: (salesData || []).map((s: any) => ({
          week: s.week_ending || s.week_start,
          revenue: s.total_revenue,
          orders: s.order_count,
          avgOrderValue: s.order_count > 0 ? Math.round(s.total_revenue / s.order_count) : 0,
        })),
        trend: salesData && salesData.length >= 4 ? calculateTrend(salesData) : "insufficient_data",
      };
    }

    return NextResponse.json({ storeId, ...result, generatedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("[store/insights] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function calculateTrend(salesData: any[]): string {
  if (!salesData || salesData.length < 4) return "insufficient_data";
  const recent4 = salesData.slice(0, 4);
  const prev4 = salesData.slice(4, 8);
  const recentAvg = recent4.reduce((s: number, w: any) => s + (w.total_revenue || 0), 0) / recent4.length;
  const prevAvg = prev4.length > 0 ? prev4.reduce((s: number, w: any) => s + (w.total_revenue || 0), 0) / prev4.length : recentAvg;
  if (recentAvg > prevAvg * 1.05) return "up";
  if (recentAvg < prevAvg * 0.95) return "down";
  return "stable";
}

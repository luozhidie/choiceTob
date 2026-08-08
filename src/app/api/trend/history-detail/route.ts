import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 历史爆款查询 API（按属性维度）
 *
 * GET /api/trend/history-detail?attr_type=color&attr_value=黑色&days=90
 * GET /api/trend/history-detail?attr_type=fabric&attr_value=F01&days=30
 *
 * attr_type: color | fabric | style | cut | pattern
 * days: 7 | 30 | 90 | 180 | 365
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const attrType = searchParams.get("attr_type") || "color";
    const attrValue = searchParams.get("attr_value") || "";
    const days = parseInt(searchParams.get("days") || "90");

    if (!attrValue) {
      return NextResponse.json({ error: "请提供 attr_value 参数" }, { status: 400 });
    }

    // 计算起始日期
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // 从 trend_history 表查询
    const { data, error } = await supabase
      .from("trend_history")
      .select("keyword, title, heat_score, sales_volume, recorded_at")
      .eq("keyword", attrValue)
      .gte("recorded_at", startDateStr)
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("[TrendHistory] 查询失败:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 按日期聚合热度
    const dailyMap: Record<string, { totalHeat: number; count: number; avgSales: number }> = {};
    for (const item of data || []) {
      const dateKey = (item.recorded_at as string).split("T")[0];
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { totalHeat: 0, count: 0, avgSales: 0 };
      }
      dailyMap[dateKey].totalHeat += item.heat_score || 0;
      dailyMap[dateKey].count += 1;
      dailyMap[dateKey].avgSales += item.sales_volume || 0;
    }

    const trendLine = Object.entries(dailyMap)
      .map(([date, stats]) => ({
        date,
        heat_score: Math.round(stats.totalHeat / stats.count),
        item_count: stats.count,
        avg_sales: Math.round(stats.avgSales / stats.count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 判断趋势方向
    let trendDirection: "rising" | "stable" | "declining" = "stable";
    if (trendLine.length >= 2) {
      const firstHalf = trendLine.slice(0, Math.ceil(trendLine.length / 2));
      const secondHalf = trendLine.slice(Math.ceil(trendLine.length / 2));
      const firstAvg = firstHalf.reduce((s, d) => s + d.heat_score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, d) => s + d.heat_score, 0) / secondHalf.length;
      if (secondAvg > firstAvg * 1.1) trendDirection = "rising";
      else if (secondAvg < firstAvg * 0.9) trendDirection = "declining";
    }

    return NextResponse.json({
      attr_type: attrType,
      attr_value: attrValue,
      days,
      trend_direction: trendDirection,
      data_points: trendLine,
      sample_items: (data || []).slice(0, 10).map((d: any) => ({
        title: d.title,
        heat_score: d.heat_score,
        sales_volume: d.sales_volume,
      })),
    });

  } catch (error: any) {
    console.error("[TrendHistory] API错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

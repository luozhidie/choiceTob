import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 后台 Dashboard 数据汇总 API
 * 使用 service role key，完全绕过 RLS
 * GET /api/admin/dashboard-stats?store_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id") || "";

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    // 并行查询所有数据，每个独立 catch
    const results = await Promise.allSettled([
      // 1. VIP客户数
      supabase.from("vip_customers").select("*", { count: "exact", head: true }).eq("store_id", storeId),
      // 2. 线索
      supabase.from("leads").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(5),
      // 3. 风格测试结果数
      supabase.from("style_test_results").select("*", { count: "exact", head: true }),
      // 4. 测试码
      supabase.from("test_codes").select("*"),
      // 5. 交付方案
      supabase.from("delivery_plans").select("*").order("created_at", { ascending: false }).limit(5),
      // 6. 订单
      supabase.from("orders").select("*"),
      // 7. 课程
      supabase.from("courses").select("*", { count: "exact" }),
      // 8. 商品
      supabase.from("products").select("*", { count: "exact" }),
      // 9. 库存
      supabase.from("inventory").select("*").eq("store_id", storeId),
    ]);

    // 解析结果，失败的返回默认值
    const [
      customersResult,
      leadsResult,
      testResultsResult,
      testCodesResult,
      deliveriesResult,
      ordersResult,
      coursesResult,
      productsResult,
      inventoryResult,
    ] = results;

    const customerCount = customersResult.status === "fulfilled" ? (customersResult.value.count || 0) : 0;
    
    const leadsData = leadsResult.status === "fulfilled" ? (leadsResult.value.data || []) : [];
    const leadCount = leadsResult.status === "fulfilled" ? (leadsResult.value.count || 0) : 0;
    const newLeadCount = leadsData.filter((l: any) => l.status === "new").length;
    const recentLeads = leadsData.slice(0, 5);

    const testResultCount = testResultsResult.status === "fulfilled" ? (testResultsResult.value.count || 0) : 0;

    const testCodesData = testCodesResult.status === "fulfilled" ? (testCodesResult.value.data || []) : [];
    const testCodeCount = testCodesData.length;
    const activeTestCodeCount = testCodesData.filter((t: any) => t.is_active).length;

    const deliveriesData = deliveriesResult.status === "fulfilled" ? (deliveriesResult.value.data || []) : [];
    const deliveryCount = deliveriesData.length;
    const recentDeliveries = deliveriesData.slice(0, 5);
    const draftDeliveryCount = deliveriesData.filter((d: any) => d.status === "draft").length;
    const deliveredCount = deliveriesData.filter((d: any) => d.status === "delivered" || d.status === "confirmed").length;

    const ordersData = ordersResult.status === "fulfilled" ? (ordersResult.value.data || []) : [];
    const orderCount = ordersData.length;
    const paidOrderCount = ordersData.filter((o: any) => o.status === "paid").length;
    const totalRevenue = ordersData.filter((o: any) => o.status === "paid").reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
    const pendingAmount = ordersData.filter((o: any) => o.status === "pending").reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

    const coursesData = coursesResult.status === "fulfilled" ? (coursesResult.value.data || []) : [];
    const courseCount = coursesResult.status === "fulfilled" ? (coursesResult.value.count || 0) : 0;
    const publishedCourseCount = coursesData.filter((c: any) => c.is_published).length;

    const productsData = productsResult.status === "fulfilled" ? (productsResult.value.data || []) : [];
    const productCount = productsResult.status === "fulfilled" ? (productsResult.value.count || 0) : 0;
    const publishedProductCount = productsData.filter((p: any) => p.is_published).length;

    const inventoryData = inventoryResult.status === "fulfilled" ? (inventoryResult.value.data || []) : [];
    let inventoryTotalValue = 0, inventorySellThroughRate = 0, lowStockCount = 0;
    let categoryDistribution: { name: string; value: number }[] = [];
    let stockStatusDistribution: { name: string; count: number }[] = [];
    if (inventoryData.length > 0) {
      inventoryTotalValue = inventoryData.reduce((sum: number, item: any) => sum + (item.current_stock || 0) * (item.unit_cost || 0), 0);
      const totalSalesQty = inventoryData.reduce((sum: number, item: any) => sum + (item.sales_qty || 0), 0);
      const totalStockInQty = inventoryData.reduce((sum: number, item: any) => sum + (item.stock_in_qty || 0), 0);
      inventorySellThroughRate = totalStockInQty > 0 ? (totalSalesQty / totalStockInQty) * 100 : 0;
      lowStockCount = inventoryData.filter((item: any) => (item.current_stock || 0) < 5).length;

      const categoryMap = new Map<string, number>();
      inventoryData.forEach((item: any) => {
        const category = item.category || "未分类";
        const value = (item.current_stock || 0) * (item.unit_cost || 0);
        categoryMap.set(category, (categoryMap.get(category) || 0) + value);
      });
      categoryDistribution = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));

      const normalStock = inventoryData.filter((item: any) => (item.current_stock || 0) >= 20).length;
      const lowStock = inventoryData.filter((item: any) => (item.current_stock || 0) >= 5 && (item.current_stock || 0) < 20).length;
      const outOfStock = inventoryData.filter((item: any) => (item.current_stock || 0) === 0).length;
      const slowMoving = inventoryData.filter((item: any) => (item.sales_qty || 0) === 0 && (item.current_stock || 0) > 0).length;
      stockStatusDistribution = [
        { name: "正常库存", count: normalStock },
        { name: "低库存", count: lowStock },
        { name: "断货", count: outOfStock },
        { name: "滞销", count: slowMoving },
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        customerCount,
        leadCount,
        newLeadCount,
        testResultCount,
        testCodeCount,
        activeTestCodeCount,
        deliveryCount,
        draftDeliveryCount,
        deliveredCount,
        orderCount,
        paidOrderCount,
        totalRevenue,
        pendingAmount,
        courseCount,
        publishedCourseCount,
        productCount,
        publishedProductCount,
        recentLeads,
        recentDeliveries,
        inventoryTotalValue,
        inventorySellThroughRate,
        lowStockCount,
        categoryDistribution,
        stockStatusDistribution,
        spaCycleData: { planning: 0, purchasing: 0, receiving: 0, sales: 0, replenishment: 0 },
      },
    });
  } catch (error: any) {
    console.error("[Dashboard API] 错误:", error);
    return NextResponse.json(
      { success: false, error: error.message || "服务器错误" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

/**
 * 后台 Dashboard 数据汇总 API
 * 使用 service role key，完全绕过 RLS
 * GET /api/admin/dashboard-stats
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // 如果没有配置环境变量，返回默认数据
    if (!supabaseUrl || !serviceRoleKey) {
      console.warn("[Dashboard] 环境变量未配置，返回默认数据");
      return NextResponse.json({ success: true, data: getDefaultData() });
    }

    // 使用原生 fetch 调 Supabase REST API（绕过 RLS）
    const headers = {
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      "Prefer": "count=exact",
    };

    // 并行查询所有数据
    const [
      customersRes,
      leadsRes,
      testResultsRes,
      testCodesRes,
      deliveriesRes,
      ordersRes,
      coursesRes,
      productsRes,
      inventoryRes,
    ] = await Promise.allSettled([
      fetch(`${supabaseUrl}/rest/v1/vip_customers?select=*&limit=0`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/leads?select=*&order=created_at.desc&limit=5`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/style_test_results?select=*&limit=0`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/test_codes?select=*`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/delivery_plans?select=*&order=created_at.desc&limit=5`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/orders?select=*`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/courses?select=*&limit=0`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/products?select=*&limit=0`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/inventory?select=*`, { headers }),
    ]);

    // 安全解析结果
    const safeParse = async (result: PromiseSettledResult<Response>, fallback: any[] = []) => {
      if (result.status === "fulfilled" && result.value.ok) {
        try {
          const data = await result.value.json();
          return Array.isArray(data) ? data : [];
        } catch {
          return fallback;
        }
      }
      return fallback;
    };

    const safeGetCount = (res: Response | null): number => {
      if (!res?.ok) return 0;
      const countHeader = res.headers.get("content-range");
      if (countHeader) {
        const match = countHeader.match(/\/(\d+)/);
        if (match) return parseInt(match[1]) || 0;
      }
      return 0;
    };

    // 解析数据
    let customerCount = 0;
    if (customersRes.status === "fulfilled") {
      customerCount = safeGetCount(customersRes.value);
    }

    const leadsData = await safeParse(leadsRes);
    let leadCount = 0;
    if (leadsRes.status === "fulfilled") {
      leadCount = safeGetCount(leadsRes.value);
    }
    const newLeadCount = leadsData.filter((l: any) => l.status === "new").length;

    let testResultCount = 0;
    if (testResultsRes.status === "fulfilled") {
      testResultCount = safeGetCount(testResultsRes.value);
    }

    const testCodesData = await safeParse(testCodesRes);
    const activeTestCodeCount = testCodesData.filter((t: any) => t.is_active).length;

    const deliveriesData = await safeParse(deliveriesRes);
    const draftDeliveryCount = deliveriesData.filter((d: any) => d.status === "draft").length;
    const deliveredCount = deliveriesData.filter((d: any) => d.status === "delivered" || d.status === "confirmed").length;

    const ordersData = await safeParse(ordersRes);
    const paidOrderCount = ordersData.filter((o: any) => o.status === "paid").length;
    const totalRevenue = ordersData
      .filter((o: any) => o.status === "paid")
      .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
    const pendingAmount = ordersData
      .filter((o: any) => o.status === "pending")
      .reduce((sum: number, o: any) => sum + (o.amount || 0), 0);

    let publishedCourseCount = 0;
    if (coursesRes.status === "fulfilled") {
      try {
        const courses = await coursesRes.value.json();
        if (Array.isArray(courses)) {
          publishedCourseCount = courses.filter((c: any) => c.is_published).length;
        }
      } catch {}
    }

    let publishedProductCount = 0;
    if (productsRes.status === "fulfilled") {
      try {
        const products = await productsRes.value.json();
        if (Array.isArray(products)) {
          publishedProductCount = products.filter((p: any) => p.is_published).length;
        }
      } catch {}
    }

    // 库存数据
    const inventoryData = await safeParse(inventoryRes);
    let inventoryTotalValue = 0;
    let inventorySellThroughRate = 0;
    let lowStockCount = 0;
    const categoryDistribution: { name: string; value: number }[] = [];
    const stockStatusDistribution = [
      { name: "正常库存", count: 0 },
      { name: "低库存", count: 0 },
      { name: "断货", count: 0 },
      { name: "滞销", count: 0 },
    ];

    if (inventoryData.length > 0) {
      inventoryTotalValue = inventoryData.reduce(
        (sum: number, item: any) => sum + (item.current_stock || 0) * (item.unit_cost || 0),
        0
      );
      const totalSalesQty = inventoryData.reduce((sum: number, item: any) => sum + (item.sales_qty || 0), 0);
      const totalStockInQty = inventoryData.reduce((sum: number, item: any) => sum + (item.stock_in_qty || 0), 0);
      inventorySellThroughRate = totalStockInQty > 0 ? (totalSalesQty / totalStockInQty) * 100 : 0;
      lowStockCount = inventoryData.filter((item: any) => (item.current_stock || 0) < 5).length;

      const normalStock = inventoryData.filter((item: any) => (item.current_stock || 0) >= 20).length;
      const lowStk = inventoryData.filter((item: any) => (item.current_stock || 0) >= 5 && (item.current_stock || 0) < 20).length;
      const outOfStock = inventoryData.filter((item: any) => (item.current_stock || 0) === 0).length;
      const slowMoving = inventoryData.filter(
        (item: any) => (item.sales_qty || 0) === 0 && (item.current_stock || 0) > 0
      ).length;

      stockStatusDistribution[0].count = normalStock;
      stockStatusDistribution[1].count = lowStk;
      stockStatusDistribution[2].count = outOfStock;
      stockStatusDistribution[3].count = slowMoving;
    }

    return NextResponse.json({
      success: true,
      data: {
        customerCount,
        leadCount,
        newLeadCount,
        testResultCount,
        testCodeCount: testCodesData.length,
        activeTestCodeCount,
        deliveryCount: deliveriesData.length,
        draftDeliveryCount,
        deliveredCount,
        orderCount: ordersData.length,
        paidOrderCount,
        totalRevenue,
        pendingAmount,
        courseCount: 0,
        publishedCourseCount,
        productCount: 0,
        publishedProductCount,
        recentLeads: leadsData.slice(0, 5),
        recentDeliveries: deliveriesData.slice(0, 5),
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
    // 即使出错也不崩溃，返回默认数据
    return NextResponse.json({
      success: true,
      data: getDefaultData(),
    });
  }
}

// 默认数据
function getDefaultData() {
  return {
    customerCount: 0,
    leadCount: 0,
    newLeadCount: 0,
    testResultCount: 0,
    testCodeCount: 0,
    activeTestCodeCount: 0,
    deliveryCount: 0,
    draftDeliveryCount: 0,
    deliveredCount: 0,
    orderCount: 0,
    paidOrderCount: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    courseCount: 0,
    publishedCourseCount: 0,
    productCount: 0,
    publishedProductCount: 0,
    recentLeads: [],
    recentDeliveries: [],
    inventoryTotalValue: 0,
    inventorySellThroughRate: 0,
    lowStockCount: 0,
    categoryDistribution: [],
    stockStatusDistribution: [
      { name: "正常库存", count: 0 },
      { name: "低库存", count: 0 },
      { name: "断货", count: 0 },
      { name: "滞销", count: 0 },
    ],
    spaCycleData: { planning: 0, purchasing: 0, receiving: 0, sales: 0, replenishment: 0 },
  };
}

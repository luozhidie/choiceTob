import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { COLOR_SEASONS_PRO } from "@/lib/styles";

/* ============ 辅助函数：查询店铺VIP画像+购买数据 ============ */
async function fetchStoreInsights(storeId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("stores").select("*").eq("id", storeId).single();

  const storeData = (data as any)?.business_data || {};
  let memberStats: Record<string, any> = (data as any)?.member_stats || {};
  const businessGoals: Record<string, any> = (data as any)?.business_goals || {};

  try {
    const { data: vipList } = await supabase
      .from("vip_customers")
      .select("id, full_name, color_season, style_result, total_spent, purchase_count, last_purchase_date, vip_level, created_at")
      .eq("store_id", storeId)
      .order("total_spent", { ascending: false })
      .limit(100);

    const { data: styleTests } = await supabase
      .from("style_test_results")
      .select("style_result, color_season, created_at")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(200);

    let colorAnalysis: any[] | null = null;
    try {
      const caRes = await supabase
        .from("color_analyses")
        .select("season_type, sub_type, created_at")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (!caRes.error) colorAnalysis = caRes.data;
    } catch (e) { /* color_analyses 表可能不存在 */ }

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

    let inventoryData: any[] | null = null;
    try {
      const invRes = await supabase
        .from("inventory")
        .select("category, current_stock, unit_cost, sales_qty")
        .eq("store_id", storeId)
        .limit(200);
      if (!invRes.error) inventoryData = invRes.data;
    } catch (e) { /* inventory 查询容错 */ }

    if (vipList && vipList.length > 0) {
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

      const styleTestStats: Record<string, number> = {};
      if (styleTests) {
        for (const test of styleTests) {
          if (test.style_result) styleTestStats[test.style_result] = (styleTestStats[test.style_result] || 0) + 1;
        }
      }

      const colorAnalysisStats: Record<string, number> = {};
      if (colorAnalysis) {
        for (const ca of colorAnalysis) {
          if (ca.season_type) {
            const label = ca.sub_type ? `${ca.season_type}${ca.sub_type}` : ca.season_type;
            colorAnalysisStats[label] = (colorAnalysisStats[label] || 0) + 1;
          }
        }
      }

      const categorySales: Record<string, { qty: number; revenue: number }> = {};
      if (inventoryData) {
        for (const inv of inventoryData) {
          const cat = inv.category || "其他";
          if (!categorySales[cat]) categorySales[cat] = { qty: 0, revenue: 0 };
          categorySales[cat].qty += (inv.sales_qty || 0);
          categorySales[cat].revenue += (inv.sales_qty || 0) * (inv.unit_cost || 0);
        }
      }

      memberStats = {
        tested_vip_count: vipList.filter((v: any) => v.color_season || v.style_result).length,
        total_vip_count: vipList.length,
        color_season_distribution: Object.fromEntries(
          Object.entries(colorSeasonMap).map(([k, v]) => [k, {
            percentage: Math.round(v.count / vipList.length * 100),
            count: v.count,
            avgSpent: Math.round(v.totalSpent / v.count),
            avgPurchases: Math.round(v.purchaseCount / v.count * 10) / 10,
          }])
        ),
        style_distribution: Object.fromEntries(
          Object.entries(styleMap).map(([k, v]) => [k, {
            percentage: Math.round(v.count / vipList.length * 100),
            count: v.count,
            avgSpent: Math.round(v.totalSpent / v.count),
            avgPurchases: Math.round(v.purchaseCount / v.count * 10) / 10,
          }])
        ),
        vip_level_distribution: vipLevelMap,
        spending_bands: spendingBands,
        total_revenue: totalRevenue,
        total_purchases: totalPurchases,
        avg_vip_spent: Math.round(totalRevenue / vipList.length),
        avg_vip_purchases: Math.round(totalPurchases / vipList.length * 10) / 10,
        style_test_stats: styleTestStats,
        color_analysis_stats: colorAnalysisStats,
        category_sales: Object.fromEntries(
          Object.entries(categorySales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10)
        ),
        recent_sales_trend: (salesData || []).slice(0, 4).map((s: any) => ({
          week: s.week_ending || s.week_start,
          revenue: s.total_revenue,
          orders: s.order_count,
        })),
      };
    }
  } catch (e: any) {
    console.error("[generate-planning] VIP数据查询失败:", e.message);
  }

  return { storeData, memberStats, businessGoals };
}

/* ============ 辅助函数：构建VIP数据prompt段 ============ */
function buildVipPromptSection(memberStats: Record<string, any>): string {
  if (!memberStats || !memberStats.total_vip_count) return "";

  const COLOR_LABELS: Record<string, string> = Object.fromEntries(
    [...COLOR_SEASONS_PRO].map(c => [c.value, `${c.label.replace(/型$/, '')}${c.group}`])
  );

  const colorDist = memberStats.color_season_distribution || {};
  const styleDist = memberStats.style_distribution || {};

  // 找消费力最强的色彩季型
  const topColorBySpend = Object.entries(colorDist).sort((a: any[], b: any[]) => (b[1] as any).avgSpent - (a[1] as any).avgSpent)[0];
  const topStyleBySpend = Object.entries(styleDist).sort((a: any[], b: any[]) => (b[1] as any).avgSpent - (a[1] as any).avgSpent)[0];

  const colorLines = Object.entries(colorDist)
    .sort((a: any[], b: any[]) => (b[1] as any).percentage - (a[1] as any).percentage)
    .map(([key, val]: [string, any]) =>
      `- ${COLOR_LABELS[key] || key}：${val.percentage}%（${val.count}人），人均消费¥${val.avgSpent}，人均购买${val.avgPurchases}次`
    ).join("\n");

  const styleLines = Object.entries(styleDist)
    .sort((a: any[], b: any[]) => (b[1] as any).percentage - (a[1] as any).percentage)
    .map(([key, val]: [string, any]) =>
      `- ${key}：${val.percentage}%（${val.count}人），人均消费¥${val.avgSpent}，人均购买${val.avgPurchases}次`
    ).join("\n");

  const categoryLines = Object.entries(memberStats.category_sales || {})
    .map(([cat, data]: [string, any]) => `- ${cat}：销售${data.qty}件，营收¥${data.revenue}`)
    .join("\n");

  const styleTestLines = Object.entries(memberStats.style_test_stats || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([style, count]) => `- ${style}：${count}人`)
    .join("\n");

  const colorAnalysisLines = Object.entries(memberStats.color_analysis_stats || {})
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([season, count]) => `- ${season}：${count}人`)
    .join("\n");

  let section = `
【核心VIP画像数据】（总VIP ${memberStats.total_vip_count}人，已测色彩/风格 ${memberStats.tested_vip_count}人）

一、色彩季型分布（决定色系企划方向）：
${colorLines}
关键洞察：${topColorBySpend ? `消费力最强的季型是${COLOR_LABELS[topColorBySpend[0]] || topColorBySpend[0]}（人均¥${(topColorBySpend[1] as any).avgSpent}），企划应重点匹配该季型配色` : ''}

二、风格分布（决定风格企划方向）：
${styleLines}
关键洞察：${topStyleBySpend ? `消费力最强的风格是${topStyleBySpend[0]}（人均¥${(topStyleBySpend[1] as any).avgSpent}），stylePlan中该风格占比应最高` : ''}

三、VIP购买行为分析：
- VIP人均消费：¥${memberStats.avg_vip_spent || 0}
- VIP人均购买次数：${memberStats.avg_vip_purchases || 0}次
- 购买行为分布：${JSON.stringify(memberStats.spending_bands || {})}
${memberStats.spending_bands?.["高频高额"] > 0 ? `- 高频高额客户${memberStats.spending_bands["高频高额"]}人，是利润款/形象款的核心购买力` : ""}

四、品类销售排名（决定品类企划方向）：
${categoryLines}`;

  if (styleTestLines) {
    section += `\n\n五、风格测试结论汇总：\n${styleTestLines}`;
  }
  if (colorAnalysisLines) {
    section += `\n\n六、色彩分析结论汇总：\n${colorAnalysisLines}`;
  }

  section += `

⚠ 企划必须与VIP数据强对齐：
1. 色彩占比严格按色彩季型分布配比 — 占比最高的季型对应最多SKU
2. 风格占比严格按风格分布配比 — 消费力最强的风格占最大比例
3. 价格带参考VIP人均消费能力 — 主销款价格应匹配VIP人均消费区间
4. 品类SKU数量参考品类销售排名 — 畅销品类多配SKU，滞销品类少配`;

  return section;
}

/* ============ 辅助函数：构建市场数据prompt段 ============ */
function buildMarketPromptSection(marketResearch: Record<string, any>): string {
  if (!marketResearch || !marketResearch.totalItems) return "";

  const topColors = (marketResearch.topColors || []).slice(0, 6).map((c: any) => `${c.color}(${c.count}次)`).join("、");
  const topStyles = (marketResearch.topStyles || []).slice(0, 5).map((s: any) => `${s.style}(${s.count}次)`).join("、");
  const topCategories = (marketResearch.topCategories || []).slice(0, 5).map((c: any) => `${c.category}(${c.count}次)`).join("、");

  let section = `
【📊 互联网真实市场数据】（采集时间：${marketResearch.crawledAt}，共${marketResearch.totalItems}条数据）

- 市场均价：¥${marketResearch.priceAnalysis?.avg || "未知"}
- 价格区间：¥${marketResearch.priceAnalysis?.min || "?"} - ¥${marketResearch.priceAnalysis?.max || "?"}
- 价格分布：${JSON.stringify(marketResearch.priceAnalysis?.distribution || {})}
- 市场热门颜色排行：${topColors}
- 市场热门风格排行：${topStyles}
- 市场热门品类排行：${topCategories}
- 数据来源分布：${JSON.stringify(marketResearch.sourceDistribution || {})}`;

  if (marketResearch.marketInsight) {
    section += `\n\n【市场洞察】\n${marketResearch.marketInsight}`;
  }

  section += `

⚠ 重要：以上为真实互联网数据，企划方案必须与市场数据对齐：
1. colorPlan 中的颜色选择应参考市场热门颜色
2. stylePlan 中的风格定位应参考市场热门风格
3. pricePlan 中的价格带应参考市场均价和分布
4. 如果店铺数据与市场数据有差异，以市场数据为主，店铺数据为辅`;

  return section;
}

/* ============ 辅助函数：采集市场数据 ============ */
async function fetchMarketResearch(req: NextRequest, keyword: string, season: string, style: string, priceBand: string) {
  try {
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto")?.split(",")[0] || "http";
    const researchResp = await fetch(`${protocol}://${host}/api/planning/market-research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword, season, style, priceBand }),
      signal: AbortSignal.timeout(20000),
    });
    if (researchResp.ok) {
      const data = await researchResp.json();
      console.log("[generate-planning] 市场数据采集完成:", data?.totalItems, "条");
      return data;
    }
  } catch (e: any) {
    console.error("[generate-planning] 市场数据采集失败（不影响主流程）:", e.message);
  }
  return null;
}

/* ============ 辅助函数：聚合自家测款真实转化数据 ============ */
async function fetchProductTestInsights() {
  try {
    const supabase = createServiceRoleClient();

    // 1. 拉取全部测款商品（product_test_items 已关闭 RLS）
    const { data: items, error } = await supabase
      .from("product_test_items")
      .select("product_id, views, clicks, cart_adds, inquiries, orders, is_winner");
    if (error || !items || items.length === 0) return null;

    // 2. 拉取关联商品属性（色/风/批发价）—— product_test_items 无 FK，手动 join
    const productIds = [...new Set((items as any[]).map((i) => i.product_id).filter(Boolean))];
    const productMap: Record<string, any> = {};
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from("products")
        .select("id, color_season, style_type, wholesale_price")
        .in("id", productIds);
      if (prods) for (const p of prods) productMap[String(p.id)] = p;
    }

    // 3. 聚合：按色彩季型 / 风格 / 价格带 统计漏斗
    const colorMap: Record<string, any> = {};
    const styleMap: Record<string, any> = {};
    const priceMap: Record<string, any> = {};
    let totalViews = 0, totalClicks = 0, totalCart = 0, totalInq = 0, totalOrders = 0;
    const winners: any[] = [];

    const priceBand = (p: number | null) => {
      if (p == null) return "未知";
      if (p < 100) return "100元以下";
      if (p < 200) return "100-200元";
      if (p < 400) return "200-400元";
      if (p < 800) return "400-800元";
      return "800元以上";
    };
    const acc = (m: Record<string, any>, key: string) => {
      if (!m[key]) m[key] = { views: 0, clicks: 0, cart_adds: 0, inquiries: 0, orders: 0, count: 0 };
      return m[key];
    };

    for (const it of items as any[]) {
      const p = productMap[String(it.product_id)] || {};
      const color = p.color_season || "未标注";
      const style = p.style_type || "未标注";
      const band = priceBand(p.wholesale_price != null ? Number(p.wholesale_price) : null);

      totalViews += it.views || 0;
      totalClicks += it.clicks || 0;
      totalCart += it.cart_adds || 0;
      totalInq += it.inquiries || 0;
      totalOrders += it.orders || 0;

      const c = acc(colorMap, color);
      c.views += it.views || 0; c.clicks += it.clicks || 0; c.cart_adds += it.cart_adds || 0;
      c.inquiries += it.inquiries || 0; c.orders += it.orders || 0; c.count++;

      const s = acc(styleMap, style);
      s.views += it.views || 0; s.clicks += it.clicks || 0; s.cart_adds += it.cart_adds || 0;
      s.inquiries += it.inquiries || 0; s.orders += it.orders || 0; s.count++;

      const b = acc(priceMap, band);
      b.views += it.views || 0; b.clicks += it.clicks || 0; b.cart_adds += it.cart_adds || 0;
      b.inquiries += it.inquiries || 0; b.orders += it.orders || 0; b.count++;

      if (it.is_winner || (it.orders || 0) > 0) {
        winners.push({ color, style, band, views: it.views || 0, orders: it.orders || 0, is_winner: !!it.is_winner });
      }
    }

    const withRate = (m: Record<string, any>) =>
      Object.entries(m).map(([k, v]: [string, any]) => ({
        key: k, ...v,
        orderRate: v.views > 0 ? Math.round((v.orders / v.views) * 1000) / 10 : 0,
        clickRate: v.views > 0 ? Math.round((v.clicks / v.views) * 1000) / 10 : 0,
        cartRate: v.clicks > 0 ? Math.round((v.cart_adds / v.clicks) * 1000) / 10 : 0,
      }));

    const colorStats = withRate(colorMap).sort((a: any, b: any) => b.orderRate - a.orderRate);
    const styleStats = withRate(styleMap).sort((a: any, b: any) => b.orderRate - a.orderRate);
    const priceStats = withRate(priceMap).sort((a: any, b: any) => b.orderRate - a.orderRate);
    const topWinners = winners.sort((a: any, b: any) => b.orders - a.orders).slice(0, 8);

    return { totalItems: (items as any[]).length, totalViews, totalClicks, totalCart, totalInq, totalOrders, colorStats, styleStats, priceStats, topWinners };
  } catch (e: any) {
    console.error("[generate-planning] 测款数据聚合失败:", e.message);
    return null;
  }
}

/* ============ 辅助函数：构建测款数据 prompt 段 ============ */
function buildTestPromptSection(test: Record<string, any>): string {
  if (!test || !test.totalItems) return "";

  const colorLines = (test.colorStats as any[])
    .map((c) => `- ${c.key}：曝光${c.views}/点击${c.clicks}/加购${c.cart_adds}/询盘${c.inquiries}/下单${c.orders}，下单转化率${c.orderRate}%（${c.count}个测款商品）`)
    .join("\n");
  const styleLines = (test.styleStats as any[])
    .map((s) => `- ${s.key}：曝光${s.views}/点击${s.clicks}/加购${s.cart_adds}/下单${s.orders}，下单转化率${s.orderRate}%`)
    .join("\n");
  const priceLines = (test.priceStats as any[])
    .map((p) => `- ${p.key}：曝光${p.views}/下单${p.orders}，下单转化率${p.orderRate}%`)
    .join("\n");
  const winnerLines = (test.topWinners as any[])
    .map((w) => `- [${w.is_winner ? "胜出" : "有单"}] ${w.color}/${w.style}/${w.band}：曝光${w.views}/下单${w.orders}`)
    .join("\n");

  const topColor = (test.colorStats as any[])[0];
  const topStyle = (test.styleStats as any[])[0];
  const topPrice = ((test.priceStats as any[]).find((p: any) => p.key !== "未知") || (test.priceStats as any[])[0]);

  return `
【📊 自家测款真实转化数据】（共${test.totalItems}个测款商品，总曝光${test.totalViews}/总点击${test.totalClicks}/总下单${test.totalOrders}）

一、色彩转化表现（按下单转化率排序）：
${colorLines}
关键洞察：${topColor ? `转化最好的色彩季型是「${topColor.key}」（下单转化率${topColor.orderRate}%），colorPlan 中该季型应给最高 SKU 占比` : ""}

二、风格转化表现（按下单转化率排序）：
${styleLines}
关键洞察：${topStyle ? `转化最好的风格是「${topStyle.key}」（下单转化率${topStyle.orderRate}%），stylePlan 中该风格应占最大比例` : ""}

三、价格带转化表现（按下单转化率排序）：
${priceLines}
关键洞察：${topPrice ? `转化最好的价格带是「${topPrice.key}」（下单转化率${topPrice.orderRate}%），pricePlan 主推价格带应对齐该区间` : ""}

四、测款爆款 / 有单商品：
${winnerLines}

⚠ 自家测款优先原则（最高优先级，优于市场与经验猜测）：
1. colorPlan 中转化最好的色彩季型给最高 SKU 占比
2. stylePlan 中转化最好的风格给最大比例
3. pricePlan 主推价格带对齐测款转化最高的价格带
4. coreSkuList 优先纳入在测款中色彩/风格/价格组合表现好的款
5. avoidList 应包含测款中曝光高但转化极低（如下单转化率<1%）的色彩/风格`;
}

/* ============ 辅助函数：读取已采集的品牌秀场趋势 ============ */
async function fetchRunwayInsights(season: string) {
  if (!season) return null;
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("brand_runway_trends")
      .select("brand, dominant_colors, dominant_styles, key_silhouettes, themes, summary")
      .eq("season", season);
    if (error || !data || data.length === 0) return null;

    const allColors: Record<string, number> = {};
    const allStyles: Record<string, number> = {};
    const allSil: Record<string, number> = {};
    (data as any[]).forEach((b) => {
      (b.dominant_colors || []).forEach((c: string) => (allColors[c] = (allColors[c] || 0) + 1));
      (b.dominant_styles || []).forEach((s: string) => (allStyles[s] = (allStyles[s] || 0) + 1));
      (b.key_silhouettes || []).forEach((s: string) => (allSil[s] = (allSil[s] || 0) + 1));
    });

    return {
      season,
      totalBrands: (data as any[]).length,
      brands: (data as any[]).map((b) => ({
        brand: b.brand,
        colors: b.dominant_colors || [],
        styles: b.dominant_styles || [],
        silhouettes: b.key_silhouettes || [],
        themes: b.themes || [],
        summary: b.summary || "",
      })),
      overall: {
        topColors: Object.entries(allColors).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
        topStyles: Object.entries(allStyles).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
        topSilhouettes: Object.entries(allSil).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k),
      },
    };
  } catch (e: any) {
    console.error("[generate-planning] 秀场趋势读取失败:", e.message);
    return null;
  }
}

/* ============ 辅助函数：构建秀场趋势 prompt 段 ============ */
function buildRunwayPromptSection(runway: Record<string, any>): string {
  if (!runway || !runway.totalBrands) return "";

  const brandLines = (runway.brands as any[])
    .map((b) => `- ${b.brand}：${b.summary || ""}${b.colors.length ? ` 主色[${b.colors.join("、")}]` : ""}${b.styles.length ? ` 风格[${b.styles.join("、")}]` : ""}${b.silhouettes.length ? ` 廓形[${b.silhouettes.join("、")}]` : ""}`)
    .join("\n");

  const o = runway.overall || {};
  return `
【👑 一线品牌发布会趋势】(${runway.totalBrands}个品牌 · ${runway.season || ""})
品牌信号：
${brandLines}
整体秀场信号：
- 高频主色：${(o.topColors || []).join("、") || "—"}
- 主导风格：${(o.topStyles || []).join("、") || "—"}
- 关键廓形：${(o.topSilhouettes || []).join("、") || "—"}

⚠ 秀场趋势融合原则：
1. colorPlan 适当融入秀场高频主色，提升货盘时尚度与话题性
2. stylePlan 关注秀场主导风格信号（如静奢/新中式/运动），但须与本品牌客群（VIP/测款数据）平衡
3. 秀场趋势作为"流行方向参考"，不与测款真实转化、VIP画像冲突——冲突时以真实数据为准`;
}

/* ============ 主接口 ============ */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 检查管理员是否已登录（cookie方式，与后台统一）
    const cookieHeader = req.headers.get("cookie") || "";
    const isAdmin = cookieHeader.includes("admin_logged_in=true");
    if (!isAdmin) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    const body = await req.json();
    const { brandName, season, colorPref, colorLabel, marketStyle, styleLabel, priceBand, targetAge, shopSize, notes, storeId } = body;

    // 1. 获取店铺数据+VIP画像+经营目标
    let storeData: Record<string, any> | null = null;
    let memberStats: Record<string, any> | null = null;
    let businessGoals: Record<string, any> | null = null;
    if (storeId) {
      const insights = await fetchStoreInsights(storeId);
      storeData = insights.storeData;
      memberStats = insights.memberStats;
      businessGoals = insights.businessGoals;
    }

    // 2. 采集市场数据
    const researchKeyword = [brandName, season, styleLabel].filter(Boolean).join(" ") || "女装 2025";
    const marketResearch = await fetchMarketResearch(req, researchKeyword, season || "", styleLabel || "", priceBand || "");

    // 3. 检查API Key
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!deepseekKey && !openaiKey) {
      return NextResponse.json({ source: "mock", report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand) });
    }

    // 4. 构建system prompt
    const systemPrompt = `你是一位资深的时尚商品企划顾问，擅长为服装零售品牌制定季节性商品企划方案。你的核心能力是基于真实市场数据和店铺核心VIP画像，生成差异化的商品企划方案。

你必须严格按照以下 JSON 格式输出。输出时不要有任何额外文字、markdown代码块标记或解释，直接在 |JSON_START| 和 |JSON_END| 标记之间输出纯 JSON：

|JSON_START|
{
  "brandName": "品牌名",
  "season": "季节",
  "summary": "企划概要（300字以内，包含市场机会、核心策略、预期效果）",
  "marketAnalysis": {
    "trend": "市场趋势分析（200字）",
    "competition": "竞争格局分析（200字）",
    "opportunity": "市场机会点（3-5个要点）"
  },
  "vipPortrait": {
    "corePortrait": "核心VIP画像描述（200字）",
    "consumptionPower": "消费力分析（100字）",
    "priceSensitivity": "价格敏感度评估（100字）",
    "loyaltyLevel": "忠诚度分析（100字）"
  },
  "colorPlan": [
    {"type": "基础色/主题色/点缀色/流行色", "ratio": "占比", "colors": ["色1", "色2"], "reason": "选色理由"}
  ],
  "stylePlan": [
    {"mainStyle": "主风格名", "subStyle": "偏风格名", "styleCombo": "组合名", "gender": "女士/男士", "occasions": ["场合1"], "vibe": ["氛围1"], "trafficRatio": "占比", "profitRatio": "占比", "targetAge": "目标年龄"}
  ],
  "productStructure": [
    {"type": "引流款/利润款/形象款/搭配款", "ratio": "占比", "desc": "简述", "keyItems": ["关键单品1"]}
  ],
  "pricePlan": [
    {"band": "价格带名", "range": "价格范围", "ratio": "占比", "strategy": "策略说明", "marginTarget": "目标毛利%"}
  ],
  "waveCalendar": [
    {"week": 1, "theme": "波段主题", "keyActions": ["动作1"], "buyPlan": "采购计划", "displayFocus": "陈列重点"}
  ],
  "displayAdvice": {
    "floorPlan": "卖场规划建议（200字）",
    "keyAreas": [{"area": "区域名", "focus": "重点", "colorMatch": "色彩搭配"}],
    "windowDisplay": "橱窗陈列建议（200字）",
    "topsTips": ["搭配技巧1", "搭配技巧2"]
  },
  "kpiTargets": {
    "salesTarget": "销售额目标",
    "marginTarget": "毛利率目标%",
    "sellThroughTarget": "售罄率目标%",
    "inventoryTurnTarget": "库存周转天数目标",
    "trafficGoal": "客流目标人次",
    "conversionGoal": "成交率目标%"
  },
  "riskWarnings": [
    {"risk": "风险描述", "level": "高/中/低", "mitigation": "应对方案"}
  ],
  "quartersPlan": [
    {"phase": "波段名", "items": ["事项1", "事项2"]}
  ],
  "imageKeywords": {
    "colorImages": ["关键词1", "关键词2"],
    "styleImages": ["关键词1", "关键词2"],
    "waveImages": [{"wave": 1, "keywords": ["关键词1"]}]
  },
  "assortmentAdvice": {
    "summary": "货盘配比概要（100字）",
    "categoryDepth": [
      {"category": "品类名", "skuCount": 5, "colorDepth": 3, "sizeDepth": 3, "reason": "原因"}
    ],
    "coreSkuList": [
      {"name": "核心款名称", "category": "品类", "colors": ["色1","色2"], "priceRange": "价格", "expectedSellThrough": "预期动销率%", "reason": "为什么是核心款"}
    ],
    "avoidList": [
      {"category": "品类", "reason": "为什么不建议铺货"}
    ],
    "stockStrategy": "库存策略建议（如：首单60%+追单40%，小批量多批次）"
  }
}
|JSON_END|`;

    // 5. 构建用户提示词
    let userPrompt = `请为以下品牌生成${season}商品企划初稿：

【品牌基本信息】
- 品牌名：${brandName || "未指定"}
- 季节：${season}
- 色系偏好：${colorLabel || "未指定"}
- 风格定位：${styleLabel || "未指定"}
- 主力价格带：${priceBand || "199-399元"}
- 目标客群年龄段：${targetAge || "25-40岁"}
- 店铺面积：${shopSize || "未指定"}
- 补充说明：${notes || "无"}`;

    if (storeData && Object.keys(storeData).length > 0) {
      userPrompt += `\n\n【店铺经营数据】
- 月租金：${storeData.monthly_rent ? `¥${storeData.monthly_rent}` : "未填写"}
- 保本点：${storeData.break_even_point ? `¥${storeData.break_even_point}/月` : "未填写"}
- 毛利率：${storeData.gross_margin_rate ? `${(storeData.gross_margin_rate * 100).toFixed(0)}%` : "未填写"}
- 净利率：${storeData.net_margin_rate ? `${(storeData.net_margin_rate * 100).toFixed(0)}%` : "未填写"}
- 月进店数：${storeData.foot_traffic || "未填写"}
- 成交率：${storeData.conversion_rate ? `${(storeData.conversion_rate * 100).toFixed(0)}%` : "未填写"}
- 连带率：${storeData.attach_rate || "未填写"}
- 均件单价：${storeData.avg_item_price ? `¥${storeData.avg_item_price}` : "未填写"}
- 月营业额：${storeData.monthly_revenue ? `¥${storeData.monthly_revenue}` : "未填写"}`;
    }

    // 注入经营目标约束
    if (businessGoals && Object.keys(businessGoals).length > 0) {
      userPrompt += `

【经营目标与约束】（企划必须服务于这些目标，不得偏离）
- 年度采购预算：¥${businessGoals.annual_budget || "未设定"}
- 季度采购预算：¥${businessGoals.quarterly_budget || "未设定"}
- 年度业绩目标：¥${businessGoals.annual_revenue_target || "未设定"}
- 季度业绩目标：¥${businessGoals.quarterly_revenue_target || "未设定"}
- 毛利率目标：${businessGoals.gross_margin_target ? (businessGoals.gross_margin_target * 100).toFixed(0) + "%" : "未设定"}
- 净利率目标：${businessGoals.net_margin_target ? (businessGoals.net_margin_target * 100).toFixed(0) + "%" : "未设定"}
- 售罄率目标：${businessGoals.sell_through_target ? (businessGoals.sell_through_target * 100).toFixed(0) + "%" : "未设定"}
- 库存周转天数目标：${businessGoals.inventory_turnover_days || "未设定"}天
- 连带率目标：${businessGoals.attachment_rate_target || "未设定"}

⚠ 目标约束（必须遵守）：
1. assortmentAdvice中SKU总数和采购金额不得超过季度采购预算
2. pricePlan中利润款占比必须能支撑毛利率目标
3. coreSkuList的预期售罄率必须达到售罄率目标
4. avoidList要包含与营利目标冲突的品类（如低毛利且高库存积压的品类）
5. stockStrategy要体现库存周转天数目标 — 首单比例根据周转目标调整`;
    }

    // 注入VIP画像数据
    const vipSection = buildVipPromptSection(memberStats || {});
    if (vipSection) userPrompt += "\n" + vipSection;

    // 注入市场数据
    const marketSection = buildMarketPromptSection(marketResearch || {});
    if (marketSection) userPrompt += "\n" + marketSection;

    // 注入自家测款真实转化数据（最高优先级）
    const testInsights = await fetchProductTestInsights();
    const testSection = buildTestPromptSection(testInsights || {});
    if (testSection) userPrompt += "\n" + testSection;

    // 注入一线品牌发布会趋势（已采集则参考，未采集则跳过）
    const runwayInsights = await fetchRunwayInsights(season || "");
    const runwaySection = buildRunwayPromptSection(runwayInsights || {});
    if (runwaySection) userPrompt += "\n" + runwaySection;

    // 企划要求
    const hasVip = memberStats?.tested_vip_count > 0;
    const hasMarket = marketResearch?.totalItems > 0;
    const hasTest = !!(testInsights && testInsights.totalItems);
    const hasRunway = !!(runwayInsights && runwayInsights.totalBrands);

    userPrompt += `

【企划要求】
1. marketAnalysis：市场趋势、竞争格局、机会点，每部分200字，机会点列3-5个具体要点
2. v_ipPortrait：基于VIP数据（如有）分析核心客群画像、消费力、价格敏感度、忠诚度
3. colorPlan 至少4组，比例加起来=100%，每组注明选色理由。${hasTest ? "色彩选择与占比必须以自家测款转化数据为准（最高优先级）" : hasVip ? "色彩占比必须与VIP色彩季型分布严格对齐" : hasMarket ? "色彩选择必须参考市场热门颜色数据" : ""}
4. stylePlan 列出4-6个主流风格组合，每个包含mainStyle/subStyle/styleCombo/gender/occasions/vibe/trafficRatio/profitRatio/targetAge。${hasTest ? "风格占比必须以自家测款转化数据为准（最高优先级）" : hasVip ? "风格占比必须与VIP风格分布对齐" : hasMarket ? "参考市场热门风格数据" : ""}
5. productStructure 4类（引流款15%、利润款50%、形象款20%、搭配款15%），每类列2-3个关键单品
6. pricePlan 必须严格基于用户输入的「主力价格带」拆分为4档，比例加起来=100%，每档注明目标毛利%。${hasTest ? "主推价格带须对齐自家测款转化最高的价格带（最高优先级）。" : ""}${memberStats?.avg_vip_spent ? `参考VIP人均消费¥${memberStats.avg_vip_spent}。` : ""}${marketResearch?.priceAnalysis?.avg ? `参考市场均价¥${marketResearch.priceAnalysis.avg}。` : ""}绝对不能输出与用户价格带无关的默认价格。
7. waveCalendar：分4-6周，每周有波段主题、关键动作、采购计划、陈列重点
8. displayAdvice：卖场规划、重点区域（3-5个）、橱窗建议、搭配技巧（5-8条）
9. kpiTargets：销售额/毛利率/售罄率/库存周转/客流/成交率，所有指标必须具体可衡量
10. riskWarnings：列出3-5个风险点（库存/竞争/季节/供应链），每个标注高/中/低风险并给应对方案
11. quartersPlan 3个波段，每波4个事项
12. imageKeywords 必须基于实际风格组合生成
13. assortmentAdvice（货盘建议）是核心产出之一，必须包含：
   - categoryDepth：每个品类的SKU数量、颜色深度、尺码深度，基于VIP客群规模和库存现状决定
   - coreSkuList：列出8-12个核心款（占销量60%+的款），每款标注预期动销率和推荐理由
   - avoidList：明确不建议铺货的品类和原因（如：VIP中该风格占比<5%、市场动销率低、库存已有大量积压）
   - stockStrategy：首单/追单比例、补货触发条件
   原则：宁可少SKU多深度，不要多SKU浅深度。核心款做足颜色和尺码，非核心款只做1-2色。
${hasVip && hasMarket ? "14. 双数据源对齐原则（最重要）：色彩/风格以VIP数据为主（服务现有客户），市场数据为辅（发现增量机会）" : ""}
${hasTest ? "15. 自家测款数据最高优先级原则：所有色彩/风格/价格带决策以测款真实转化为准，VIP数据与市场数据仅作补充验证；coreSkuList 必须优先包含测款中转化靠前的色彩/风格/价格组合" : ""}
${hasRunway ? "16. 一线品牌发布会趋势融合：colorPlan/stylePlan 适当融入秀场高频主色与主导风格信号，作为流行方向参考；但与测款真实转化、VIP画像冲突时，以真实数据为准" : ""}

⚠ 报告质量要求（决定¥2980价值感）：
- 所有分析必须有数据支撑，不能空泛
- 所有建议必须可落地执行，不能只有方向
- 核心数据（价格/占比/数量）必须精确，不能模糊
- 风险预警必须具体且有应对方案
- 整份报告字数不低于3000字，专业度对标咨询公司交付标准`;

    // 6. 调用AI API
    const useDeepseek = !!deepseekKey;
    const apiKey = useDeepseek ? deepseekKey! : openaiKey!;
    const apiUrl = useDeepseek ? "https://api.deepseek.com/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
    const model = useDeepseek ? "deepseek-chat" : "gpt-4o-mini";

    const aiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.7, max_tokens: 8000 }),
    });

    if (!aiRes.ok) {
      console.error("[generate-planning] AI API error:", aiRes.status);
      return NextResponse.json({ source: "mock_fallback", report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand) });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let report;
    try {
      let jsonStr = "";
      const startIdx = content.indexOf("|JSON_START|");
      const endIdx = content.indexOf("|JSON_END|");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonStr = content.substring(startIdx + 12, endIdx).trim();
      } else {
        const firstBrace = content.indexOf("{");
        const lastBrace = content.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.substring(firstBrace, lastBrace + 1);
        }
      }
      if (!jsonStr) throw new Error("无法提取 JSON");
      report = JSON.parse(jsonStr);
    } catch (err: any) {
      console.error("[generate-planning] JSON parse failed:", content.slice(0, 300));
      return NextResponse.json({ source: "mock_fallback", report: generateMockReport(brandName, season, colorLabel, styleLabel, priceBand) });
    }

    return NextResponse.json({
      source: "ai",
      report,
      assortmentSummary: report.assortmentAdvice ? {
        coreSkuCount: report.assortmentAdvice.coreSkuList?.length || 0,
        avoidCount: report.assortmentAdvice.avoidList?.length || 0,
        totalSkuCount: report.assortmentAdvice.categoryDepth?.reduce((s: number, c: any) => s + (c.skuCount || 0), 0) || 0,
        stockStrategy: report.assortmentAdvice.stockStrategy || "",
      } : null,
    });
  } catch (err: any) {
    console.error("[generate-planning] API error:", err);
    return NextResponse.json({ error: err.message || "服务异常" }, { status: 500 });
  }
}

/* ============ 辅助函数 ============ */
function buildMockPricePlan(priceBand?: string) {
  const DEFAULT = [
    { band: "入门款", range: "99-199元", ratio: "20%", strategy: "低价引流" },
    { band: "主销款", range: "199-399元", ratio: "45%", strategy: "量价平衡" },
    { band: "品质款", range: "399-699元", ratio: "25%", strategy: "拉高客单价" },
    { band: "旗舰款", range: "699元+", ratio: "10%", strategy: "品牌标杆" },
  ];
  if (!priceBand) return DEFAULT;
  const nums = priceBand.match(/\d+/g);
  if (!nums || nums.length < 2) return DEFAULT;
  const min = parseInt(nums[0], 10);
  const max = parseInt(nums[1], 10);
  if (min >= max || min <= 0) return DEFAULT;
  const diff = max - min;
  const s = (n: number) => Math.round(n);
  return [
    { band: "入门款", range: `${s(min)}-${s(min + diff / 4)}元`, ratio: "20%", strategy: "低价引流" },
    { band: "主销款", range: `${s(min + diff / 4)}-${s(min + diff / 2)}元`, ratio: "45%", strategy: "量价平衡" },
    { band: "品质款", range: `${s(min + diff / 2)}-${s(min + diff * 0.75)}元`, ratio: "25%", strategy: "拉高客单价" },
    { band: "旗舰款", range: `${s(min + diff * 0.75)}-${max}元`, ratio: "10%", strategy: "品牌标杆" },
  ];
}

function generateMockReport(brandName: string, season: string, colorLabel: string, styleLabel: string, priceBand?: string) {
  const mainStyleName = styleLabel ? styleLabel.replace(/型$/, "").split("(")[0].trim() : "古典";
  return {
    brandName: brandName || "示例品牌",
    season,
    summary: `基于${colorLabel || "综合"}偏好和${styleLabel || "百搭"}定位的${season}企划报告。本企划通过精准的色彩配比和风格定位，实现商品结构优化，预计可提升售罄率15-20%，降低库存积压30%。`,
    marketAnalysis: {
      trend: `${season}女装市场呈现"静奢风"与"新中式"双轨并行趋势，消费者更看重面料质感和版型剪裁，低价跑量模式逐步失效。社交媒体KOL带动"老钱风"持续升温。`,
      competition: `主流竞争对手集中在¥200-400价格带，产品同质化严重。差异化机会在于：更精准的色彩配比+更专业的陈列指导+更高的性价比。`,
      opportunity: ["静奢风扩大市场份额", "新中式元素差异化定位", "VIP专属配色方案", "小批量快反供应链", "社媒内容营销引流"],
    },
    v_ipPortrait: {
      corePortrait: "核心VIP为30-45岁职场女性，年收入15-30万，注重品质感和职场适用性，对价格敏感度中等，更看重是否符合个人气质。",
      consumptionPower: "VIP人均年消费¥8,000-15,000，其中Top 20%客户贡献60%营收，是高毛利款的核心购买力。",
      priceSensitivity: "对¥199以下低价不敏感，对¥699以上高价需要强理由（面料/版型/稀缺性），主力成交价格带¥199-399。",
      loyaltyLevel: "复购率45%，主要维系因素是专属服务和精准推荐，流失原因是款式更新慢和尺码不全。",
    },
    colorPlan: [
      { type: "基础色", ratio: "40%", colors: ["黑", "白", "灰", "藏青"], reason: "适配职场场景，与其他色彩兼容性强" },
      { type: "主题色", ratio: "35%", colors: [(colorLabel || "中性") + "主调", "米白", "灰粉"], reason: "呼应季节主题，体现品牌调性" },
      { type: "点缀色", ratio: "15%", colors: ["珊瑚橘", "丁香紫"], reason: "小面积提亮，增加搭配趣味性" },
      { type: "流行色", ratio: "10%", colors: ["数字薰衣草", "薄荷绿"], reason: "跟随Pantone流行色，吸引年轻客群" },
    ],
    stylePlan: [
      { mainStyle: mainStyleName, subStyle: "浪漫", styleCombo: `${mainStyleName}偏浪漫`, gender: "女士", occasions: ["上班职场", "社交礼仪"], vibe: ["知性风", "职业风"], trafficRatio: "30%", profitRatio: "60%", targetAge: "30-40岁" },
      { mainStyle: "优雅", subStyle: "少女", styleCombo: "优雅偏少女", gender: "女士", occasions: ["逛街约会", "社交礼仪"], vibe: ["韩系清新", "知性风"], trafficRatio: "12%", profitRatio: "8%", targetAge: "25-35岁" },
      { mainStyle: "自然", subStyle: "少年", styleCombo: "自然偏少年", gender: "女士", occasions: ["出行旅游", "逛街约会"], vibe: ["休闲风", "运动休闲"], trafficRatio: "10%", profitRatio: "6%", targetAge: "25-40岁" },
    ],
    productStructure: [
      { type: "引流款", ratio: "15%", desc: "低毛利高流量，吸引进店", keyItems: ["基础T恤", "牛仔裤"] },
      { type: "利润款", ratio: "50%", desc: "核心利润来源，主推SKU", keyItems: ["西装外套", "连衣裙", "针织衫"] },
      { type: "形象款", ratio: "20%", desc: "品牌调性展示，拉高客单价", keyItems: ["大衣", "羽绒服", "礼服裙"] },
      { type: "搭配款", ratio: "15%", desc: "提升连带率，补全搭配", keyItems: ["围巾", "腰带", "配饰"] },
    ],
    pricePlan: buildMockPricePlan(priceBand),
    waveCalendar: [
      { week: 1, theme: "第一波：基础款上市", keyActions: ["上新基础T恤/衬衫", "橱窗第一版", "会员专享预览"], buyPlan: "首单40% + 补货预备", displayFocus: "入口展区放新品" },
      { week: 2, theme: "第二波：主题款上市", keyActions: ["上新连衣裙/针织", "社媒内容发布", "KOL合作"], buyPlan: "追单30%", displayFocus: "中岛展区主打搭配" },
      { week: 3, theme: "第三波：形象款上市", keyActions: ["上新大衣/外套", "VIP私享会", "搭配手册发布"], buyPlan: "形象款全色全码", displayFocus: "橱窗形象款主角" },
      { week: 4, theme: "第四波：补货+促销", keyActions: ["畅销款追单", "滞销款促销", "新品预售"], buyPlan: "补货+清仓并行", displayFocus: "促销区调整" },
    ],
    displayAdvice: {
      floorPlan: `卖场采用"回"字形动线，入口右侧设形象款展区（30%），中间位置设主推款展区（40%），左侧设促销/搭配区（20%），试衣间周边设配件区（10%）。`,
      keyAreas: [
        { area: "入口橱窗", focus: "形象款大衣+主题色背景", colorMatch: "主题色70%+点缀色30%" },
        { area: "中岛展区", focus: "主推连衣裙+针织衫搭配", colorMatch: "基础色50%+主题色50%" },
        { area: "试衣间周边", focus: "配件/配饰连带销售", colorMatch: "点缀色为主" },
      ],
      windowDisplay: `橱窗以"职场女性一天"为故事线，早间咖啡场景（基础色）+ 午间会议场景（形象款）+ 晚间约会场景（主题色），用灯光层次强化色彩情感。`,
      topsTips: ["同色系深浅搭配显高级", "基础色+点缀色打造视觉焦点", "形象款只做2色保持稀缺感", "主推款做3-4色覆盖多客群", "配件用点缀色提亮整体造型"],
    },
    kpiTargets: {
      salesTarget: "¥300,000/月",
      marginTarget: "65%",
      sellThroughTarget: "85%",
      inventoryTurnTarget: "60天",
      trafficGoal: "3000人次/月",
      conversionGoal: "25%",
    },
    riskWarnings: [
      { risk: "主推款售罄过快导致断码", level: "中", mitigation: "首单+追单模式，设置安全库存预警" },
      { risk: "流行色接受度低导致积压", level: "低", mitigation: "流行色仅做10%，且只做1-2个SKU测试" },
      { risk: "竞争对手同期大促分流", level: "高", mitigation: "提前2周布局内容营销，VIP专享提前购" },
    ],
    quartersPlan: [
      { phase: "第一波段", items: ["风格商品结构规划", "色彩企划矩阵", "价格带分布策略", "核心品类确定"] },
      { phase: "第二波段", items: ["爆款预测与选品", "门店陈列建议", "库存周转提示", "营销活动建议"] },
      { phase: "第三波段", items: ["销售跟踪", "补货追单参考", "滞销款处理", "下季企划预研"] },
    ],
    imageKeywords: {
      colorImages: [`${season} ${colorLabel || "中性"}配色 知性通勤穿搭`],
      styleImages: [`${mainStyleName}偏浪漫 ${season}大衣 职场通勤搭配`],
      waveImages: [{ wave: 1, keywords: [`${season}第一波新品 大衣上市 店铺陈列`] }],
    },
    assortmentAdvice: {
      summary: "核心SKU控制在80-100个，每个品类做2-3色×3-4码，首单60%+追单40%，重点关注连衣裙和针织衫的售罄率。",
      categoryDepth: [
        { category: "连衣裙", skuCount: 25, colorDepth: 3, sizeDepth: 4, reason: "核心品类，VIP复购最高" },
        { category: "针织衫", skuCount: 20, colorDepth: 3, sizeDepth: 3, reason: "跨季销售，库存风险低" },
        { category: "西装外套", skuCount: 15, colorDepth: 2, sizeDepth: 3, reason: "形象款，少色少码降低风险" },
      ],
      coreSkuList: [
        { name: "基础款V领针织衫", category: "针织衫", colors: ["黑", "白", "灰"], priceRange: "199-299元", expectedSellThrough: "90%", reason: "跨季百搭，VIP复购TOP1" },
        { name: "A字连衣裙", category: "连衣裙", colors: ["黑", "藏青", "酒红"], priceRange: "299-399元", expectedSellThrough: "85%", reason: "显瘦显高，职场约会双场景" },
      ],
      avoidList: [
        { category: "破洞牛仔裤", reason: "VIP年龄层不接受，市场动销率<5%" },
        { category: "超短裙", reason: "职场客群不适用，易滞销" },
      ],
      stockStrategy: "首单60%（安全库存覆盖2周）+ 追单40%（根据售罄率动态补货），补货触发条件：上市7天售罄率>30%即追单",
    },
  };
}

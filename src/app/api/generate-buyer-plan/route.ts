import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-buyer-plan
 * 买手选品企划 — 基于VIP画像+市场爆款+库存现状，生成精准采购方案
 * 核心目标：高售罄率、低库存积压、货盘与客群精准匹配
 */
export async function POST(req: NextRequest) {
  try {
    const {
      storeName,
      storeId,
      memberSummary,
      allColors,
      allStyles,
      budgetInfo,
      season,
    } = await req.json();

    if (!storeName) {
      return NextResponse.json({ error: "缺少storeName" }, { status: 400 });
    }

    const useDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const apiKey = useDeepSeek ? process.env.DEEPSEEK_API_KEY! : process.env.OPENAI_API_KEY!;
    if (!apiKey) {
      return NextResponse.json({ error: "未配置 AI API Key" }, { status: 500 });
    }

    const apiUrl = useDeepSeek ? "https://api.deepseek.com/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
    const model = useDeepSeek ? "deepseek-chat" : "gpt-4o";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 1. 获取店铺深度洞察（如果有storeId）
    let storeInsights: Record<string, any> = {};
    if (storeId) {
      try {
        const resp = await fetch(`${baseUrl}/api/store/insights?storeId=${storeId}&sections=vip,business,inventory,sales`, {
          signal: AbortSignal.timeout(12000),
        });
        if (resp.ok) storeInsights = await resp.json();
      } catch (e) {
        console.error("[buyer-plan] 店铺洞察获取失败:", e);
      }
    }

    // 1.5 获取经营目标
    let businessGoals: Record<string, any> = storeInsights.goals || {};

    // 2. 获取爆款数据
    let trendItems: any[] = [];
    const searchKeyword = season ? `${season} 女装 爆款` : "女装 爆款 2025";
    try {
      const resp = await fetch(`${baseUrl}/api/trend/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: searchKeyword, sources: ["general", "1688"] }),
        signal: AbortSignal.timeout(12000),
      });
      if (resp.ok) {
        const data = await resp.json();
        trendItems = (data.items || []).slice(0, 15);
      }
    } catch (e) {
      console.error("[buyer-plan] 爆款数据获取失败:", e);
    }

    // 构建会员数据摘要
    const colorTop = (allColors || []).slice(0, 3).map((c: any) => `${c.name}（${c.count}人，${c.pct}%）`).join("、");
    const styleTop = (allStyles || []).slice(0, 3).map((s: any) => `${s.name}（${s.count}人，${s.pct}%）`).join("、");
    const totalMembers = memberSummary?.total || storeInsights.vip?.total || 0;
    const vipDist = memberSummary?.vip || {};
    const avgSpending = memberSummary?.avgSpending || storeInsights.vip?.avgSpent || 500;
    const estimatedMonthlyRevenue = totalMembers * avgSpending * 0.3;
    const recommendedBudget = budgetInfo?.budget || Math.round(estimatedMonthlyRevenue * 2.5);

    // 库存信息摘要
    const invInfo = storeInsights.inventory || {};
    const invSummary = invInfo.totalSKUs > 0
      ? `SKU总数：${invInfo.totalSKUs}，库存总值：¥${invInfo.totalStockValue}，整体动销率：${invInfo.overallSellThrough}%，滞销款：${invInfo.overstockCount}个，缺货款：${invInfo.lowStockCount}个
品类库存/销售：${JSON.stringify(invInfo.categoryStats || {})}
颜色库存/销售：${JSON.stringify(invInfo.colorStats || {})}`
      : "暂无库存数据";

    // 爆款数据摘要
    const trendSummary = trendItems.length > 0
      ? trendItems.map((t, i) => `${i + 1}. ${t.name}（${t.platform}，热度${t.heat_score}，${t.price_range ? "¥" + t.price_range : ""}${t.sales_volume ? "，" + t.sales_volume : ""}）`).join("\n")
      : "暂无爆款数据";

    const systemPrompt = `你是一位顶尖的SPA买手专家，精通优衣库、ZARA等快时尚买手体系。
核心目标：高售罄率(>85%)、低库存周转(<30天)、货盘与客群精准匹配。

输出严格JSON，含：
- title: 标题
- summary: 策略总结（150字内）
- totalBudget: 建议采购预算（元）
- budgetAllocation: [{category, amount, percentage}]
- colorPlan: [{season(key), label, percentage, rationale}]
- stylePlan: [{style(key), label, percentage, rationale}]
- sizePlan: [{size, percentage, rationale}]
- categoryPlan: [{category, percentage, units, rationale}]
- pricePlan: [{range, percentage, rationale}]
- assortmentAdvice: {coreSkuList: [{name, category, colors, priceRange, expectedSellThrough, reason}], avoidList: [{category, reason}]}
- procurementTimeline: [{week, action, items}]
- displayAdvice: [{zone, colors, styles, rationale}]
- keyActions: [{priority, action, expectedImpact, cost}]
- riskAlert: 风险提示（100字）
- kpiTargets: {sellThroughRate, inventoryTurnoverDays, attachmentRate}

要求：percentage之和=100；核心款8-12个；明确不建议铺货的品类。只返回纯JSON。`;

    const userPrompt = `【店铺信息】
店铺：${storeName}
VIP总数：${totalMembers}人
月营收估算：¥${estimatedMonthlyRevenue}
建议采购预算：¥${recommendedBudget}

【VIP色彩季型TOP3】${colorTop || "暂无"}

【VIP风格TOP3】${styleTop || "暂无"}

【VIP消费力】人均消费¥${avgSpending}，购买分层：${JSON.stringify(storeInsights.vip?.spendingBands || {})}

【库存现状】${invSummary}

【市场爆款数据】${trendSummary}

${Object.keys(businessGoals).length > 0 ? `【经营目标与约束】（买手方案必须服务于这些目标）
- 年度采购预算：¥${businessGoals.annual_budget || "未设定"}
- 季度采购预算：¥${businessGoals.quarterly_budget || "未设定"}
- 年度业绩目标：¥${businessGoals.annual_revenue_target || "未设定"}
- 季度业绩目标：¥${businessGoals.quarterly_revenue_target || "未设定"}
- 毛利率目标：${businessGoals.gross_margin_target ? (businessGoals.gross_margin_target * 100).toFixed(0) + "%" : "未设定"}
- 售罄率目标：${businessGoals.sell_through_target ? (businessGoals.sell_through_target * 100).toFixed(0) + "%" : "未设定"}
- 库存周转天数目标：${businessGoals.inventory_turnover_days || "未设定"}天
- 连带率目标：${businessGoals.attachment_rate_target || "未设定"}

⚠ 采购预算约束：totalBudget不得超过季度采购预算；kpiTargets必须对标以上目标值` : ""}

请生成买手企划方案。核心要求：
1. 色彩比例与VIP季型分布吻合
2. 风格比例与VIP风格分布吻合
3. 核心款要有爆款数据支撑
4. 避开库存积压品类
5. 价格带匹配VIP消费力
6. 预留10%补单预算
7. 货盘深度建议：核心款多色多码，非核心款1-2色`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error(`AI API error: ${response.status}`);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) jsonStr = jsonMatch[1];
    const report = JSON.parse(jsonStr);

    return NextResponse.json({
      report,
      dataSources: {
        vipCount: totalMembers,
        trendItems: trendItems.length,
        inventorySKUs: invInfo.totalSKUs || 0,
        inventorySellThrough: invInfo.overallSellThrough || 0,
      },
    });
  } catch (error: any) {
    console.error("买手企划生成失败:", error);
    return NextResponse.json({ error: error.message || "生成失败" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/store/assortment
 *
 * 货盘规划 — 基于VIP画像 + 市场数据 + 库存现状，生成精准货盘建议
 * 核心目标：减少库存积压，提高动销率
 *
 * 输入：storeId, season, budget(可选)
 * 输出：货盘结构建议（品类/颜色/价格带/数量配比）
 */
export async function POST(req: NextRequest) {
  try {
    const { storeId, season, budget, keyword } = await req.json();
    if (!storeId || !season) {
      return NextResponse.json({ error: "缺少storeId或season" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 1. 获取店铺洞察数据（VIP+经营+库存）
    const insightsResp = await fetch(`${baseUrl}/api/store/insights?storeId=${storeId}&sections=vip,business,inventory,sales`, {
      signal: AbortSignal.timeout(15000),
    });
    const insights = insightsResp.ok ? await insightsResp.json() : {};

    // 2. 获取市场数据
    let marketData: Record<string, any> = {};
    try {
      const marketResp = await fetch(`${baseUrl}/api/planning/market-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword || `${season} 女装 爆款`,
          season,
          style: "",
          priceBand: "",
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (marketResp.ok) marketData = await marketResp.json();
    } catch (e) {
      console.error("[assortment] 市场数据获取失败:", e);
    }

    // 3. 获取爆款数据
    let trendData: Record<string, any> = {};
    try {
      const trendResp = await fetch(`${baseUrl}/api/trend/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword || `${season} 女装`,
          sources: ["general", "1688"],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (trendResp.ok) trendData = await trendResp.json();
    } catch (e) {
      console.error("[assortment] 爆款数据获取失败:", e);
    }

    // 4. 用DeepSeek生成货盘规划
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      // 没有API key时返回原始数据
      return NextResponse.json({
        storeId, season,
        insights,
        marketData,
        trendData,
        source: "data_only",
        generatedAt: new Date().toISOString(),
      });
    }

    const vipInfo = insights.vip || {};
    const invInfo = insights.inventory || {};
    const bizInfo = insights.business || {};

    // 构建提示词
    const prompt = `你是一位资深服装货盘规划师。请基于以下真实数据，为店铺生成${season}货盘规划方案。

## 核心目标：减少库存积压，提高动销率，确保货盘与客群精准匹配

### VIP画像数据
- 总VIP：${vipInfo.total || 0}人，已测试：${vipInfo.tested || 0}人
- 色彩季型分布：${JSON.stringify(vipInfo.colorSeasonDistribution || {})}
- 风格分布：${JSON.stringify(vipInfo.styleDistribution || {})}
- 消费力分层：${JSON.stringify(vipInfo.spendingBands || {})}
- VIP人均消费：¥${vipInfo.avgSpent || 0}
- VIP人均购买：${vipInfo.avgPurchases || 0}次

### 库存现状
- SKU总数：${invInfo.totalSKUs || 0}
- 库存总值：¥${invInfo.totalStockValue || 0}
- 整体动销率：${invInfo.overallSellThrough || 0}%
- 滞销款数：${invInfo.overstockCount || 0}
- 缺货款数：${invInfo.lowStockCount || 0}
- 品类库存/销售：${JSON.stringify(invInfo.categoryStats || {})}
- 颜色库存/销售：${JSON.stringify(invInfo.colorStats || {})}

### 市场数据
- 采集数据量：${marketData.totalItems || 0}条
- 市场均价：¥${marketData.priceAnalysis?.avg || "未知"}
- 市场热门颜色：${(marketData.topColors || []).slice(0, 6).map((c: any) => c.color).join("、")}
- 市场热门风格：${(marketData.topStyles || []).slice(0, 5).map((s: any) => s.style).join("、")}
- 市场热门品类：${(marketData.topCategories || []).slice(0, 5).map((c: any) => c.category).join("、")}

### 爆款参考
- 爆款数据量：${(trendData.items || []).length}条
- Top爆款：${(trendData.items || []).slice(0, 5).map((i: any) => `${i.name}(${i.platform} 热度${i.heat_score})`).join("；")}

### 经营数据
${bizInfo.monthly_revenue ? `- 月营业额：¥${bizInfo.monthly_revenue}` : ""}
${bizInfo.gross_margin_rate ? `- 毛利率：${(bizInfo.gross_margin_rate * 100).toFixed(0)}%` : ""}
${bizInfo.avg_item_price ? `- 均件单价：¥${bizInfo.avg_item_price}` : ""}
${bizInfo.conversion_rate ? `- 成交率：${(bizInfo.conversion_rate * 100).toFixed(0)}%` : ""}
${bizInfo.attach_rate ? `- 连带率：${bizInfo.attach_rate}` : ""}
${budget ? `- 本季采购预算：¥${budget}` : ""}

请输出JSON格式的货盘规划方案（在|JSON_START|和|JSON_END|之间）：

|JSON_START|
{
  "summary": "货盘规划概要",
  "assortmentStructure": [
    {"category": "品类名", "ratio": "占比%", "skuCount": 建议SKU数, "strategy": "策略说明"}
  ],
  "colorAssortment": [
    {"colorGroup": "色系名", "colors": ["色1", "色2"], "ratio": "占比%", "reason": "依据"}
  ],
  "priceAssortment": [
    {"band": "价格带名", "range": "价格范围", "ratio": "占比%", "strategy": "策略"}
  ],
  "depthAdvice": [
    {"category": "品类名", "deepStyles": 3, "deepColors": 2, "deepSizes": 3, "reason": "原因"}
  ],
  "inventoryActions": [
    {"action": "补货/清仓/观望", "category": "品类", "reason": "原因", "urgency": "高/中/低"}
  ],
  "trendingItems": [
    {"name": "推荐款名", "category": "品类", "price": "建议定价", "reason": "推荐理由"}
  ],
  "riskWarnings": ["风险1", "风险2"]
}
|JSON_END|

关键原则：
1. 货盘必须与VIP画像对齐 — 占比最高的季型/风格对应最多SKU
2. 品类配比参考库存动销率 — 动销高的多配，动销低的减配
3. 颜色配比参考VIP季型+市场趋势 — 双源交叉验证
4. 价格带参考VIP消费力 — 主销款价格接近VIP人均消费
5. 深度建议（每款几色几码）参考连带率 — 连带率高的品深化度
6. 明确标注需要清仓的滞销品类和需要补货的热销品类
7. 爆款推荐要结合市场数据和VIP偏好`;

    const aiResp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是资深服装货盘规划师，擅长基于真实数据制定精准货盘方案，核心目标是减少库存积压。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!aiResp.ok) {
      return NextResponse.json({ source: "data_only", insights, marketData, trendData, error: "AI生成失败" });
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let report;
    try {
      let jsonStr = "";
      const startIdx = content.indexOf("|JSON_START|");
      const endIdx = content.indexOf("|JSON_END|");
      if (startIdx !== -1 && endIdx !== -1) {
        jsonStr = content.substring(startIdx + 12, endIdx).trim();
      } else {
        const first = content.indexOf("{");
        const last = content.lastIndexOf("}");
        if (first !== -1 && last !== -1) jsonStr = content.substring(first, last + 1);
      }
      report = JSON.parse(jsonStr);
    } catch {
      report = { rawContent: content };
    }

    return NextResponse.json({
      source: "ai",
      storeId,
      season,
      report,
      dataSources: {
        vipCount: vipInfo.total || 0,
        marketItems: marketData.totalItems || 0,
        trendItems: (trendData.items || []).length,
        inventorySKUs: invInfo.totalSKUs || 0,
        inventorySellThrough: invInfo.overallSellThrough || 0,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[assortment] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

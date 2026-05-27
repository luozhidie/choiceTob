import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-marketing-plan
 *
 * 营销策划方案 — 基于VIP画像 + 市场趋势 + 库存现状 + 企业预算与营利目标
 * 核心目标：精准触达VIP客群，活动ROI最大化，驱动业绩目标达成
 */
export async function POST(req: NextRequest) {
  try {
    const {
      storeId,
      season,
      campaignType,
      budget,
      notes,
    } = await req.json();

    if (!storeId) {
      return NextResponse.json({ error: "缺少storeId" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "未配置 AI API Key" }, { status: 500 });
    }

    const useDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const apiUrl = useDeepSeek ? "https://api.deepseek.com/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
    const model = useDeepSeek ? "deepseek-chat" : "gpt-4o";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // 1. 获取店铺洞察（VIP+经营+库存+销售+目标）
    let insights: Record<string, any> = {};
    try {
      const resp = await fetch(`${baseUrl}/api/store/insights?storeId=${storeId}&sections=vip,business,inventory,sales`, {
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) insights = await resp.json();
    } catch (e) {
      console.error("[marketing-plan] 店铺洞察获取失败:", e);
    }

    // 2. 获取市场趋势数据
    let trendItems: any[] = [];
    try {
      const resp = await fetch(`${baseUrl}/api/trend/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: `${season || ""} 女装 营销趋势`, sources: ["general", "weibo"] }),
        signal: AbortSignal.timeout(12000),
      });
      if (resp.ok) {
        const data = await resp.json();
        trendItems = (data.items || []).slice(0, 10);
      }
    } catch (e) {
      console.error("[marketing-plan] 趋势数据获取失败:", e);
    }

    const vipInfo = insights.vip || {};
    const invInfo = insights.inventory || {};
    const bizInfo = insights.business || {};
    const goalsInfo = insights.goals || {};
    const salesInfo = insights.sales || {};

    // 3. 构建目标约束段
    const goalsSection = buildGoalsSection(goalsInfo, budget, season);

    // 4. 构建VIP画像段
    const vipSection = buildVipSection(vipInfo);

    // 5. 构建库存段
    const inventorySection = buildInventorySection(invInfo);

    // 6. 构建市场趋势段
    const trendSection = buildTrendSection(trendItems);

    // 7. 构建销售趋势段
    const salesSection = buildSalesSection(salesInfo, bizInfo);

    const systemPrompt = `你是一位资深的时尚零售营销策划师，擅长基于真实数据为服装店制定精准营销方案。

核心原则：
1. 营销方案必须服务于店铺的业绩目标和营利目标
2. 活动预算不能超过企业预算约束
3. 目标客群必须基于VIP画像精准定位
4. 活动选品必须结合库存现状（优先推广滞销款搭配、缺货款补货提醒）
5. 营销节奏必须与销售趋势配合

输出严格JSON，在|JSON_START|和|JSON_END|之间：

|JSON_START|
{
  "title": "方案标题",
  "summary": "方案概要（200字内）",
  "campaignType": "活动类型",
  "targetAudience": {
    "primarySegment": "核心客群描述",
    "colorSeasons": ["目标色彩季型"],
    "styles": ["目标风格"],
    "spendingBands": ["高频高额/低频高额等"],
    "estimatedReach": 0
  },
  "budgetPlan": {
    "totalBudget": 0,
    "allocation": [{"item": "预算项", "amount": 0, "percentage": "占比%", "rationale": "原因"}],
    "expectedROI": 0,
    "expectedRevenue": 0,
    "breakdownPerVIP": 0
  },
  "timeline": [
    {"phase": "阶段名", "days": "第X-Y天", "actions": ["动作1"], "kpis": ["KPI1"], "budget": 0}
  ],
  "productFocus": [
    {"category": "品类", "strategy": "推广策略", "reason": "基于库存/VIP/趋势", "priority": "高/中/低"}
  ],
  "channelPlan": [
    {"channel": "渠道", "content": "内容方向", "frequency": "频次", "budget": 0}
  ],
  "vipStrategies": [
    {"segment": "客群段", "strategy": "策略", "expectedResponse": "预期响应率", "expectedRevenue": 0}
  ],
  "contentCalendar": [
    {"day": 1, "type": "内容类型", "theme": "主题", "channel": "渠道", "callToAction": "行动号召"}
  ],
  "kpiTracking": {
    "primaryKPIs": [{"name": "KPI名", "target": 0, "current": 0}],
    "trackingFrequency": "日/周",
    "reviewMilestones": ["节点1"]
  },
  "riskMitigation": [
    {"risk": "风险", "probability": "高/中/低", "mitigation": "应对措施"}
  ]
}
|JSON_END|

要求：预算分配总和=totalBudget；ROI计算必须基于VIP消费力和预期响应率；方案必须与业绩目标对齐。`;

    const userPrompt = `请为店铺制定${season || "当季"}营销策划方案。

【活动类型】${campaignType || "综合营销"}

${goalsSection}

${vipSection}

${inventorySection}

${trendSection}

${salesSection}

${notes ? `【补充说明】${notes}` : ""}

请生成营销方案。核心要求：
1. 方案必须服务于业绩目标和营利目标 — 每个动作都要能算出预期营收贡献
2. 预算不能超 — 如果预算有限，优先投放在ROI最高的客群和渠道
3. 精准触达 — 基于VIP画像分层营销，不同客群用不同策略
4. 库存联动 — 推广品要考虑库存动销，滞销款通过搭配营销消化
5. 可执行 — 每个动作都有具体时间、内容、渠道和预期效果
6. 结果可衡量 — 设定明确的KPI和跟踪节奏`;

    const aiResp = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!aiResp.ok) {
      return NextResponse.json({ error: "AI生成失败", status: aiResp.status });
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
      report,
      dataSources: {
        vipCount: vipInfo.total || 0,
        trendItems: trendItems.length,
        inventorySKUs: invInfo.totalSKUs || 0,
        inventorySellThrough: invInfo.overallSellThrough || 0,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[generate-marketing-plan] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============ 辅助函数 ============ */

function buildGoalsSection(goals: Record<string, any>, budget?: number, season?: string): string {
  if (!goals || Object.keys(goals).length === 0) {
    if (budget) {
      return `【经营目标】
- 本季营销预算：¥${budget}
- 其他目标：未设定（建议在店铺管理中完善经营目标）`;
    }
    return `【经营目标】未设定（建议在店铺管理中完善年度预算、业绩目标和营利目标）`;
  }

  let section = `【经营目标与约束】（方案必须服务于这些目标）
- 年度采购预算：¥${goals.annual_budget || "未设定"}
- 季度采购预算：¥${goals.quarterly_budget || "未设定"}
- 年度业绩目标：¥${goals.annual_revenue_target || "未设定"}
- 季度业绩目标：¥${goals.quarterly_revenue_target || "未设定"}
- 毛利率目标：${goals.gross_margin_target ? (goals.gross_margin_target * 100).toFixed(0) + "%" : "未设定"}
- 净利率目标：${goals.net_margin_target ? (goals.net_margin_target * 100).toFixed(0) + "%" : "未设定"}
- 售罄率目标：${goals.sell_through_target ? (goals.sell_through_target * 100).toFixed(0) + "%" : "未设定"}
- 库存周转天数目标：${goals.inventory_turnover_days || "未设定"}天
- 连带率目标：${goals.attachment_rate_target || "未设定"}
- 新增VIP目标：${goals.new_vip_target || "未设定"}人
- 复购率目标：${goals.repurchase_rate_target ? (goals.repurchase_rate_target * 100).toFixed(0) + "%" : "未设定"}`;

  if (budget) {
    section += `\n- 本季营销预算上限：¥${budget}`;
  }

  section += `

⚠ 目标约束（必须遵守）：
1. 营销预算不得超过季度预算的20%（除非用户明确指定了budget）
2. 预期ROI必须能支撑毛利率目标 — 促销力度不能侵蚀毛利底线
3. 方案预期贡献营收应占季度业绩目标20%以上 — 营销不是花钱而是赚钱
4. 售罄率目标决定促销节奏 — 动销慢的要提前推促销，动销快的重点推利润款`;

  return section;
}

function buildVipSection(vip: Record<string, any>): string {
  if (!vip || !vip.total) return "【VIP画像】暂无VIP数据";

  let section = `【VIP画像】（总VIP ${vip.total}人，已测试 ${vip.tested || 0}人）
- 色彩季型分布：${JSON.stringify(vip.colorSeasonDistribution || {})}
- 风格分布：${JSON.stringify(vip.styleDistribution || {})}
- 消费力分层：${JSON.stringify(vip.spendingBands || {})}
- VIP人均消费：¥${vip.avgSpent || 0}
- VIP人均购买：${vip.avgPurchases || 0}次
- VIP等级分布：${JSON.stringify(vip.vipLevelDistribution || {})}`;

  const spendingBands = vip.spendingBands || {};
  if (spendingBands["高频高额"] > 0) {
    section += `\n- 高频高额客户${spendingBands["高频高额"]}人 → 核心利润贡献者，优先维护`;
  }
  if (spendingBands["低频高额"] > 0) {
    section += `\n- 低频高额客户${spendingBands["低频高额"]}人 → 高潜力唤醒对象`;
  }
  if (spendingBands["高频低额"] > 0) {
    section += `\n- 高频低额客户${spendingBands["高频低额"]}人 → 提升客单价的目标群体`;
  }
  if (spendingBands["低频低额"] > 0) {
    section += `\n- 低频低额客户${spendingBands["低频低额"]}人 → 需要激活或筛选`;

  }

  return section;
}

function buildInventorySection(inv: Record<string, any>): string {
  if (!inv || !inv.totalSKUs) return "【库存现状】暂无库存数据";

  let section = `【库存现状】
- SKU总数：${inv.totalSKUs}
- 库存总值：¥${inv.totalStockValue || 0}
- 整体动销率：${inv.overallSellThrough || 0}%
- 滞销款：${inv.overstockCount || 0}个 → 需要通过搭配营销/促销消化
- 缺货款：${inv.lowStockCount || 0}个 → 需要补货避免错失销售
- 品类库存/动销：${JSON.stringify(inv.categoryStats || {})}`;

  const overstockCats = Object.entries(inv.categoryStats || {})
    .filter(([, v]: [string, any]) => v.sellThrough < 40 && v.qty > 5)
    .map(([cat]) => cat);
  if (overstockCats.length > 0) {
    section += `\n- 滞销品类重点：${overstockCats.join("、")} → 营销方案中需包含搭配推荐和促销策略`;
  }

  return section;
}

function buildTrendSection(items: any[]): string {
  if (!items || items.length === 0) return "【市场趋势】暂无趋势数据";

  return `【市场趋势参考】
${items.map((t, i) => `${i + 1}. ${t.name}（${t.platform}，热度${t.heat_score}，${t.style || ""}${t.trend_type || ""}）`).join("\n")}

⚠ 营销内容可参考热门趋势话题和风格，提高内容吸引力`;
}

function buildSalesSection(sales: Record<string, any>, biz: Record<string, any>): string {
  let section = "【经营与销售数据】";

  if (biz.monthly_revenue) section += `\n- 月营业额：¥${biz.monthly_revenue}`;
  if (biz.gross_margin_rate) section += `\n- 毛利率：${(biz.gross_margin_rate * 100).toFixed(0)}%`;
  if (biz.avg_item_price) section += `\n- 均件单价：¥${biz.avg_item_price}`;
  if (biz.conversion_rate) section += `\n- 成交率：${(biz.conversion_rate * 100).toFixed(0)}%`;
  if (biz.attach_rate) section += `\n- 连带率：${biz.attach_rate}`;

  if (sales.trend) {
    section += `\n- 近期销售趋势：${sales.trend === "up" ? "上升 ↑" : sales.trend === "down" ? "下降 ↓" : "持平 →"}`;
  }

  const recentWeeks = sales.recentWeeks || [];
  if (recentWeeks.length > 0) {
    section += `\n- 近${recentWeeks.length}周营收：${recentWeeks.map((w: any) => `¥${w.revenue || 0}`).join(" → ")}`;
  }

  return section;
}

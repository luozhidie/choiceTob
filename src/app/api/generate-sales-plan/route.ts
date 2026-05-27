import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-sales-plan
 *
 * 销售服务方案 — 基于VIP画像 + 消费行为 + 库存现状 + 企业预算与营利目标
 * 核心目标：提升成交率、连带率、复购率，驱动业绩和利润目标达成
 */
export async function POST(req: NextRequest) {
  try {
    const {
      storeId,
      season,
      serviceCategory,
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

    // 1. 获取店铺洞察
    let insights: Record<string, any> = {};
    try {
      const resp = await fetch(`${baseUrl}/api/store/insights?storeId=${storeId}&sections=vip,business,inventory,sales`, {
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) insights = await resp.json();
    } catch (e) {
      console.error("[sales-plan] 店铺洞察获取失败:", e);
    }

    const vipInfo = insights.vip || {};
    const invInfo = insights.inventory || {};
    const bizInfo = insights.business || {};
    const goalsInfo = insights.goals || {};
    const salesInfo = insights.sales || {};

    // 2. 构建各数据段
    const goalsSection = buildGoalsSection(goalsInfo);
    const vipSection = buildVipSection(vipInfo);
    const inventorySection = buildInventorySection(invInfo);
    const salesSection = buildSalesSection(salesInfo, bizInfo);

    const systemPrompt = `你是一位资深的时尚零售销售顾问和培训专家，擅长基于真实数据为服装店制定销售策略和服务方案。

核心原则：
1. 销售策略必须服务于店铺的业绩目标和营利目标
2. 话术和服务流程必须基于VIP画像精准设计
3. 推荐逻辑必须结合库存现状（优先推荐高动销款+搭配滞销款）
4. 服务流程必须可执行、可培训、可复制
5. 结果可衡量，设定明确的销售KPI

输出严格JSON，在|JSON_START|和|JSON_END|之间：

|JSON_START|
{
  "title": "方案标题",
  "summary": "方案概要（200字内）",
  "serviceCategory": "服务类别",
  "salesDiagnosis": {
    "currentStrengths": ["优势1"],
    "currentWeaknesses": ["短板1"],
    "opportunityGap": "业绩差距分析",
    "priorityActions": ["优先行动1"]
  },
  "vipServiceStrategies": [
    {
      "segment": "客群段（如高频高额）",
      "greetingStyle": "接待风格",
      "recommendationLogic": "推荐逻辑",
      "upsellStrategy": "连带策略",
      "followUpPlan": "跟进计划",
      "expectedConversionRate": "预期转化率%",
      "expectedAvgOrderValue": 0
    }
  ],
  "salesScripts": [
    {
      "scenario": "场景名",
      "targetCustomer": "目标客群",
      "openingLine": "开场白",
      "probingQuestions": ["探寻问题1"],
      "recommendationScript": "推荐话术",
      "objectionHandling": {"objection": "异议", "response": "应对话术"},
      "closingScript": "成交话术"
    }
  ],
  "productRecommendationMatrix": [
    {
      "category": "品类",
      "coreItems": ["核心推荐款"],
      "crossSellItems": ["搭配推荐款"],
      "upsellItems": ["升单推荐款"],
      "priceAnchorStrategy": "价格锚定策略"
    }
  ],
  "serviceFlow": [
    {"step": 1, "action": "动作", "duration": "时长", "keyPoints": ["要点1"], "toolsNeeded": "所需工具"}
  ],
  "kpisAndTargets": {
    "conversionRate": {"current": 0, "target": 0, "gap": 0},
    "attachmentRate": {"current": 0, "target": 0, "gap": 0},
    "avgOrderValue": {"current": 0, "target": 0, "gap": 0},
    "repurchaseRate": {"current": 0, "target": 0, "gap": 0},
    "vipActivationRate": {"current": 0, "target": 0, "gap": 0}
  },
  "trainingPlan": [
    {"week": 1, "topic": "培训主题", "practice": "实操练习", "assessment": "考核方式"}
  ],
  "inventoryLinkedActions": [
    {"action": "动作", "category": "品类", "reason": "基于库存数据", "expectedImpact": "预期效果"}
  ],
  "revenueProjection": {
    "monthlyRevenueTarget": 0,
    "perVIPContribution": 0,
    "newCustomerContribution": 0,
    "upsellContribution": 0,
    "totalProjectedRevenue": 0,
    "gapToGoal": 0
  }
}
|JSON_END|`;

    const userPrompt = `请为店铺制定${season || "当季"}销售服务方案。

【服务类别】${serviceCategory || "综合销售策略"}

${goalsSection}

${vipSection}

${inventorySection}

${salesSection}

${notes ? `【补充说明】${notes}` : ""}

请生成销售服务方案。核心要求：
1. 方案必须服务于业绩目标和营利目标 — 每个策略都要能算出对营收的贡献
2. 精准推荐 — 不同VIP客群用不同话术和推荐逻辑
3. 库存联动 — 优先推荐高动销款，搭配推荐滞销款消化库存
4. 连带率提升 — 设计搭配推荐矩阵，提升每单件数
5. 可培训 — 话术和流程可以用来培训店员
6. 可衡量 — 设定明确的KPI目标，与经营目标对齐`;

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
        inventorySKUs: invInfo.totalSKUs || 0,
        inventorySellThrough: invInfo.overallSellThrough || 0,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[generate-sales-plan] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* ============ 辅助函数 ============ */

function buildGoalsSection(goals: Record<string, any>): string {
  if (!goals || Object.keys(goals).length === 0) {
    return "【经营目标】未设定（建议在店铺管理中完善年度预算、业绩目标和营利目标）";
  }

  let section = `【经营目标与约束】（销售策略必须服务于这些目标）
- 年度业绩目标：¥${goals.annual_revenue_target || "未设定"}
- 季度业绩目标：¥${goals.quarterly_revenue_target || "未设定"}
- 毛利率目标：${goals.gross_margin_target ? (goals.gross_margin_target * 100).toFixed(0) + "%" : "未设定"}
- 净利率目标：${goals.net_margin_target ? (goals.net_margin_target * 100).toFixed(0) + "%" : "未设定"}
- 售罄率目标：${goals.sell_through_target ? (goals.sell_through_target * 100).toFixed(0) + "%" : "未设定"}
- 连带率目标：${goals.attachment_rate_target || "未设定"}
- 新增VIP目标：${goals.new_vip_target || "未设定"}人
- 复购率目标：${goals.repurchase_rate_target ? (goals.repurchase_rate_target * 100).toFixed(0) + "%" : "未设定"}`;

  section += `

⚠ 目标约束（必须遵守）：
1. 推荐话术必须避免过度折扣侵蚀毛利率底线
2. 连带率提升策略必须对标目标值 — 当前vs目标的差距决定策略力度
3. 售罄率目标决定推荐优先级 — 动销慢的优先推荐搭配，动销快的推荐利润款
4. 业绩差距决定策略力度 — 差距大的需要更积极的连带和复购策略`;

  return section;
}

function buildVipSection(vip: Record<string, any>): string {
  if (!vip || !vip.total) return "【VIP画像】暂无VIP数据";

  let section = `【VIP画像】（总VIP ${vip.total}人）
- 色彩季型分布：${JSON.stringify(vip.colorSeasonDistribution || {})}
- 风格分布：${JSON.stringify(vip.styleDistribution || {})}
- 消费力分层：${JSON.stringify(vip.spendingBands || {})}
- VIP人均消费：¥${vip.avgSpent || 0}
- VIP人均购买：${vip.avgPurchases || 0}次`;

  // 为每个消费力分层设计不同策略提示
  const bands = vip.spendingBands || {};
  const insights: string[] = [];
  if (bands["高频高额"] > 0) insights.push(`高频高额${bands["高频高额"]}人 → 维护型服务，VIP专属预览+新品首推`);
  if (bands["低频高额"] > 0) insights.push(`低频高额${bands["低频高额"]}人 → 唤醒型服务，到店邀请+私享搭配`);
  if (bands["高频低额"] > 0) insights.push(`高频低额${bands["高频低额"]}人 → 升单型服务，搭配推荐+套装优惠`);
  if (bands["低频低额"] > 0) insights.push(`低频低额${bands["低频低额"]}人 → 激活型服务，体验式到店+入门款推荐`);

  if (insights.length > 0) {
    section += `\n- 分层策略方向：\n  ${insights.join("\n  ")}`;
  }

  return section;
}

function buildInventorySection(inv: Record<string, any>): string {
  if (!inv || !inv.totalSKUs) return "【库存现状】暂无库存数据";

  let section = `【库存现状】
- SKU总数：${inv.totalSKUs}
- 整体动销率：${inv.overallSellThrough || 0}%
- 滞销款：${inv.overstockCount || 0}个
- 缺货款：${inv.lowStockCount || 0}个
- 品类库存/动销：${JSON.stringify(inv.categoryStats || {})}
- 颜色库存/销售：${JSON.stringify(inv.colorStats || {})}`;

  section += `

⚠ 库存联动要求：
1. 高动销品类 → 重点推荐，确保不断码断色
2. 低动销品类 → 通过搭配推荐消化库存（与高动销款组合推荐）
3. 缺货款 → 避免过度推荐，及时反馈补货需求`;

  return section;
}

function buildSalesSection(sales: Record<string, any>, biz: Record<string, any>): string {
  let section = "【经营与销售数据】";

  if (biz.monthly_revenue) section += `\n- 月营业额：¥${biz.monthly_revenue}`;
  if (biz.gross_margin_rate) section += `\n- 毛利率：${(biz.gross_margin_rate * 100).toFixed(0)}%`;
  if (biz.avg_item_price) section += `\n- 均件单价：¥${biz.avg_item_price}`;
  if (biz.conversion_rate) section += `\n- 成交率：${(biz.conversion_rate * 100).toFixed(0)}%`;
  if (biz.attach_rate) section += `\n- 连带率：${biz.attach_rate}`;
  if (biz.foot_traffic) section += `\n- 月进店数：${biz.foot_traffic}`;
  if (biz.break_even_point) section += `\n- 保本点：¥${biz.break_even_point}/月`;

  if (sales.trend) {
    section += `\n- 近期销售趋势：${sales.trend === "up" ? "上升 ↑" : sales.trend === "down" ? "下降 ↓" : "持平 →"}`;
  }

  return section;
}

import { NextRequest, NextResponse } from "next/server";

/**
 * 买手企划 AI 生成接口
 * 基于 VIP 会员画像数据，生成专业 SPA 买手企划方案
 */
export async function POST(req: NextRequest) {
  try {
    const {
      storeName,
      memberSummary,
      allColors,
      allStyles,
      budgetInfo, // 新增：预算信息
    } = await req.json();

    if (!storeName || !memberSummary) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 判断使用哪个 provider
    const useDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const apiKey = useDeepSeek
      ? process.env.DEEPSEEK_API_KEY!
      : process.env.OPENAI_API_KEY!;

    if (!apiKey) {
      return NextResponse.json({ error: "未配置 AI API Key" }, { status: 500 });
    }

    const apiUrl = useDeepSeek
      ? "https://api.deepseek.com/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = useDeepSeek ? "deepseek-chat" : "gpt-4o";

    // 构建会员数据摘要
    const colorTop = (allColors || [])
      .slice(0, 3)
      .map((c: any) => `${c.name}（${c.count}人，${c.pct}%）`)
      .join("、");

    const styleTop = (allStyles || [])
      .slice(0, 3)
      .map((s: any) => `${s.name}（${s.count}人，${s.pct}%）`)
      .join("、");

    // 预算推算
    const totalMembers = memberSummary.total || 0;
    const vipDist = memberSummary.vip || {};
    const avgSpending = memberSummary.avgSpending || 500; // 默认客单价
    const estimatedMonthlyRevenue = totalMembers * avgSpending * 0.3; // 估算月营收
    const recommendedBudget = Math.round(estimatedMonthlyRevenue * 2.5); // 采购预算 = 2.5倍月营收

    const systemPrompt = `你是一位顶尖的 SPA（Specialty store retailer of Private label Apparel）买手专家，精通优衣库、ZARA、H&M 等快时尚品牌的买手体系。

你的核心任务是：基于 VIP 会员画像数据，制定科学的采购企划，实现：
1. 高售罄率（目标 >85%）
2. 低库存周转天数（目标 <30天）
3. 高连带率（目标 >1.8）
4. 精准匹配 VIP 审美偏好（色彩季型 + 风格）

输出格式必须严格为 JSON，包含以下字段：
- title: 企划报告标题（含店铺名和日期）
- summary: 整体策略总结（150字以内，包含核心策略和预期售罄率）
- totalBudget: 建议总采购预算（整数，单位：元）
- budgetAllocation: 预算分配数组，每项含 category（品类）、amount（金额）、percentage（整数%）
- colorPlan: 色彩企划数组，每项含 season（英文key）、label（显示名）、percentage（整数%）、rationale（理由，20字内）
- stylePlan: 风格企划数组，每项含 style（英文key）、label（显示名）、percentage（整数%）、rationale（理由，20字内）
- sizePlan: 尺码比例数组，每项含 size（尺码）、percentage（整数%）、rationale（理由）
- categoryPlan: 品类结构数组，每项含 category（品类名）、percentage（整数%）、units（建议件数）、rationale（理由）
- pricePlan: 价格带数组，每项含 range（价格区间）、percentage（整数%）、rationale（理由）
- procurementTimeline: 采购时间轴数组，每项含 week（第几周）、action（行动）、items（涉及品类）
- displayAdvice: 陈列建议数组，每项含 zone（分区名）、colors（色彩列表）、styles（风格列表）、rationale（理由）
- keyActions: 关键行动数组，每项含 priority（1-5整数）、action（行动描述）、expectedImpact（预期效果）、cost（预估成本）
- riskAlert: 风险提示（100字内）
- kpiTargets: KPI目标，含 sellThroughRate（售罄率目标%）、inventoryTurnoverDays（库存周转天数目标）、attachmentRate（连带率目标）

要求：
1. 所有 percentage 字段之和必须严格等于 100
2. 预算分配要合理，总预算 = sum(budgetAllocation.amount)
3. 尺码比例要符合中国女性/男性身体数据（S:25%, M:35%, L:25%, XL:10%, XXL:5% 仅供参考，需根据实际会员调整）
4. 采购时间轴要覆盖完整季度（13周）
5. 色彩参考12季色彩体系（英文key）：light_warm、warm_bright、clear_warm、light_cool、soft_cool、cool_soft、warm_soft、soft_warm、deep_warm、clear_cool、cool_bright、deep_cool
6. 风格参考（英文key）：shao_nv、you_ya、lang_man_f、shao_nian_f、shi_shang_f、gu_dian_f、zi_ran_f、xi_ju_f
7. 品类建议包含：上装、下装、连衣裙、外套、配饰
8. 价格带根据VIP消费能力给4个区间
9. 只返回纯JSON，不要任何解释文字、不要 markdown 代码块标记`;

    const userPrompt = `【店铺信息】
店铺名称：${storeName}
VIP会员总数：${totalMembers}人
预估月营收：¥${estimatedMonthlyRevenue}
建议采购预算：¥${recommendedBudget}

【会员色彩季型TOP3】
${colorTop || "暂无数据"}

【会员风格分布TOP3】
${styleTop || "暂无数据"}

【性别分布】
${JSON.stringify(memberSummary.gender || {}, null, 2)}

【VIP等级分布】
${JSON.stringify(vipDist, null, 2)}

【会员年龄分布】
${JSON.stringify(memberSummary.ageDist || {}, null, 2)}

请生成一份专业的 SPA 买手企划方案。核心要求：
1. 色彩企划比例要与会员色彩季型分布高度吻合，优先覆盖 TOP3 色彩
2. 风格企划要精准匹配会员风格偏好，避免采购不符合定位的款式
3. 尺码比例要科学，参考：S:M:L:XL:XXL = 2:4:3:1:0（女），3:4:2:1:0（男），可根据实际会员调整
4. 品类结构要适合该店铺的主力客群（女装/男装比例）
5. 价格带要符合VIP消费能力，要有高毛利款的占比
6. 采购时间轴要覆盖完整13周季度，明确每周行动
7. 陈列建议要能让VIP一进店就看到"适合我的区域"
8. 预算分配要合理，预留10%作为补单预算
9. KPI目标要具体可衡量

重要：这是专业买手决策系统，不是个人穿搭建议。输出要直接指导采购决策。`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API 错误: ${response.status} ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    // 尝试解析 JSON，处理可能包含的 markdown 代码块
    let jsonStr = content;
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }
    
    const report = JSON.parse(jsonStr);

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("买手企划生成失败:", error);
    return NextResponse.json(
      { error: error.message || "生成失败" },
      { status: 500 }
    );
  }
}

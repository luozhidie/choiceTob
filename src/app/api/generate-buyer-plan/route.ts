import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const {
      storeName,
      memberSummary,
      allColors,
      allStyles,
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

    const colorTop = (allColors || [])
      .slice(0, 3)
      .map((c: any) => `${c.name}（${c.count}人）`)
      .join("、");

    const styleTop = (allStyles || [])
      .slice(0, 3)
      .map((s: any) => `${s.name}（${s.count}人）`)
      .join("、");

    const systemPrompt = `你是一位顶尖的服装零售买手专家，擅长基于VIP会员画像数据制定店铺商品企划方案。
你的目标是帮助服装店主实现精准买手，提升售罄率、降低库存，建立稳定VIP客户群。
输出格式必须严格为 JSON，包含以下字段：
- title: 企划报告标题（含店铺名和日期）
- summary: 整体策略总结（100字以内）
- colorPlan: 色彩企划数组，每项含 season（英文key）、label（显示名）、percentage（整数%）、rationale（理由）
- stylePlan: 风格企划数组，每项含 style（英文key）、label（显示名）、percentage（整数%）、rationale（理由）
- categoryPlan: 品类结构数组，每项含 category（品类名）、percentage（整数%）、rationale（理由）
- pricePlan: 价格带数组，每项含 range（价格区间）、percentage（整数%）、rationale（理由）
- displayAdvice: 陈列建议数组，每项含 zone（分区名）、colors（色彩列表）、styles（风格列表）、rationale（理由）
- keyActions: 关键行动数组，每项含 priority（1-5整数）、action（行动描述）、expectedImpact（预期效果）
- riskAlert: 风险提示（可选）

要求：
1. colorPlan 百分比之和=100，stylePlan 之和=100，categoryPlan 之和=100，pricePlan 之和=100
2. percentage 必须是整数，所有项相加严格等于100
3. 色彩参考12季色彩体系（英文key）：light_warm、warm_bright、clear_warm、light_cool、soft_cool、cool_soft、warm_soft、soft_warm、deep_warm、clear_cool、cool_bright、deep_cool
4. 风格参考（英文key）：shao_nv、you_ya、lang_man_f、shao_nian_f、shi_shang_f、gu_dian_f、zi_ran_f、xi_ju_f、xi_ju_m、zi_ran_m、gu_dian_m、lang_man_m、shi_shang_m
5. 品类建议包含：上装、下装、连衣裙、外套、配饰
6. 价格带根据VIP消费能力给4个区间（如 99-199元、199-399元、399-699元、699元+）
7. 陈列建议按VIP色彩/风格分布划分店铺区域，让VIP一进店就看到"适合我的区域"
8. 只返回纯JSON，不要任何解释文字`;

    const userPrompt = `店铺名称：${storeName}
VIP会员总数：${memberSummary.total || 0}人

【会员色彩季型TOP3】
${colorTop || "暂无数据"}

【会员风格分布TOP3】
${styleTop || "暂无数据"}

【性别分布】
${JSON.stringify(memberSummary.gender || {}, null, 2)}

【VIP等级分布】
${JSON.stringify(memberSummary.vip || {}, null, 2)}

请根据以上会员画像数据，生成一份完整的店铺买手企划方案。重点：
1. 色彩企划比例要与会员色彩季型分布高度吻合
2. 风格企划要匹配会员风格偏好
3. 品类结构要适合该店铺的主力客群
4. 价格带要符合VIP消费能力
5. 陈列建议要能让VIP一进店就看到"适合我的区域"，形成差异化体验`;

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
    const report = JSON.parse(content);

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("买手企划生成失败:", error);
    return NextResponse.json(
      { error: error.message || "生成失败" },
      { status: 500 }
    );
  }
}

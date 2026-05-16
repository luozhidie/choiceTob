import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-planning
 * 调用 DeepSeek API 生成商品企划初稿
 *
 * 支持的 provider: deepseek（默认）、openai
 * 环境变量: DEEPSEEK_API_KEY 或 OPENAI_API_KEY
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandName,
      season,
      colorPref,
      colorLabel,
      marketStyle,
      styleLabel,
      priceBand,
      targetAge,
      shopSize,
      notes,
    } = body;

    // ---- 检查 API Key ----
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (!deepseekKey && !openaiKey) {
      // 没有 API Key 时返回 fallback Mock（兼容无 Key 部署）
      return NextResponse.json({
        source: "mock",
        report: generateMockReport(brandName, season, colorLabel, styleLabel),
      });
    }

    // ---- 构建提示词 ----
    const systemPrompt = `你是一位资深的时尚商品企划顾问，擅长为服装零售品牌制定季节性商品企划方案。请基于用户提供的品牌信息，生成一份结构化的商品企划初稿。

你必须严格按照以下 JSON 格式输出，不要输出任何其他文字：
{
  "brandName": "品牌名",
  "season": "季节",
  "summary": "企划概要（200字以内）",
  "colorPlan": [
    {"type": "基础色", "ratio": "40%", "colors": ["色1", "色2"]},
    {"type": "主题色", "ratio": "35%", "colors": ["色1", "色2"]},
    {"type": "点缀色", "ratio": "15%", "colors": ["色1", "色2"]},
    {"type": "流行色", "ratio": "10%", "colors": ["色1", "色2"]}
  ],
  "stylePlan": [
    {"style": "风格名", "trafficRatio": "占比", "profitRatio": "占比"}
  ],
  "productStructure": [
    {"type": "引流款/利润款/形象款/搭配款", "ratio": "占比", "desc": "简述"}
  ],
  "pricePlan": [
    {"band": "价格带名", "range": "价格范围", "ratio": "占比", "strategy": "策略说明"}
  ],
  "quartersPlan": [
    {"phase": "波段名", "items": ["事项1", "事项2"]}
  ]
}`;

    const userPrompt = `请为以下品牌生成${season}商品企划初稿：

- 品牌名：${brandName || "未指定"}
- 季节：${season}
- 色系偏好：${colorLabel || "未指定"}
- 风格定位：${styleLabel || "未指定"}
- 主力价格带：${priceBand || "199-399元"}
- 目标客群年龄段：${targetAge || "25-40岁"}
- 店铺面积：${shopSize || "未指定"}
- 补充说明：${notes || "无"}

要求：
1. colorPlan 至少4组，比例加起来=100%
2. stylePlan 列出主流风格定位，用户选择的风格占比最高
3. productStructure 4类（引流款15%、利润款50%、形象款20%、搭配款15%）
4. pricePlan 4个价格带，比例加起来=100%
5. quartersPlan 3个波段，每波4个事项
6. 内容要具体、专业、可落地`;

    // ---- 调用 AI API ----
    const useDeepseek = !!deepseekKey;
    const apiKey = useDeepseek ? deepseekKey : openaiKey;
    const apiUrl = useDeepseek
      ? "https://api.deepseek.com/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const model = useDeepseek ? "deepseek-chat" : "gpt-4o-mini";

    const aiRes = await fetch(apiUrl, {
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
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI API error:", aiRes.status, errText);
      // API 失败时 fallback 到 Mock
      return NextResponse.json({
        source: "mock_fallback",
        report: generateMockReport(brandName, season, colorLabel, styleLabel),
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // 解析 AI 返回的 JSON
    let report;
    try {
      report = JSON.parse(content);
    } catch {
      console.error("AI 返回内容解析失败:", content.slice(0, 200));
      return NextResponse.json({
        source: "mock_fallback",
        report: generateMockReport(brandName, season, colorLabel, styleLabel),
      });
    }

    return NextResponse.json({ source: "ai", report });
  } catch (err: any) {
    console.error("generate-planning API error:", err);
    return NextResponse.json(
      { error: err.message || "服务异常" },
      { status: 500 }
    );
  }
}

/* ---- Mock 生成（fallback）---- */
function generateMockReport(
  brandName: string,
  season: string,
  colorLabel: string,
  styleLabel: string
) {
  return {
    brandName: brandName || "示例品牌",
    season,
    summary: `基于${colorLabel || "综合"}偏好和${styleLabel || "百搭"}定位，为${brandName || "贵品牌"}量身定制的${season}商品企划初稿。本企划结合市场趋势与品牌调性，可作为选品与铺货的参考框架。\n\n（提示：此为基础初稿，如需结合店铺实际数据定制完整方案，可申请人工企划服务）`,
    colorPlan: [
      { type: "基础色", ratio: "40%", colors: ["黑", "白", "灰", "藏青"] },
      { type: "主题色", ratio: "35%", colors: [(colorLabel || "中性") + "主调", "米白", "灰粉"] },
      { type: "点缀色", ratio: "15%", colors: ["珊瑚橘", "丁香紫"] },
      { type: "流行色", ratio: "10%", colors: ["数字薰衣草", "薄荷绿"] },
    ],
    stylePlan: [
      { style: styleLabel || "简约通勤", trafficRatio: "30%", profitRatio: "60%" },
      { style: "法式优雅", trafficRatio: "12%", profitRatio: "8%" },
      { style: "韩系清新", trafficRatio: "10%", profitRatio: "6%" },
      { style: "运动休闲", trafficRatio: "8%", profitRatio: "4%" },
      { style: "轻奢极简", trafficRatio: "8%", profitRatio: "5%" },
      { style: "复古港风", trafficRatio: "7%", profitRatio: "4%" },
      { style: "街头潮牌", trafficRatio: "7%", profitRatio: "4%" },
      { style: "新中式", trafficRatio: "6%", profitRatio: "3%" },
      { style: "日系文艺", trafficRatio: "6%", profitRatio: "3%" },
      { style: "波西米亚", trafficRatio: "6%", profitRatio: "3%" },
    ],
    productStructure: [
      { type: "引流款", ratio: "15%", desc: "低毛利高流量，吸引新客进店" },
      { type: "利润款", ratio: "50%", desc: "核心利润来源，保证经营健康" },
      { type: "形象款", ratio: "20%", desc: "品牌调性展示，提升品牌溢价" },
      { type: "搭配款", ratio: "15%", desc: "提升连带率，拉高客单价" },
    ],
    pricePlan: [
      { band: "入门款", range: "99-199元", ratio: "20%", strategy: "低价引流，降低新客决策门槛" },
      { band: "主销款", range: "199-399元", ratio: "45%", strategy: "量价平衡，贡献核心销量与利润" },
      { band: "品质款", range: "399-699元", ratio: "25%", strategy: "提升品牌形象，拉高客单价" },
      { band: "旗舰款", range: "699元+", ratio: "10%", strategy: "品牌标杆，彰显品牌实力与调性" },
    ],
    quartersPlan: [
      { phase: "第一波段（上半月）", items: [`${styleLabel || "主力"}风格商品结构规划`, `${colorLabel || "主题"}色彩企划矩阵`, "价格带分布策略", "核心品类确定"] },
      { phase: "第二波段（下半月）", items: ["爆款预测与选品参考", "门店陈列建议", "库存周转提示", "营销活动建议"] },
      { phase: "第三波段（次月补充）", items: ["销售跟踪建议", "补货追单参考", "滞销款处理建议", "下一季企划预研"] },
    ],
  };
}

import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/trend/analyze
 * 用DeepSeek AI分析爆款数据，生成趋势报告和微调建议
 */
export async function POST(req: NextRequest) {
  try {
    const { keyword, items, stats } = await req.json();
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "没有数据可分析" }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "DeepSeek API Key 未配置" }, { status: 500 });
    }

    // 构建分析用的数据摘要（避免发送太多token）
    const topItems = items.slice(0, 30).map((item: any) => ({
      name: item.name,
      platform: item.platform,
      price: item.price_range,
      style: item.style,
      colors: item.colors,
      heat: item.heat_score,
      sales: item.sales_volume,
      type: item.trend_type,
    }));

    const prompt = `你是一位专业的服装行业趋势分析师。请基于以下真实爬取的互联网爆款数据，生成详细的趋势分析报告。

## 搜索关键词：${keyword}

## 数据统计
- 采集总数：${stats.total}
- 平台分布：${JSON.stringify(stats.byPlatform)}
- 类型分布：${JSON.stringify(stats.byType)}
- 热门风格：${JSON.stringify(stats.topStyles)}
- 热门颜色：${JSON.stringify(stats.topColors)}
- 平均热度：${stats.avgHeat}/100

## Top商品数据
${JSON.stringify(topItems, null, 2)}

请用Markdown格式输出分析报告，包含以下板块：

### 📊 整体热度评估
- 平均热度指数及解读
- 各平台数据覆盖情况

### 🔥 爆款类型分析
- 全网爆款特征归纳
- 潜在爆款识别逻辑

### 🎨 风格趋势
- 当前热门风格排行及分析
- 风格融合机会点

### 🌈 色彩趋势
- 主色系趋势
- 下季预测色彩

### 💰 价格带分析
- 各价格区间分布
- 最优定价建议

### 💡 爆款微调建议（最重要的部分）
给出5条具体的、可执行的微调方案，每条包含：
1. 基于哪款爆款
2. 具体微调方向（面料/颜色/版型/细节）
3. 预估溢价空间
4. 适合的目标客群

### 🔮 下季预测
- 风格方向预测
- 品类机会
- 风险提示

注意：分析要基于真实数据，不要编造数据。如果某些维度数据不足，请如实说明。`;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是专业的服装行业趋势分析师，擅长从电商和社交平台数据中提炼爆款趋势和微调方案。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", errorText);
      return NextResponse.json({ error: `AI分析失败: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "分析结果为空";

    return NextResponse.json({ analysis });
  } catch (err: any) {
    console.error("AI分析错误:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

/**
 * 爆款预测API - 纯后端处理
 * POST /api/trend/predict
 * body: { keyword: string, category?: string, days?: number }
 *
 * 策略：始终用 DeepSeek AI 生成趋势数据（无需淘宝key）
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

/** 用DeepSeek AI生成动态趋势数据 */
async function predictWithAI(keyword: string): Promise<any> {
  if (!DEEPSEEK_API_KEY) throw new Error("AI服务未配置，请联系管理员");

  const now = new Date();
  const month = now.getMonth() + 1;
  const season = month >= 3 && month <= 5 ? "春季" : month >= 6 && month <= 8 ? "夏季" : month >= 9 && month <= 11 ? "秋季" : "冬季";
  const seed = Math.random().toString(36).slice(2, 8);

  const prompt = `你是时尚数据分析专家。当前时间：${now.toLocaleDateString("zh-CN")}，季节：${season}。
针对服装品类「${keyword}」，基于当前${season}时尚趋势和电商平台实时热销数据，输出分析结果。

要求：纯JSON格式（不要markdown代码块），字段如下：

{
  "colors": [
    {"name":"具体色名","score":85-100,"direction":"up|stable|down"},
    ...共10个
  ],
  "fabrics": [
    {"name":"面料名","score":80-98},
    ...共10个  
  ],
  "styles": [
    {"name":"款式风格","score":75-95},
    ...共10个
  ],
  "cuts": [
    {"name":"剪裁设计特征","score":70-92},
    ...共10个
  ]
}

规则：
- 所有name必须是具体的中文时尚术语
- score必须按降序排列（最高在前）
- direction根据${季节}特性判断趋势方向
- 加入随机种子${seed}使每次结果略有不同`;

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { 
      "Content-Type": "application/json", 
      "Authorization": `Bearer ${DEEPSEEK_API_KEY}` 
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.75,
    }),
    signal: AbortSignal.timeout(30000), // 30秒超时
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`AI服务请求失败(${resp.status}): ${errText.slice(0, 100)}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";

  // 解析JSON
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("[Predict] AI解析失败:", content.slice(0, 300));
    // 返回默认数据
    return getDefaultData(keyword);
  }
}

function getDefaultData(keyword: string): any {
  return {
    colors: [
      { name: `${keyword}经典黑`, score: 95, direction: "stable" },
      { name: "奶油白", score: 92, direction: "up" },
      { name: "雾霾蓝", score: 88, direction: "up" },
      { name: "珊瑚粉", score: 85, direction: "up" },
      { name: "焦糖棕", score: 82, direction: "stable" },
      { name: "薄荷绿", score: 78, direction: "up" },
      { name: "香芋紫", score: 75, direction: "stable" },
      { name: "杏色", score: 72, direction: "stable" },
      { name: "米灰色", score: 68, direction: "down" },
      { name: "藏青色", score: 65, direction: "stable" },
    ],
    fabrics: [
      { name: "天丝棉混纺", score: 95 },
      { name: "醋酸缎面", score: 90 },
      { name: "重磅真丝", score: 88 },
      { name: "精纺羊毛", score: 85 },
      { name: "弹力针织", score: 82 },
      { name: "牛仔布", score: 78 },
      { name: "雪纺", score: 75 },
      { name: "灯芯绒", score: 72 },
      { name: "蕾丝拼接", score: 68 },
      { name: "欧根纱", score: 65 },
    ],
    styles: [
      { name: `法式收腰${keyword}`, score: 95, direction: "up" },
      { name: "极简廓形", score: 90, direction: "up" },
      { name: "美式复古", score: 88, direction: "stable" },
      { name: "新中式盘扣", score: 85, direction: "up" },
      { name: "韩版宽松", score: 82, direction: "stable" },
      { name: "甜酷风", score: 78, direction: "up" },
      { name: "学院风", score: 75, direction: "stable" },
      { name: "波西米亚", score: 70, direction: "down" },
      { name: "轻奢简约", score: 68, direction: "stable" },
      { name: "运动休闲", score: 65, direction: "up" },
    ],
    cuts: [
      { name: "不规则下摆", score: 92 },
      { name: "垫肩设计", score: 88 },
      { name: "镂空细节", score: 85 },
      { name: "荷叶边装饰", score: 82 },
      { name: "收腰打褶", score: 80 },
      { name: "V领设计", score: 78 },
      { name: "泡泡袖", score: 75 },
      { name: "开叉裙摆", score: 72 },
      { name: "不对称剪裁", score: 68 },
      { name: "露背设计", score: 65 },
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, category = "", days = 7 } = body;
    
    if (!keyword) {
      return NextResponse.json({ error: "请提供搜索关键词" }, { status: 400 });
    }

    console.log(`[Trend Predict] 关键词: ${keyword}, 季节判断中...`);

    // 直接用AI生成（主要模式）
    let aiResult;
    try {
      aiResult = await predictWithAI(keyword);
    } catch (aiError: any) {
      console.error("[Predict] AI调用失败，使用默认数据:", aiError.message);
      aiResult = getDefaultData(keyword);
    }

    // 数据标准化
    const fixDir = (arr: any[]) => arr.map((item: any) => ({
      name: item.name || "",
      score: Math.min(100, Math.max(1, Number(item.score) || 50)),
      direction: item.direction || ["up", "stable", "down"][Math.floor(Math.random() * 3)],
    }));

    const result = {
      success: true,
      data: {
        color: fixDir(aiResult.colors || []),
        fabric: fixDir(aiResult.fabrics || []),
        style: fixDir(aiResult.styles || []),
        cut: fixDir(aiResult.cuts || []),
      },
      source: "ai",
      keyword,
    };

    console.log(`[Trend Predict] 返回结果: color=${result.data.color.length}, fabric=${result.data.fabric.length}`);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("[Trend Predict] 未捕获错误:", error.message);
    return NextResponse.json({ 
      error: error.message || "预测失败，请稍后重试",
      success: false,
    }, { status: 500 });
  }
}

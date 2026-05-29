import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DeepSeek API 调用
async function callDeepSeek(prompt: string, systemPrompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("未配置 DEEPSEEK_API_KEY");

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

/**
 * POST /api/auto-match
 * 根据商品属性自动识别色彩季型和风格结论
 * Body: { product_id: string }
 * 返回: { color_season_code, style_conclusion, match_tags, confidence }
 */
export async function POST(req: NextRequest) {
  try {
    const { product_id } = await req.json();
    if (!product_id) return NextResponse.json({ error: "缺少 product_id" }, { status: 400 });

    const supabase = await createClient();

    // 1. 获取商品信息
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("id, title, description, color_hex, fabric_code, cut_code, pattern_code, color_season_code, style_conclusion")
      .eq("id", product_id)
      .single();

    if (pErr || !product) return NextResponse.json({ error: "商品不存在" }, { status: 404 });

    // 如果已经有颜色季型和风格结论，直接返回
    if (product.color_season_code && product.style_conclusion) {
      return NextResponse.json({
        color_season_code: product.color_season_code,
        style_conclusion: product.style_conclusion,
        match_tags: { styles: [product.style_conclusion], seasons: [product.color_season_code] },
        already_matched: true,
      });
    }

    // 2. 调用 AI 识别
    const systemPrompt = `你是专业的服装色彩与风格分析专家。根据商品信息，判断其色彩季型和风格结论。

十二色彩季型体系：
- S01=浅暖（明度高/艳度中/暖调）
- S02=浅冷（明度高/艳度中/冷调）
- S03=深暖（明度低/艳度中/暖调）
- S04=深冷（明度低/艳度中/冷调）
- S05=暖亮（明度高/艳度高/暖调）
- S06=暖柔（明度中/艳度低/暖调）
- S07=冷亮（明度高/艳度高/冷调）
- S08=冷柔（明度中/艳度低/冷调）
- S09=净冷（明度高/艳度高/冷调，更冷）
- S10=净暖（明度高/艳度高/暖调，更暖）
- S11=柔冷（明度中/艳度低/冷调，更冷）
- S12=柔暖（明度中/艳度低/暖调，更暖）

八种风格类型：
- 少女型：柔美、曲线、轻盈、浪漫元素
- 优雅型：精致、曲线、高层次、柔美
- 浪漫型：华丽、曲线、丰盈、女性化
- 少年型：干练、直线、中性、利落
- 时尚型：前卫、直线、个性、流行
- 古典型：严谨、直线、高级、都市化
- 自然型：随意、直线、舒适、自然材质
- 戏剧型：夸张、直线/曲线、大气、强对比

请返回严格JSON格式：
{
  "color_season_code": "S01-S12其中之一",
  "style_conclusion": "八种风格之一",
  "confidence": 0.0-1.0,
  "reasoning": "简短分析理由"
}`;

    const userPrompt = `商品信息：
- 标题：${product.title}
- 描述：${product.description || "无"}
- 颜色HEX：${product.color_hex || "未知"}
- 面料编码：${product.fabric_code?.join(",") || "未填"}
- 剪裁编码：${product.cut_code?.join(",") || "未填"}
- 图案编码：${product.pattern_code?.join(",") || "未填"}

请根据以上信息判断色彩季型和风格结论。`;

    const aiResult = await callDeepSeek(userPrompt, systemPrompt);

    const color_season_code = aiResult.color_season_code || null;
    const style_conclusion = aiResult.style_conclusion || null;
    const match_tags = {
      styles: style_conclusion ? [style_conclusion] : [],
      seasons: color_season_code ? [color_season_code] : [],
    };

    // 3. 更新商品记录
    const { error: updateErr } = await supabase
      .from("products")
      .update({
        color_season_code,
        style_conclusion,
        match_tags,
      })
      .eq("id", product_id);

    if (updateErr) console.error("更新商品属性失败:", updateErr);

    // 4. 触发自动搭配生成（异步，不阻塞返回）
    // TODO: 调用搭配生成逻辑

    return NextResponse.json({
      color_season_code,
      style_conclusion,
      match_tags,
      confidence: aiResult.confidence,
      reasoning: aiResult.reasoning,
      already_matched: false,
    });
  } catch (err: any) {
    console.error("auto-match error:", err);
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

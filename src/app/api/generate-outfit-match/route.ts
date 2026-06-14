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
 * POST /api/generate-outfit-match
 * 生成搭配方案
 * Body: { store_id, occasion, style_tag, season_tag, match_rule }
 */
export async function POST(req: NextRequest) {
  try {
    // 检查用户是否已登录
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    
    const { store_id, occasion, style_tag, season_tag, match_rule } = await req.json();

    if (!store_id) return NextResponse.json({ error: "缺少 store_id" }, { status: 400 });

    // 1. 获取符合条件的商品
    let productsQuery = supabase
      .from("products")
      .select("id, title, color_hex, color_season_code, style_conclusion, fabric_code, cut_code, pattern_code")
      .eq("is_published", true);

    if (style_tag) {
      productsQuery = productsQuery.eq("style_conclusion", style_tag);
    }
    if (season_tag) {
      productsQuery = productsQuery.eq("color_season_code", season_tag);
    }

    const { data: products, error: pErr } = await productsQuery.limit(50);
    if (pErr) throw new Error("查询商品失败: " + pErr.message);
    if (!products || products.length < 2) {
      return NextResponse.json({ error: "符合条件的商品不足，无法生成搭配（至少需要2件）" }, { status: 400 });
    }

    // 2. 调用 AI 生成搭配方案
    const systemPrompt = `你是专业的服装搭配师。根据用户提供的商品库，生成高质量的搭配方案。
搭配方案应包含：标题、描述、推荐的商品组合、搭配理由、适用场合、风格标签、色彩季型标签。

请返回严格JSON格式：
{
  "title": "搭配方案标题",
  "description": "搭配方案描述（50-100字）",
  "selected_product_ids": ["商品ID数组，2-4件"],
  "style_tags": ["风格标签数组"],
  "season_tags": ["色彩季型标签数组"],
  "occasion": "场合",
  "match_rule_used": "使用的搭配原则代码",
  "reasoning": "搭配理由（100字内）",
  "styling_tips": "穿搭建议（100字内）"
}`;

    const userPrompt = `店铺ID：${store_id}
场合：${occasion || "日常"}
风格偏好：${style_tag || "不限"}
色彩季型偏好：${season_tag || "不限"}
搭配原则：${match_rule || "R01"}

可选商品库（共${products.length}件）：
${products.map((p: any) => `- ${p.title}（ID: ${p.id}, 风格: ${p.style_conclusion || "未知"}, 季型: ${p.color_season_code || "未知"}）`).join("\n")}

请从以上商品中选择2-4件，组成一个协调的搭配方案。`;

    const aiResult = await callDeepSeek(userPrompt, systemPrompt);

    // 3. 保存搭配方案到数据库
    const { data: outfit, error: insertErr } = await supabase
      .from("outfit_matches")
      .insert([{
        store_id,
        title: aiResult.title || "新搭配方案",
        description: aiResult.description || null,
        product_ids: aiResult.selected_product_ids || [],
        match_type: "auto",
        style_tags: aiResult.style_tags || (style_tag ? [style_tag] : []),
        season_tags: aiResult.season_tags || (season_tag ? [season_tag] : []),
        occasion: aiResult.occasion || occasion || "日常",
        match_rule_code: aiResult.match_rule_used || match_rule || null,
        ai_report: {
          reasoning: aiResult.reasoning,
          styling_tips: aiResult.styling_tips,
        },
        is_published: false,
      }])
      .select()
      .single();

    if (insertErr) throw new Error("保存搭配方案失败: " + insertErr.message);

    return NextResponse.json({
      success: true,
      outfit_id: outfit.id,
      title: outfit.title,
      description: outfit.description,
      product_ids: outfit.product_ids,
      style_tags: outfit.style_tags,
      season_tags: outfit.season_tags,
      ai_report: outfit.ai_report,
    });
  } catch (err: any) {
    console.error("generate-outfit-match error:", err);
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

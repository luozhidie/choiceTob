import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callAI, extractJSON } from "@/lib/ai";
import { cmbKnowledgeText } from "@/lib/cmb-knowledge";

export const dynamic = "force-dynamic";

async function openRouterVision(params: {
  system: string;
  userText: string;
  imageUrls: string[];
  apiKey: string;
}): Promise<{ content: string } | null> {
  const models = (process.env.OPENROUTER_MODEL ||
    "qwen/qwen2.5-vl-72b-instruct,google/gemini-2.5-flash,openai/gpt-4o-mini")
    .split(",").map((s) => s.trim()).filter(Boolean);

  const content: any[] = [{ type: "text", text: params.userText }];
  for (const url of params.imageUrls.slice(0, 5)) {
    content.push({ type: "image_url", image_url: { url } });
  }

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${params.apiKey}`,
          "HTTP-Referer": "https://colour-choice.art",
          "X-Title": "Luozhidie Zhixuan",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: params.system },
            { role: "user", content },
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || "";
        if (text) return { content: text };
      }
    } catch {
      // 尝试下一个模型
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: "缺少 productId" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const [{ data: product }, { data: seasons }, { data: styles }] = await Promise.all([
      supabase
        .from("products")
        .select("title,description,category,color,material,sizes,tags,price,cover_image,images")
        .eq("id", productId)
        .single(),
      supabase.from("color_seasons").select("code,name_zh").order("sort_order", { ascending: true }),
      supabase.from("style_tags").select("code,name_zh,gender,is_main,parent_code,direction").order("sort_order", { ascending: true }),
    ]);

    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }

    const knowledge = cmbKnowledgeText(
      (seasons || []) as any,
      (styles || []) as any
    );

    const validSeasons = new Set((seasons || []).map((s: any) => s.code));
    const validStyles = new Set((styles || []).map((s: any) => s.code));

    const userText = `【CMB 色彩季型/穿衣风格判定知识库】
${knowledge}

【待判定商品】
- 标题：${product.title || "无"}
- 分类：${product.category || "无"}
- 颜色：${product.color || "无"}
- 面料：${product.material || "无"}
- 尺码：${product.sizes || "无"}
- 标签：${Array.isArray(product.tags) ? product.tags.join(", ") : product.tags || "无"}
- 价格（分）：${product.price ?? "无"}
- 描述：${product.description || "无"}

请结合商品图片（看廓形/比例/领型/垂感/细节）与上方知识库，给出判断。
规则：
1. 色彩季型选 1-4 个最匹配的码（以图片实际颜色为主，标题颜色为辅）。
2. 穿衣风格：通常选 1 个主风格 + 0-3 个偏风格；通用款可男女都选。以图片廓形判断曲线/直线与版型。
3. 只返回 JSON，不要解释：{"color_season_codes":["..."], "style_tag_codes":["..."], "reason":"简短中文理由"}`;

    const system = `你是专业服装买手 + CMB 色彩季型/风格分析师。严格依据提供的知识库给商品推荐色彩季型和穿衣风格码。只输出合法 JSON。`;

    // 优先视觉模型（OpenRouter）：能看到商品图，判断廓形/风格更准
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const imageUrls: string[] = [];
    if (product.cover_image) imageUrls.push(product.cover_image);
    if (Array.isArray(product.images)) imageUrls.push(...product.images.filter(Boolean));
    const uniqueImages = [...new Set(imageUrls)].filter((u: string) => /\.(jpg|jpeg|png|webp)/i.test(u)).slice(0, 5);

    let aiContent: string | null = null;
    let model = "";

    if (openrouterKey && uniqueImages.length > 0) {
      const r = await openRouterVision({ system, userText, imageUrls: uniqueImages, apiKey: openrouterKey });
      if (r) {
        aiContent = r.content;
        model = "openrouter-vision";
      }
    }

    // 回退：纯文本（DeepSeek / OpenAI），仅依据文字元数据
    if (!aiContent) {
      const ai = await callAI({ system, user: userText, temperature: 0.3, maxTokens: 1500 });
      if (ai.content) {
        aiContent = ai.content;
        model = ai.model;
      }
    }

    if (!aiContent) {
      return NextResponse.json(
        { error: "AI 未返回建议（请检查 OPENROUTER_API_KEY / DEEPSEEK_API_KEY / OPENAI_API_KEY）" },
        { status: 503 }
      );
    }

    const parsed = extractJSON<{ color_season_codes?: string[]; style_tag_codes?: string[]; reason?: string }>(aiContent);
    if (!parsed) {
      return NextResponse.json({ error: "AI 返回格式异常", raw: aiContent }, { status: 500 });
    }

    const color_season_codes = (parsed.color_season_codes || []).filter((c) => validSeasons.has(c));
    const style_tag_codes = (parsed.style_tag_codes || []).filter((c) => validStyles.has(c));

    return NextResponse.json({
      color_season_codes,
      style_tag_codes,
      reason: parsed.reason || "",
      model,
      mode: model === "openrouter-vision" ? "vision" : "text",
    });
  } catch (err: any) {
    console.error("[suggest-tags]", err);
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

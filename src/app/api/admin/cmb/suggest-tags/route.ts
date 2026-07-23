import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callAI, extractJSON } from "@/lib/ai";

export const dynamic = "force-dynamic";

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

    // 拉商品 + 参考库
    const [{ data: product }, { data: seasons }, { data: styles }] = await Promise.all([
      supabase
        .from("products")
        .select("title,description,category,color,material,sizes,tags,price,cover_image")
        .eq("id", productId)
        .single(),
      supabase.from("color_seasons").select("code,name_zh").order("sort_order", { ascending: true }),
      supabase.from("style_tags").select("code,name_zh,gender,is_main,parent_code,direction").order("sort_order", { ascending: true }),
    ]);

    if (!product) {
      return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    }

    const seasonList = (seasons || []).map((s: any) => `${s.code}=${s.name_zh}`).join(", ");
    const womenMain = (styles || []).filter((s: any) => s.gender === "women" && s.is_main).map((s: any) => `${s.code}=${s.name_zh}`).join(", ");
    const womenSub = (styles || []).filter((s: any) => s.gender === "women" && !s.is_main).map((s: any) => `${s.code}=${s.name_zh}${s.direction ? "·" + s.direction : ""}`).join(", ");
    const menMain = (styles || []).filter((s: any) => s.gender === "men" && s.is_main).map((s: any) => `${s.code}=${s.name_zh}`).join(", ");
    const menSub = (styles || []).filter((s: any) => s.gender === "men" && !s.is_main).map((s: any) => `${s.code}=${s.name_zh}`).join(", ");

    const system = `你是专业服装买手 + CMB 色彩季型/风格分析师。请严格从下方有效码表中选码，给商品推荐色彩季型和穿衣风格。只输出合法 JSON。`;

    const user = `有效色彩季型码（12）：${seasonList}

有效女士主风格码：${womenMain}
有效女士偏风格码：${womenSub}
有效男士主风格码：${menMain}
有效男士偏风格码：${menSub}

商品信息：
- 标题：${product.title || "无"}
- 分类：${product.category || "无"}
- 颜色：${product.color || "无"}
- 面料：${product.material || "无"}
- 尺码：${product.sizes || "无"}
- 标签：${Array.isArray(product.tags) ? product.tags.join(", ") : product.tags || "无"}
- 价格（分）：${product.price ?? "无"}
- 描述：${product.description || "无"}

规则：
1. 色彩季型选 1-4 个最匹配的码。
2. 穿衣风格：通常选 1 个主风格 + 0-3 个偏风格；通用款可男女都选。
3. 只返回 JSON，不要解释：{"color_season_codes":["..."], "style_tag_codes":["..."], "reason":"简短中文理由"}`;

    const ai = await callAI({ system, user, temperature: 0.3, maxTokens: 1500 });
    if (!ai.content) {
      return NextResponse.json({ error: "AI 未返回建议（请检查 DEEPSEEK_API_KEY / OPENAI_API_KEY）" }, { status: 503 });
    }

    const parsed = extractJSON<{ color_season_codes?: string[]; style_tag_codes?: string[]; reason?: string }>(ai.content);
    if (!parsed) {
      return NextResponse.json({ error: "AI 返回格式异常", raw: ai.content }, { status: 500 });
    }

    // 过滤无效码
    const validSeasons = new Set((seasons || []).map((s: any) => s.code));
    const validStyles = new Set((styles || []).map((s: any) => s.code));
    const color_season_codes = (parsed.color_season_codes || []).filter((c) => validSeasons.has(c));
    const style_tag_codes = (parsed.style_tag_codes || []).filter((c) => validStyles.has(c));

    return NextResponse.json({
      color_season_codes,
      style_tag_codes,
      reason: parsed.reason || "",
      model: ai.model,
    });
  } catch (err: any) {
    console.error("[suggest-tags]", err);
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

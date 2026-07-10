import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI, extractJSON } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const isAdmin = cookieHeader.includes("admin_logged_in=true");
  if (!isAdmin) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json();
  const { title, productDesc, keywords, imageUrl, platform, tone } = body;
  if (!title) {
    return NextResponse.json({ error: "请输入商品标题" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const platformDesc = {
    wechat: "微信朋友圈：简洁有温度、带场景感，适合熟人社交，可带emoji",
    xiaohongshu: "小红书：种草风、真实体验、关键词多、带 emoji，强调氛围和实用",
    douyin: "抖音短视频文案：开头抓人、口语化、有节奏感、带话题标签",
    group: "社群/团购：短促有力、强调稀缺/价格/现货，促下单",
  }[platform] || "通用电商文案：简洁、卖点清晰、突出购买理由";

  const system = `你是资深服装电商文案。根据商品信息，生成可直接用于营销发布的多套文案。
请严格输出如下 JSON，不要任何额外文字：
{
  "titleOptimized": "优化后的商品标题（20字以内，含关键词）",
  "imageCaption": "给图片配的短文案（2-3行，可直接放在图片上或朋友圈配图）",
  "bulletPoints": ["卖点1", "卖点2", "卖点3", "卖点4"],
  "friendCircle": "朋友圈长文案（80-120字，带场景和购买引导）",
  "groupCopy": "社群/团购文案（50-80字，突出价格/现货/稀缺）",
  "hashtags": ["#标签1", "#标签2", "#标签3"],
  "priceLine": "一句价格/价值话术，如：工厂直出，专柜品质，地摊价",
  "cta": "行动号召，如：私信我留码、进群抢现货、手慢无"
}`;

  const userPrompt = `商品标题：${title}
商品描述：${productDesc || "—"}
关键词：${keywords || "—"}
图片：${imageUrl ? "有参考图" : "无参考图"}
目标平台：${platformDesc}
文案风格：${tone || "爆款、有转化力"}

请生成中文营销文案。`;

  const { content, source } = await callAI({
    system,
    user: userPrompt,
    temperature: 0.8,
    maxTokens: 2500,
    timeoutMs: 55000,
  });

  if (source === "mock" || !content) {
    return NextResponse.json({ error: "AI 服务未配置或调用失败（mock 降级）" }, { status: 502 });
  }

  const result = extractJSON(content);
  if (!result) {
    return NextResponse.json({ error: "AI 返回解析失败", raw: content }, { status: 502 });
  }

  const { data: record, error: dbError } = await supabase
    .from("ai_marketing_copies")
    .insert([{
      user_id: user?.id,
      title,
      product_desc: productDesc || null,
      keywords: keywords || null,
      image_url: imageUrl || null,
      platform,
      tone: tone || null,
      result_json: result,
    }])
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ result, record, source });
}

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_marketing_copies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ records: data });
}

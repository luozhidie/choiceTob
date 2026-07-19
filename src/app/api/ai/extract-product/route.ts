// 智能建商品：上传商品图（+可选供应商报价文字）→ AI 视觉识别抽取结构化参数
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function parseMiniToken(token: string): { uid: string; exp?: number } | null {
  try {
    if (!token || token.includes(".")) return null;
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.uid) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    return { uid: payload.uid as string, exp: payload.exp as number | undefined };
  } catch {
    return null;
  }
}

async function checkAdmin(request: NextRequest): Promise<boolean> {
  const cookie = request.headers.get("cookie") || "";
  if (cookie.includes("admin_logged_in=true")) return true;
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice(7);
  let userId: string | null = null;
  if (token.includes(".")) {
    try {
      const { data } = await supabase.auth.getUser(token);
      if (data.user) userId = data.user.id;
    } catch {}
  } else {
    const mini = parseMiniToken(token);
    if (mini) userId = mini.uid;
  }
  if (!userId) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return !!profile?.is_admin;
}

const SYSTEM = `你是服装批发行业的商品录入助手。用户会发来商品实拍图（可能多张），以及可选的供应商报价文字。
请识别并抽取结构化字段，严格只输出如下 JSON（不要任何额外文字、不要 markdown）：
{
  "title": "商品标题（中文，含品类+核心卖点，30字以内）",
  "category": "品类，从[上装,下装,连衣裙,外套,鞋靴,箱包,配饰,珠宝首饰,其他]中选一个最合适",
  "price": "零售价（数字，单位元；图上看不到就填 0）",
  "wholesale_price": "批发价（数字，单位元；图或文字有就填，没有填 0）",
  "sizes": "尺码，逗号分隔，如 S,M,L,XL,XXL 或 均码；看不清填空串",
  "color": "颜色，逗号分隔，如 黑,白,杏色；看不清填空串",
  "material": "材质/面料，如 棉,涤纶,羊毛混纺；看不清填空串",
  "season": "适用季节，从[春,夏,秋,冬,四季]中选",
  "description": "一句话卖点（20字以内）",
  "tags": ["标签1","标签2"]
}`;

function mockResult(images: string[], note?: string): any {
  return {
    title: note ? "导入商品（待核对）" : "新款商品（待核对）",
    category: "其他",
    price: 0,
    wholesale_price: 0,
    sizes: "",
    color: "",
    material: "",
    season: "四季",
    description: note ? note.slice(0, 20) : "AI 服务未配置，已生成草稿待你填写",
    tags: ["待核对"],
    images,
    _mock: true,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!(await checkAdmin(request))) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const images: string[] = Array.isArray(body.images) ? body.images.filter((x: any) => typeof x === "string").slice(0, 9) : [];
    const note: string = typeof body.note === "string" ? body.note : "";

    if (images.length === 0 && !note) {
      return NextResponse.json({ error: "请至少提供商品图或供应商文字" }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    // ===== 方案 A0：OpenRouter 视觉识别（OpenAI 兼容，支持多种视觉模型）=====
    // 注意：Google/OpenAI 模型在该账户所属地区常被屏蔽，默认首选 Qwen-VL（中国区可用），
    // 其余作为回退；可通过 OPENROUTER_MODEL 环境变量用逗号自定义顺序。
    if (openrouterKey && images.length > 0) {
      const orModels = (process.env.OPENROUTER_MODEL ||
        "qwen/qwen2.5-vl-72b-instruct,google/gemini-2.5-flash,openai/gpt-4o-mini")
        .split(",").map((s) => s.trim()).filter(Boolean);
      const content: any[] = [
        {
          type: "text",
          text:
            "请识别这些服装商品并抽取参数。" +
            (note ? `供应商备注：${note}` : ""),
        },
      ];
      for (const url of images.slice(0, 5)) {
        content.push({ type: "image_url", image_url: { url } });
      }
      for (const model of orModels) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 55000);
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openrouterKey}`,
              "HTTP-Referer": "https://colour-choice.art",
              "X-Title": "Luozhidie Zhixuan",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: SYSTEM },
                { role: "user", content },
              ],
              temperature: 0.3,
              max_tokens: 1200,
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || "";
            const parsed = extractJSON(text);
            if (parsed) {
              return NextResponse.json({ success: true, source: "openrouter", product: { ...parsed, images } });
            }
          }
        } catch {
          // 该模型失败，尝试列表中的下一个
        }
      }
    }

    // ===== 方案 A：OpenAI 视觉识别（gpt-4o-mini 支持看图）=====
    if (openaiKey && images.length > 0) {
      try {
        const content: any[] = [
          {
            type: "text",
            text:
              "请识别这些服装商品并抽取参数。" +
              (note ? `供应商备注：${note}` : ""),
          },
        ];
        for (const url of images.slice(0, 5)) {
          content.push({ type: "image_url", image_url: { url } });
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 55000);
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiKey}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: SYSTEM },
              { role: "user", content },
            ],
            temperature: 0.3,
            max_tokens: 1200,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || "";
          const parsed = extractJSON(text);
          if (parsed) {
            return NextResponse.json({ success: true, source: "openai", product: { ...parsed, images } });
          }
        }
      } catch {
        // 视觉失败转下方兜底
      }
    }

    // ===== 方案 B：仅文字（DeepSeek 文本抽取）=====
    if (deepseekKey && note) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 55000);
        const res = await fetch(process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: SYSTEM + "\n（本次只收到文字，无图片，请依据文字抽取）" },
              { role: "user", content: `供应商报价文字：${note}` },
            ],
            temperature: 0.3,
            max_tokens: 1200,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content || "";
          const parsed = extractJSON(text);
          if (parsed) {
            return NextResponse.json({ success: true, source: "deepseek", product: { ...parsed, images } });
          }
        }
      } catch {
        // 转兜底
      }
    }

    // ===== 兜底：生成待核对草稿 =====
    return NextResponse.json({ success: true, source: "mock", product: mockResult(images, note) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "服务器错误" }, { status: 500 });
  }
}

function extractJSON(content: string): any | null {
  if (!content) return null;
  try {
    const s = content.indexOf("{");
    const e = content.lastIndexOf("}");
    if (s === -1 || e === -1 || e <= s) return null;
    return JSON.parse(content.substring(s, e + 1));
  } catch {
    return null;
  }
}

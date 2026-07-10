import { NextRequest, NextResponse } from "next/server";
import { callAI } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const isAdmin = cookieHeader.includes("admin_logged_in=true");
  if (!isAdmin) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { productDesc, category, refStyle, color, fabric, season } = await req.json();
  if (!productDesc && !category) {
    return NextResponse.json({ error: "请填写爆款描述或品类" }, { status: 400 });
  }

  const system = `你是资深服装设计师兼买手。基于给定爆款，输出可落地的改款方向。
严格要求：只输出如下 JSON，不要任何额外文字。
{
  "summary": "一句话改款策略总览",
  "colorOptions": ["换色方案1","换色方案2","换色方案3"],
  "fabricOptions": ["换面料方案1","换面料方案2"],
  "silhouetteOptions": ["换版型/廓形方案1","换版型/廓形方案2"],
  "printOptions": ["印花/图案方案1","印花/图案方案2"],
  "craftOptions": ["工艺升级方案1","工艺升级方案2"],
  "targetPrice": "建议拿货价区间，如 ¥39-59",
  "name": "建议的新套餐/款式名称"
}`;

  const user = `爆款描述：${productDesc || "—"}
品类：${category || "—"}
参考风格：${refStyle || "—"}
希望主色：${color || "自由发挥"}
希望面料：${fabric || "自由发挥"}
季节：${season || "当季"}`;

  const { content, source } = await callAI({ system, user, temperature: 0.8, maxTokens: 1500, timeoutMs: 55000 });

  if (source === "mock" || !content) {
    return NextResponse.json({ error: "AI 服务未配置或调用失败（mock 降级）" }, { status: 502 });
  }

  // 提取 JSON
  let result: any = null;
  const s = content.indexOf("{");
  const e = content.lastIndexOf("}");
  if (s !== -1 && e !== -1 && e > s) {
    try { result = JSON.parse(content.substring(s, e + 1)); } catch {}
  }
  if (!result) {
    return NextResponse.json({ error: "AI 返回解析失败", raw: content }, { status: 502 });
  }

  return NextResponse.json({ result, source });
}

// 词源 → 选品 AI 调用：把某行业已发布的选品判断词源拼成系统提示词，
// 让大模型严格按老板沉淀的判断逻辑对候选商品做 推荐/观望/放弃 评估。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callAI } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function buildSystemPrompt(tokens: any[]): string {
  const blocks = tokens.map((t) => {
    const fields = t.fields && typeof t.fields === "object" ? JSON.stringify(t.fields, null, 2) : "";
    return [
      `## 词源：${t.title}（${t.category || ""}/${t.fields?.layer || ""}）`,
      t.summary ? `一句话判断：${t.summary}` : "",
      fields ? `结构化判断参数：\n${fields}` : "",
      t.prompt ? `可调用的判断逻辑：\n${t.prompt}` : "",
    ].filter(Boolean).join("\n");
  });
  return [
    "你是「骆芷蝶智选」的资深买手，专注服装及多行业选品。",
    "下面是你老板（骆芷蝶）多年沉淀的「选品判断词源」——这些是必须依据的硬逻辑，不是参考建议。",
    "你的任务：严格按照这些词源对候选商品做评估，不得自创与词源冲突的标准。",
    "",
    "===== 词源库（按此执行）=====",
    ...blocks,
    "",
    "===== 评估要求 =====",
    "1. 给出明确结论：推荐 / 观望 / 放弃。",
    "2. 逐条引用用到的词源名称与参数说明理由。",
    "3. 标记命中了哪些爆款信号、踩了哪些风险点。",
    "4. 用中文、分点、不要寒暄、不用代码块包裹。",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    const domain = body.domain || "服装";
    const product = (body.product || "").trim();
    if (!product) return NextResponse.json({ error: "请粘贴候选商品信息" }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { data: tokens, error } = await supabase
      .from("selection_tokens")
      .select("*")
      .eq("domain", domain)
      .eq("status", "published")
      .is("deleted_at", null);
    if (error) throw error;

    const used = tokens || [];
    if (used.length === 0) {
      return NextResponse.json(
        { error: `「${domain}」行业还没有已发布的选品判断词源，请先在词源库发布几条（状态设为已发布）。` },
        { status: 400 }
      );
    }

    const system = buildSystemPrompt(used);
    const userPrompt = `【候选商品】\n${product}\n\n请基于上面的词源库逻辑，给出评估结论：`;

    const { content, source, model } = await callAI({
      system,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 2000,
      timeoutMs: 55000,
    });

    if (source === "mock" || !content) {
      return NextResponse.json(
        { error: "AI 服务未配置或调用失败（mock 降级），请检查 DEEPSEEK/OPENAI 密钥。" },
        { status: 502 }
      );
    }

    // 计量：被调用的词源 usage_count +1
    await Promise.all(
      used.map((t: any) =>
        supabase
          .from("selection_tokens")
          .update({ usage_count: (t.usage_count || 0) + 1 })
          .eq("id", t.id)
      )
    );

    return NextResponse.json({
      ok: true,
      result: content,
      source,
      model,
      usedTokens: used.map((t: any) => t.title),
      count: used.length,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

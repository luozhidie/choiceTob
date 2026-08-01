// 词源 → 选品 AI 调用：把某行业已发布的选品判断词源拼成系统提示词，
// 让大模型严格按老板沉淀的判断逻辑对候选商品做 推荐/观望/放弃 评估。
// 支持「词源组合」：一条词源通过 fields.depends_on 调用另一条（可跨行业），
// 被调用的子词源会一起注入系统提示词，形成可编排的工作流。
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

// 递归解析依赖：从入口词元出发，沿 fields.depends_on 收集所有被调用的子词元（深度上限 maxDepth，防环）
function resolveDeps(entry: any[], byId: Map<string, any>, maxDepth = 4): { ordered: any[]; cycle: boolean } {
  const visited = new Set<string>();
  const ordered: any[] = [];
  let cycle = false;
  let frontier = [...entry];
  for (let d = 0; d < maxDepth; d++) {
    const next: any[] = [];
    for (const t of frontier) {
      if (!t || visited.has(t.id)) continue;
      visited.add(t.id);
      ordered.push(t);
      const deps: string[] = (t.fields?.depends_on || []).filter(Boolean);
      for (const id of deps) {
        const dep = byId.get(id);
        if (!dep) continue; // 依赖的子词源已删除/不存在，跳过
        if (visited.has(id)) { cycle = true; continue; } // 出现环，停止深入
        next.push(dep);
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  // 若达到深度上限仍有未解析的入口，可能有环或超深
  if (frontier.length > 0) cycle = true;
  return { ordered, cycle };
}

// 将一组词元渲染成提示词片段
function renderTokens(tokens: any[], tag: string): string {
  return tokens.map((t) => {
    const fields = t.fields && typeof t.fields === "object" ? JSON.stringify(t.fields, null, 2) : "";
    return [
      `### ${tag}：${t.title}（${t.domain || ""}/${t.category || ""}/${t.fields?.layer || ""}）`,
      t.summary ? `一句话判断：${t.summary}` : "",
      fields ? `结构化判断参数：\n${fields}` : "",
      t.prompt ? `可调用的判断逻辑：\n${t.prompt}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

function buildSystemPrompt(mainTokens: any[], subTokens: any[]): string {
  const head = [
    "你是「骆芷蝶智选」的资深买手，专注服装及多行业选品。",
    "下面是你老板（骆芷蝶）多年沉淀的「选品判断词源」——这些是必须依据的硬逻辑，不是参考建议。",
    "你的任务：严格按照这些词源对候选商品做评估，不得自创与词源冲突的标准。",
  ];
  const mainBlock = [
    "===== 主词源库（按此执行）=====",
    renderTokens(mainTokens, "主词源"),
  ];
  const subBlock = subTokens.length
    ? [
        "",
        "===== 被调用的子词源（由主词源组合调用，同样必须依据）=====",
        renderTokens(subTokens, "子词源"),
      ]
    : [];

  return [
    ...head,
    "",
    ...mainBlock,
    ...subBlock,
    "",
    "===== 评估要求 =====",
    "1. 给出明确结论：推荐 / 观望 / 放弃。",
    "2. 逐条引用用到的词源名称与参数说明理由（主词源、子词源都要点名）。",
    "3. 标记命中了哪些爆款信号、踩了哪些风险点。",
    "4. 若子词源给出了客户画像/风控/估值等前置判断，需先应用再下结论。",
    "5. 用中文、分点、不要寒暄、不用代码块包裹。",
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

    // 1) 取该行业已发布的主词源
    const { data: tokens, error } = await supabase
      .from("selection_tokens")
      .select("*")
      .eq("domain", domain)
      .eq("status", "published")
      .is("deleted_at", null);
    if (error) throw error;

    const mainTokens = tokens || [];
    if (mainTokens.length === 0) {
      return NextResponse.json(
        { error: `「${domain}」行业还没有已发布的选品判断词源，请先在词源库发布几条（状态设为已发布）。` },
        { status: 400 }
      );
    }

    // 2) 收集主词源直接/间接依赖的子词源（跨行业、按 id 取，不限状态）
    const allIds = new Set<string>();
    for (const t of mainTokens) {
      for (const id of (t.fields?.depends_on || [])) allIds.add(id as string);
    }
    let depRows: any[] = [];
    if (allIds.size > 0) {
      const { data: deps, error: depsErr } = await supabase
        .from("selection_tokens")
        .select("*")
        .in("id", Array.from(allIds))
        .is("deleted_at", null);
      if (depsErr) throw depsErr;
      depRows = deps || [];
    }

    // 3) 把主词源 + 直接依赖放进 byId，再递归展开多级依赖
    const byId = new Map<string, any>();
    for (const t of [...mainTokens, ...depRows]) byId.set(t.id, t);
    const { ordered, cycle } = resolveDeps(mainTokens, byId, 4);
    const mainIds = new Set(mainTokens.map((t) => t.id));
    const subTokens = ordered.filter((t) => !mainIds.has(t.id));

    const system = buildSystemPrompt(mainTokens, subTokens);
    const userPrompt = `【候选商品】\n${product}\n\n请基于上面的词源库逻辑（含被调用的子词源），给出评估结论：`;

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

    // 4) 计量：被调用的词源 usage_count +1（主词源 + 子词源）
    const used = [...mainTokens, ...subTokens];
    await Promise.all(
      used.map((t: any) =>
        supabase
          .from("selection_tokens")
          .update({ usage_count: (t.usage_count || 0) + 1 })
          .eq("id", t.id)
      )
    );

    const depTitles = subTokens.map((t) => `${t.title}（${t.domain}）`);
    return NextResponse.json({
      ok: true,
      result: content,
      source,
      model,
      usedTokens: mainTokens.map((t: any) => t.title),
      depTokens: depTitles,
      count: mainTokens.length,
      depCount: subTokens.length,
      cycle,
      usedIds: used.map((t) => t.id),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

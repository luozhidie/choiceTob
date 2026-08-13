// 对外词元调用 API（需 API Key）：海外卖家/系统凭 key 直连你的词元，
// 按调用量计费（token_api_keys.usage_count +1）。只返回 AI 结论，
// 不返回 prompt / fields 等底层逻辑——天然防抄。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { callAI } from "@/lib/ai";
import { FX_RATE_CNY } from "@/lib/billing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// 递归解析依赖（与 admin select 一致）：基于 DFS 路径的真环检测。
// 关键点：一条词元既是主词元（入口）又被其它词元组合调用时，不算环——
// 只有出现「回边」（依赖指向当前 DFS 路径上的祖先）才算真正的循环依赖。
function resolveDeps(entry: any[], byId: Map<string, any>, maxDepth = 4): { ordered: any[]; cycle: boolean } {
  const ordered: any[] = [];
  const seenGlobal = new Set<string>(); // 全局去重，避免同一条词元重复进结果
  let cycle = false;

  const dfs = (t: any, depth: number, path: Set<string>) => {
    if (!t || seenGlobal.has(t.id)) return;
    if (path.has(t.id)) { cycle = true; return; } // 回边 = 真环
    path.add(t.id);
    seenGlobal.add(t.id);
    ordered.push(t);
    if (depth < maxDepth) {
      for (const id of (t.fields?.depends_on || []).filter(Boolean)) {
        const dep = byId.get(id);
        if (dep) dfs(dep, depth + 1, path);
      }
    } else if ((t.fields?.depends_on || []).length) {
      cycle = true; // 超过深度上限，疑似超深或环
    }
    path.delete(t.id);
  };

  for (const root of entry) dfs(root, 0, new Set());
  return { ordered, cycle };
}

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
    "下面是你老板（骆芷蝶）多年沉淀的「选品判断词元」——这些是必须依据的硬逻辑，不是参考建议。",
    "你的任务：严格按照这些词元对候选商品做评估，不得自创与词元冲突的标准。",
  ];
  const mainBlock = ["===== 主词元库（按此执行）=====", renderTokens(mainTokens, "主词元")];
  const subBlock = subTokens.length
    ? ["", "===== 被调用的子词元（由主词元组合调用，同样必须依据）=====", renderTokens(subTokens, "子词元")]
    : [];
  return [
    ...head, "", ...mainBlock, ...subBlock, "",
    "===== 评估要求 =====",
    "1. 给出明确结论：推荐 / 观望 / 放弃。",
    "2. 逐条引用用到的词元名称与参数说明理由。",
    "3. 标记命中了哪些爆款信号、踩了哪些风险点。",
    "4. 若子词元给出前置判断，需先应用再下结论。",
    "5. 用中文、分点、不用代码块包裹。",
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    // 1) 校验 API Key
    const apiKey = request.headers.get("x-api-key") || new URL(request.url).searchParams.get("key") || "";
    if (!apiKey) return NextResponse.json({ error: "缺少 API Key（请在 Header 携带 x-api-key）" }, { status: 401 });

    const supabase = getServiceRoleClient();
    const { data: keyRow, error: keyErr } = await supabase
      .from("token_api_keys")
      .select("*")
      .eq("api_key", apiKey)
      .is("deleted_at", null)
      .single();
    if (keyErr || !keyRow) return NextResponse.json({ error: "API Key 无效" }, { status: 401 });
    if (keyRow.status !== "active") return NextResponse.json({ error: "API Key 已停用" }, { status: 403 });

    // 1.5) 额度门禁：仅对预付费 key 生效；旧 key（credit_balance 为 NULL）按 usage_count 不限次
    if (keyRow.credit_balance !== null && keyRow.credit_balance !== undefined) {
      const remaining = (keyRow.credit_balance || 0) - (keyRow.credit_used || 0);
      if (remaining <= 0) {
        return NextResponse.json(
          { error: "调用额度已用完，请到 https://colour-choice.art/tokens-market 充值", code: "QUOTA_EXHAUSTED" },
          { status: 402 }
        );
      }
    }

    // 2) 解析请求
    const body = await request.json().catch(() => ({}));
    const domain = body.domain || "服装";
    const product = (body.product || "").trim();
    if (!product) return NextResponse.json({ error: "缺少 candidate 商品信息（body.product）" }, { status: 400 });

    // 3) 取已发布主词元
    const { data: tokens, error } = await supabase
      .from("selection_tokens")
      .select("*")
      .eq("domain", domain)
      .eq("status", "published")
      .is("deleted_at", null);
    if (error) throw error;
    const mainTokens = tokens || [];
    if (mainTokens.length === 0) {
      return NextResponse.json({ error: `「${domain}」暂无已发布的选品判断词元` }, { status: 400 });
    }

    // 4) 解析依赖（跨行业）
    const allIds = new Set<string>();
    mainTokens.forEach((t) => (t.fields?.depends_on || []).forEach((id: string) => allIds.add(id)));
    let depRows: any[] = [];
    if (allIds.size > 0) {
      const { data: deps } = await supabase.from("selection_tokens").select("*").in("id", Array.from(allIds)).is("deleted_at", null);
      depRows = deps || [];
    }
    const byId = new Map<string, any>();
    [...mainTokens, ...depRows].forEach((t) => byId.set(t.id, t));
    const { ordered, cycle } = resolveDeps(mainTokens, byId, 4);
    const mainIds = new Set(mainTokens.map((t) => t.id));
    const subTokens = ordered.filter((t) => !mainIds.has(t.id));

    // 5) 调 AI
    const system = buildSystemPrompt(mainTokens, subTokens);
    const userPrompt = `【候选商品】\n${product}\n\n请基于上面的词元库逻辑（含被调用的子词元），给出评估结论：`;
    const { content, source, model } = await callAI({ system, user: userPrompt, temperature: 0.4, maxTokens: 2000, timeoutMs: 55000 });
    if (source === "mock" || !content) {
      return NextResponse.json({ error: "AI 服务未配置或调用失败" }, { status: 502 });
    }

    // 6) 计费：Key 调用量 +1；预付费 key 同时扣额度（credit_used +1）
    const keyPatch: any = { usage_count: (keyRow.usage_count || 0) + 1 };
    if (keyRow.credit_balance !== null && keyRow.credit_balance !== undefined) {
      keyPatch.credit_used = (keyRow.credit_used || 0) + 1;
    }
    await supabase.from("token_api_keys").update(keyPatch).eq("id", keyRow.id);
    await Promise.all([...mainTokens, ...subTokens].map((t) =>
      supabase.from("selection_tokens").update({ usage_count: (t.usage_count || 0) + 1 }).eq("id", t.id)
    ));

    // 6.5) 结算账本（非阻塞）：记录本次命中词元 + 归属创作者，供分账看板聚合。
    //      单次调用平台收益尽量从最近一笔已付 token_order 推算；算不出则为 0。
    try {
      const hitTokens = ordered;
      const creatorIds = Array.from(
        new Set(hitTokens.map((t: any) => t.creator_id).filter(Boolean))
      ) as string[];

      let callPriceCny = 0;
      try {
        const { data: ord } = await supabase
          .from("token_orders")
          .select("amount, currency, calls")
          .eq("api_key_id", keyRow.id)
          .eq("status", "paid")
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1);
        if (ord && ord.length && (ord[0].calls || 0) > 0) {
          const o = ord[0];
          const totalCny = o.currency === "usd" ? (o.amount / 100) * FX_RATE_CNY : o.amount / 100;
          callPriceCny = Math.round((totalCny / o.calls) * 100) / 100;
        }
      } catch { /* 算不出价格不影响主流程 */ }

      await supabase.from("token_api_calls").insert({
        api_key_id: keyRow.id,
        buyer_label: keyRow.owner || keyRow.name || "未知调用方",
        domain,
        hit_token_ids: hitTokens.map((t: any) => t.id),
        hit_token_titles: hitTokens.map((t: any) => t.title),
        creator_ids: creatorIds,
        call_price_cny: callPriceCny,
      });
    } catch (ledgerErr: any) {
      // 账本写入失败不能影响主链路，仅记录
      console.warn("[api-select] 结算账本写入失败（已忽略）:", ledgerErr?.message || ledgerErr);
    }

    return NextResponse.json({
      ok: true,
      result: content,
      model,
      usedTokens: mainTokens.map((t) => t.title),
      depTokens: subTokens.map((t) => `${t.title}（${t.domain}）`),
      count: mainTokens.length,
      depCount: subTokens.length,
      cycle,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

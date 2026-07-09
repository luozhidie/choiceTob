import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI, extractJSON } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* 仅管理员可用（与现有后台统一：admin_logged_in cookie） */
function isAdminReq(req: NextRequest): boolean {
  const cookie = req.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

/* ============ GET：列出已保存的生产协同方案 ============ */
export async function GET(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  try {
    const supabase = await createClient();
    const { data, error } = await (supabase as any)
      .from("ai_production_orders")
      .select("id, title, season, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ records: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "服务异常" }, { status: 500 });
  }
}

/* ============ POST：生成生产协同方案并保存 ============ */
export async function POST(req: NextRequest) {
  if (!isAdminReq(req)) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      title,
      season,
      productDesc,
      targetPrice,
      quantity,
      fabricPref,
      craftPref,
      notes,
    } = body;

    if (!productDesc && !title) {
      return NextResponse.json({ error: "请填写商品描述或标题" }, { status: 400 });
    }

    const systemPrompt = `你是一位资深服装供应链生产协同专家，服务于服装批发/供应链平台「骆芷蝶智选」。你的任务是从商品企划/选品结论出发，生成一份可直接对接生产/采购落地的生产协同方案。

你必须严格按照以下 JSON 格式输出。输出时不要有任何额外文字、markdown 代码块标记或解释，直接在 |JSON_START| 和 |JSON_END| 标记之间输出纯 JSON：

|JSON_START|
{
  "summary": "生产协同概要（150字：推荐生产方式、核心策略、落地关键）",
  "recommendedApproach": {
    "mode": "自主生产/委外加工/贴牌OEM/小单快反",
    "reason": "选择该方式的理由（结合价格带、起订量、交期）"
  },
  "fabricCraft": [
    {"item": "面料/工艺项", "suggestion": "建议方案", "reason": "理由"}
  ],
  "costBreakdown": [
    {"item": "面料/工费/辅料/物流/管销", "unitCost": "单项成本(元)", "ratio": "占售价比"}
  ],
  "moqLeadTime": {
    "moq": "建议最小起订量",
    "leadTime": "生产周期(天)",
    "reorderPoint": "补货触发条件"
  },
  "supplierCriteria": [
    "供应商筛选标准1",
    "供应商筛选标准2"
  ],
  "riskWarnings": [
    {"risk": "风险描述", "level": "高/中/低", "mitigation": "应对方案"}
  ],
  "handoffChecklist": [
    {"step": "对接采购/供应商系统的步骤", "owner": "责任方(企划/买手/采购)", "note": "注意点"}
  ]
}
|JSON_END|`;

    const userPrompt = `请根据以下商品信息生成生产协同方案：

【商品信息】
- 标题：${title || "未命名商品"}
- 季节：${season || "未指定"}
- 商品描述/企划结论：${productDesc || "无"}
- 目标零售价：${targetPrice || "未指定"} 元
- 计划采购量：${quantity || "未指定"} 件
- 面料偏好：${fabricPref || "未指定"}
- 工艺偏好：${craftPref || "未指定"}
- 补充说明：${notes || "无"}

【要求】
1. recommendedApproach 要结合价格带与起订量给出明确生产方式建议
2. fabricCraft 列出 4-6 项关键面料/工艺决策
3. costBreakdown 各项成本合计应接近目标零售价的 30%-45%（批发毛利逻辑）
4. moqLeadTime 给出可执行的最小起订量与生产周期
5. supplierCriteria 给出 3-5 条供应商筛选标准
6. riskWarnings 列 3-5 个风险点与应对
7. handoffChecklist 给出从企划到采购/供应商系统的落地交接步骤`;

    const ai = await callAI({ system: systemPrompt, user: userPrompt, temperature: 0.6, maxTokens: 4000 });

    let result: any = null;
    if (ai.source === "ai") {
      result = extractJSON(ai.content);
    }
    if (!result) {
      result = {
        summary: "（示例）建议采用小单快反+委外加工模式，首单 50 件测款，7 天交付，验证动销后再追单。",
        recommendedApproach: { mode: "小单快反", reason: "价格带适中、起订量低、快速验证市场" },
        fabricCraft: [], costBreakdown: [], moqLeadTime: {}, supplierCriteria: [], riskWarnings: [], handoffChecklist: [],
      };
    }

    // 保存（service role 绕过 RLS）
    const supabase = await createClient();
    const { data: saved, error } = await (supabase as any)
      .from("ai_production_orders")
      .insert({
        title: title || "未命名商品",
        season: season || null,
        input_json: { productDesc, targetPrice, quantity, fabricPref, craftPref, notes },
        result_json: result,
        status: "generated",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message, source: ai.source, result }, { status: 500 });
    }

    return NextResponse.json({ source: ai.source, record: saved, result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "服务异常" }, { status: 500 });
  }
}

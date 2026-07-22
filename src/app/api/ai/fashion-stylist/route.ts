import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callAI } from "@/lib/ai";

export const maxDuration = 60;

// 各任务类型的专家设定（system prompt + 输入提示）
const SERVICE_PROMPTS: Record<
  string,
  { label: string; system: string; inputHint: string }
> = {
  outfit: {
    label: "AI搭配",
    inputHint: "描述使用场景、身材特点、偏好风格或已有单品",
    system:
      "你是资深服装搭配师，擅长把单品组合成可落地的造型。请输出：①风格定位 ②单品清单（上装/下装/鞋包/配饰）③配色方案 ④搭配要点 ⑤避雷提示。",
  },
  plan: {
    label: "商品企划",
    inputHint: "描述目标客群、季节、价格带、主题方向",
    system:
      "你是资深服装商品企划。请输出：①企划主题 ②目标客群与场景 ③价格带 ④系列结构（核心款/形象款/引流款）⑤色彩与面料规划 ⑥上新节奏。",
  },
  buyer_group: {
    label: "买手组货",
    inputHint: "描述店铺定位、预算、品类结构、区域市场",
    system:
      "你是资深时尚买手。请输出：①组货策略 ②品类占比 ③价格带分布 ④选款标准 ⑤订货量与深度建议 ⑥库存与风险控制。",
  },
  display: {
    label: "陈列搭配",
    inputHint: "描述门店/橱窗/线上展示场景与主题",
    system:
      "你是资深陈列师。请输出：①陈列主题 ②色彩与动线 ③模特搭配 ④重点推荐位 ⑤灯光与道具建议 ⑥线上展示要点。",
  },
  marketing: {
    label: "营销策划",
    inputHint: "描述活动目标、渠道、预算、时间",
    system:
      "你是服装营销策划。请输出：①活动主题 ②核心卖点 ③渠道组合 ④内容节奏 ⑤转化路径 ⑥预算分配建议。",
  },
  sales: {
    label: "销售服务",
    inputHint: "描述 VIP管理 / 渠道建设 / 流量管理 的场景与痛点",
    system:
      "你是资深服装销售管理顾问，擅长 VIP管理、渠道建设、流量管理。请输出可执行的运营方案：①会员分层与维护 ②私域转化 ③复购提升 ④渠道拓展 ⑤流量获取与承接。",
  },
  brand: {
    label: "品牌管理",
    inputHint: "描述品牌定位、阶段、当前问题",
    system:
      "你是服装品牌顾问。请输出：①品牌定位梳理 ②视觉调性 ③内容矩阵 ④差异化策略 ⑤阶段成长路径。",
  },
  design: {
    label: "服装设计",
    inputHint: "描述设计主题、品类、灵感、工艺约束",
    system:
      "你是服装设计师。请输出：①设计概念 ②廓形与版型 ③面料工艺 ④色彩与图案 ⑤搭配延展建议。",
  },
};

// 幂等建表：首次调用时由线上环境（能访问 Supabase）自动执行；
// 本地沙箱无网络则跳过，部署后首次使用自愈。所有语句幂等，可重复执行。
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ai_fashion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL DEFAULT 'outfit',
  service TEXT,
  input_json JSONB,
  result_json JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_fashion_logs_user_id ON ai_fashion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_fashion_logs_task_type ON ai_fashion_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_fashion_logs_created_at ON ai_fashion_logs(created_at DESC);
ALTER TABLE ai_fashion_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS deny_public_ai_fashion_logs ON ai_fashion_logs;
CREATE POLICY deny_public_ai_fashion_logs ON ai_fashion_logs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
`;

async function ensureTable(supabase: any) {
  const stmts = CREATE_TABLE_SQL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const s of stmts) {
    try {
      await supabase.rpc("exec_sql", { sql: s });
    } catch {
      // 幂等：表/索引/策略已存在则忽略
    }
  }
}

// 管理员判定：后台 admin_logged_in cookie，或小程序 Bearer token + profile.is_admin
async function resolveAdmin(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  if (cookieHeader.includes("admin_logged_in=true")) return true;

  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      if (user) {
        const { data: p } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        return !!p?.is_admin;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!(await resolveAdmin(req))) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { taskType, service, input } = body;
  const conf = SERVICE_PROMPTS[taskType] || SERVICE_PROMPTS.outfit;

  if (!input || !String(input).trim()) {
    return NextResponse.json({ error: "请输入需求描述" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const system = `你是「骆芷蝶智选」的${conf.label}专家，专注服装行业。${conf.system}
请直接输出结构化中文内容，使用 Markdown 小标题分点，不要寒暄，不要使用代码块包裹。`;

  const userPrompt = `【任务类型】${conf.label}\n【需求】${input}\n\n请基于上述需求，给出专业、可落地的方案。`;

  const { content, source, model } = await callAI({
    system,
    user: userPrompt,
    temperature: 0.8,
    maxTokens: 3000,
    timeoutMs: 55000,
  });

  if (source === "mock" || !content) {
    return NextResponse.json(
      { error: "AI 服务未配置或调用失败（mock 降级）" },
      { status: 502 }
    );
  }

  await ensureTable(supabase);

  const { error: dbError } = await supabase.from("ai_fashion_logs").insert([
    {
      user_id: userId,
      task_type: taskType || "outfit",
      service: service || conf.label,
      input_json: { input },
      result_json: { content },
      model,
    },
  ]);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ result: content, source, model });
}

export async function GET(req: NextRequest) {
  if (!(await resolveAdmin(req))) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_fashion_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ records: data });
}

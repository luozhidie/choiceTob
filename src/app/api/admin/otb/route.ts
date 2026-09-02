// 管理员 API：OTB 采购额度测算
// 公式（已内置为数据库生成列 otb_amount，传 6 个入参即自动出结果）：
//   OTB = 期初存货额 + 计划销售额 − 期末目标存货额 − 计划内补货额 + 计划期末降价额 − 已采购额
// GET          列出历史测算
// POST         新建测算（otb_amount 不用传，自动算）
// DELETE ?id=  删除
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

async function withClient<T>(fn: (s: ReturnType<typeof createClient>) => Promise<T>): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      return await fn(createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY));
    } catch {}
  }
  return await fn(createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE));
}

// otb_amount 是生成列，不允许外部写入
const ALLOWED = [
  "season_code",
  "opening_inventory_amount",
  "planned_sales_amount",
  "closing_target_inventory",
  "planned_replenishment",
  "planned_markdown",
  "committed_purchase",
  "note",
];

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const { data, error } = await withClient((s) =>
      s.from("otb_plans").select("*").order("created_at", { ascending: false })
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    const payload: Record<string, any> = {};
    for (const k of ALLOWED) if (body[k] !== undefined) payload[k] = body[k];

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "没有可写入的字段" }, { status: 400 });
    }

    const { data, error } = await withClient((s) =>
      s.from("otb_plans").insert(payload).select("*").single()
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "创建失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const { error } = await withClient((s) => s.from("otb_plans").delete().eq("id", id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "删除失败" }, { status: 500 });
  }
}

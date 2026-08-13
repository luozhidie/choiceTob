// 平台结算管理 - 使用 service_role 绕过 RLS
// 支持：列表(GET) / 新建(POST) / 更新(PUT，标记结算)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DDL = `
CREATE TABLE IF NOT EXISTS platform_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid,
  creator_name text,
  period text,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY 环境变量");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function ensureTable(supabase: any) {
  try {
    await supabase.rpc("exec_sql", { sql: DDL });
  } catch {
    /* 忽略 */
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const supabase = getServiceRoleClient();
    await ensureTable(supabase);
    const { data, error } = await supabase
      .from("platform_settlements")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    const creator_name = (body.creator_name || "").trim();
    if (!creator_name) return NextResponse.json({ error: "创作者名称必填" }, { status: 400 });
    const supabase = getServiceRoleClient();
    await ensureTable(supabase);
    const { data, error } = await supabase
      .from("platform_settlements")
      .insert({
        creator_id: body.creator_id || null,
        creator_name,
        period: body.period || null,
        amount: Number(body.amount) || 0,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    const supabase = getServiceRoleClient();
    const patch: any = {};
    if (body.creator_name !== undefined) patch.creator_name = body.creator_name;
    if (body.period !== undefined) patch.period = body.period;
    if (body.amount !== undefined) patch.amount = Number(body.amount) || 0;
    if (body.status !== undefined) {
      patch.status = body.status;
      if (body.status === "settled") patch.settled_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from("platform_settlements").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

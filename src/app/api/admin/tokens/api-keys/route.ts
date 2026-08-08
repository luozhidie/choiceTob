// API 密钥管理 - 使用 service_role 绕过 RLS
// 支持：列表(GET) / 新建(POST) / 删除(DELETE)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DDL = `
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL,
  api_key text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
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
    /* 表已存在或非 Postgres 函数型 RPC，忽略 */
  }
}

function maskKey(k?: string) {
  if (!k) return "";
  if (k.length <= 8) return "****";
  return k.slice(0, 4) + "****" + k.slice(-4);
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const supabase = getServiceRoleClient();
    await ensureTable(supabase);
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const masked = (data || []).map((r: any) => ({ ...r, api_key: maskKey(r.api_key) }));
    return NextResponse.json({ ok: true, data: masked });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    const name = (body.name || "").trim();
    const provider = (body.provider || "").trim();
    const api_key = (body.api_key || "").trim();
    if (!name || !provider || !api_key)
      return NextResponse.json({ error: "名称 / 供应商 / 密钥均为必填" }, { status: 400 });
    const supabase = getServiceRoleClient();
    await ensureTable(supabase);
    const { data, error } = await supabase
      .from("api_keys")
      .insert({ name, provider, api_key, status: body.status || "active" })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data: { ...data, api_key: maskKey(data.api_key) } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("api_keys").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

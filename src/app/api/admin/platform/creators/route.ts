// 平台创作者管理 - 使用 service_role 绕过 RLS
// 支持：列表(GET) / 新建(POST) / 更新(PUT) / 删除(DELETE)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DDL = `
CREATE TABLE IF NOT EXISTS platform_creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text,
  contact text,
  followers integer DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'active',
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
      .from("platform_creators")
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
    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "创作者名称必填" }, { status: 400 });
    const supabase = getServiceRoleClient();
    await ensureTable(supabase);
    const { data, error } = await supabase
      .from("platform_creators")
      .insert({
        name,
        platform: body.platform || null,
        contact: body.contact || null,
        followers: Number(body.followers) || 0,
        notes: body.notes || null,
        status: body.status || "active",
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
    for (const k of ["name", "platform", "contact", "followers", "notes", "status"]) {
      if (body[k] !== undefined) patch[k] = k === "followers" ? Number(body[k]) || 0 : body[k];
    }
    const { data, error } = await supabase.from("platform_creators").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
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
    const { error } = await supabase.from("platform_creators").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

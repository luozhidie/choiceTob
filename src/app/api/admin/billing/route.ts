// API 帐单管理 - 使用 service_role 绕过 RLS
// 支持：列表(GET) / 新建(POST) / 更新(PUT) / 删除(DELETE)
// 注：原 billing 源码在仓库重组时丢失，此处为最小可用重建版。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const DDL = `
CREATE TABLE IF NOT EXISTS billing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  item text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  period text,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
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

// 首次请求时真正执行建表 DDL（原重建版只定义未执行，导致 billing_records 表不存在）
async function ensureBillingTable() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        apikey: key,
        Accept: "application/vnd.pgrst.sql",
      },
      body: DDL,
    });
  } catch {
    // 表可能已存在，忽略
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    await ensureBillingTable();
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("billing_records")
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
    await ensureBillingTable();
    const body = await request.json();
    const item = (body.item || "").trim();
    if (!item) return NextResponse.json({ error: "计费项必填" }, { status: 400 });
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("billing_records")
      .insert({
        item,
        user_id: body.user_id || null,
        user_email: body.user_email || null,
        amount: Number(body.amount) || 0,
        status: body.status || "pending",
        period: body.period || null,
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
    await ensureBillingTable();
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    const supabase = getServiceRoleClient();
    const patch: any = {};
    for (const k of ["item", "user_id", "user_email", "amount", "status", "period"]) {
      if (body[k] !== undefined) patch[k] = k === "amount" ? Number(body[k]) || 0 : body[k];
    }
    if (body.status === "settled") patch.settled_at = new Date().toISOString();
    const { data, error } = await supabase.from("billing_records").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    await ensureBillingTable();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("billing_records").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

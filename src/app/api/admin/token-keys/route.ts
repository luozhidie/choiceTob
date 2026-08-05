// API 密钥管理 API（管理端，需 admin 登录）
// 支持：列表(GET) / 生成(POST) / 改名或停用启用(PUT) / 软删除(DELETE)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("token_api_keys")
      .select("*")
      .is("deleted_at", null)
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
    const name = (body.name || "").trim() || "未命名密钥";
    const apiKey = "tk_" + crypto.randomBytes(16).toString("hex");
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("token_api_keys")
      .insert({ api_key: apiKey, name, owner: body.owner || "骆芷蝶", status: "active" })
      .select()
      .single();
    if (error) throw error;
    // 完整 key 仅此返回一次
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    const patch: any = {};
    if (typeof body.status === "string" && ["active", "disabled"].includes(body.status)) patch.status = body.status;
    if (typeof body.name === "string") patch.name = body.name;
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "无有效字段" }, { status: 400 });
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.from("token_api_keys").update(patch).eq("id", body.id).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from("token_api_keys").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

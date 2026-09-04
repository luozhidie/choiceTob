// app/api/admin/agent-profiles/route.ts
// 后台：代理人资料列表与编辑
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function checkAdmin(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

const SELECT_FIELDS =
  "id, nickname, agent_store_name, full_name, avatar_url, phone, wechat, email, role, membership_type, bio, created_at";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!checkAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const supabase = getServiceRoleClient();
    const q = (request.nextUrl.searchParams.get("q") || "").trim();

    let query = supabase
      .from("profiles")
      .select(SELECT_FIELDS)
      .order("created_at", { ascending: false })
      .limit(200);

    if (q) {
      const like = `%${q}%`;
      query = query.or(
        `nickname.ilike.${like},full_name.ilike.${like},agent_store_name.ilike.${like},phone.ilike.${like},email.ilike.${like},wechat.ilike.${like}`
      );
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ list: data || [] });
  } catch (err: any) {
    console.error("[admin/agent-profiles GET]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!checkAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const supabase = getServiceRoleClient();
    const body = await request.json();
    const { id, fields } = body || {};
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    const allowed: Record<string, any> = {};
    if (fields && typeof fields === "object") {
      if (typeof fields.nickname === "string") {
        const v = fields.nickname.trim();
        if (v) allowed.nickname = v.slice(0, 30);
      }
      if (typeof fields.agent_store_name === "string") allowed.agent_store_name = fields.agent_store_name.trim().slice(0, 60);
      if (typeof fields.phone === "string") allowed.phone = fields.phone.trim().slice(0, 20);
      if (typeof fields.wechat === "string") allowed.wechat = fields.wechat.trim().slice(0, 40);
      if (typeof fields.bio === "string") allowed.bio = fields.bio.trim().slice(0, 200);
      if (typeof fields.avatar_url === "string") allowed.avatar_url = fields.avatar_url.trim().slice(0, 500);
    }

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: "无有效字段" }, { status: 400 });
    }

    const { error } = await supabase.from("profiles").update(allowed).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin/agent-profiles PUT]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!checkAdmin(request)) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }
    const supabase = getServiceRoleClient();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });

    // 禁止删除管理员自身（避免把自己锁在后台外）
    const { data: target } = await supabase
      .from("profiles")
      .select("role, email")
      .eq("id", id)
      .maybeSingle();
    if (target?.role === "admin" || target?.email === "luozhidie@live.cn") {
      return NextResponse.json({ error: "不能删除管理员账号" }, { status: 403 });
    }

    // 同步删除 profiles 行与 auth 用户
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", id);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      console.error("[admin/agent-profiles DELETE] auth delete failed", authError);
      // profile 已删，auth 失败也返回成功但提示
      return NextResponse.json({ success: true, warning: "资料已删除，但 Auth 用户未清理" });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[admin/agent-profiles DELETE]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

// app/api/admin/banners/route.ts
// 轮播图管理 API - 使用 service_role 绕过 RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 验证管理员 cookie
async function verifyAdmin(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

// GET - 获取轮播图列表
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("site_assets")
    .select("*")
    .like("key", "hero_banner%")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST - 新增轮播图
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const body = await request.json();
  const { data, error } = await supabase
    .from("site_assets")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PUT - 更新轮播图
export async function PUT(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { id, ...updates } = await request.json();
  const { data, error } = await supabase
    .from("site_assets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE - 删除轮播图
export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) return NextResponse.json({ error: "缺少id" }, { status: 400 });

  const { error } = await supabase
    .from("site_assets")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

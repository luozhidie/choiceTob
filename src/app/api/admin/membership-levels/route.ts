// ============================================================
// 会员等级配置 API：/api/admin/membership-levels
// GET 列表 / POST 新增 / PUT 修改 / DELETE 删除
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function authAdmin(request: NextRequest) {
  const cookie = request.cookies.get("admin_logged_in")?.value;
  if (cookie !== "true") {
    return { ok: false, response: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  return { ok: true };
}

// GET /api/admin/membership-levels
export async function GET(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");  // price / deposit

  let query = supabase
    .from("membership_levels")
    .select("*")
    .order("sort_order", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

// POST 新增等级
export async function POST(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const { data, error } = await supabase
      .from("membership_levels")
      .insert(body)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT 修改等级
export async function PUT(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id必填" }, { status: 400 });

    const { data, error } = await supabase
      .from("membership_levels")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE 删除等级
export async function DELETE(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id必填" }, { status: 400 });

  const { error } = await supabase
    .from("membership_levels")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

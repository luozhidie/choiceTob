// ============================================================
// 红包管理 API：/api/admin/red-packets
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

// GET /api/admin/red-packets
export async function GET(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = searchParams.get("status");
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("red_packets")
    .select(`
      id, user_id, title, amount, status, expire_at, packet_type, created_at,
      profiles:user_id ( full_name, email )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

// POST 新增/批量发放红包
export async function POST(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const {
      user_id,
      title,
      amount,            // 分单位
      packet_type = "general",
      expire_days = 30,
      batch_send = false,
    } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: "标题和金额必填" }, { status: 400 });
    }

    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + expire_days);

    // 单个用户
    if (user_id && !batch_send) {
      const { data, error } = await supabase
        .from("red_packets")
        .insert({
          user_id,
          title,
          amount: Number(amount),
          packet_type,
          expire_at: expireAt.toISOString().split("T")[0],
          status: "unused",
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }

    // 批量发放
    if (batch_send) {
      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id");

      if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
      if (!users || users.length === 0) {
        return NextResponse.json({ error: "没有用户可发放" }, { status: 400 });
      }

      const insertData = users.map((u: any) => ({
        user_id: u.id,
        title,
        amount: Number(amount),
        packet_type,
        expire_at: expireAt.toISOString().split("T")[0],
        status: "unused",
      }));

      const { data, error } = await supabase
        .from("red_packets")
        .insert(insertData)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: data?.length || 0 });
    }

    return NextResponse.json({ error: "请指定用户或选择批量发放" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT 修改
export async function PUT(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id必填" }, { status: 400 });

    const { data, error } = await supabase
      .from("red_packets")
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

// DELETE 删除
export async function DELETE(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id必填" }, { status: 400 });

  const { error } = await supabase
    .from("red_packets")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

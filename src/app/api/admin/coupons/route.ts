// ============================================================
// 优惠券管理 API：/api/admin/coupons
// GET 列表 / POST 新增 / PUT 修改 / DELETE 删除
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 验证管理员登录（通过 admin_logged_in cookie）
async function authAdmin(request: NextRequest): Promise<{ ok: boolean; response?: NextResponse }> {
  const cookie = request.cookies.get("admin_logged_in")?.value;
  if (cookie !== "true") {
    return { ok: false, response: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  return { ok: true };
}

// GET /api/admin/coupons?page=1&status=unused&keyword=xxx
export async function GET(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = searchParams.get("status");
  const keyword = searchParams.get("keyword");
  const userId = searchParams.get("user_id");
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("coupons")
    .select(
      "id, user_id, title, discount_desc, min_amount, discount_amount, status, expire_at, coupon_type, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status && status !== "all") query = query.eq("status", status);
  if (userId) query = query.eq("user_id", userId);
  if (keyword) query = query.ilike("title", `%${keyword}%`);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 手动补齐用户信息，避免 Supabase schema cache 关联失败
  const userIds = [...new Set((data || []).map((c: any) => c.user_id).filter(Boolean))];
  const profileMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", userIds);
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
  }

  const rows = (data || []).map((c: any) => ({ ...c, profiles: profileMap[c.user_id] || null }));

  return NextResponse.json({
    data: rows,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
}

// POST /api/admin/coupons 新增优惠券（可批量发放）
export async function POST(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const {
      user_id,           // 指定用户ID，不传则发给所有用户（批量）
      title,
      discount_desc,
      min_amount = 0,
      discount_amount,
      coupon_type = "general",
      expire_days = 30,   // 30天后过期
      batch_send = false,  // 是否批量发放
      quantity = 1,        // 每人发放张数
    } = body;

    if (!title || !discount_amount) {
      return NextResponse.json({ error: "标题和抵扣金额必填" }, { status: 400 });
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const expireAt = new Date();
    expireAt.setDate(expireAt.getDate() + expire_days);
    const expireStr = expireAt.toISOString().split("T")[0];

    const buildRow = (uid: string) => ({
      user_id: uid,
      title,
      discount_desc,
      min_amount: Number(min_amount),
      discount_amount: Number(discount_amount),
      coupon_type,
      expire_at: expireStr,
      status: "unused",
    });

    // 指定单个用户
    if (user_id && !batch_send) {
      const rows = Array.from({ length: qty }, () => buildRow(user_id));
      const { data, error } = await supabase
        .from("coupons")
        .insert(rows)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: data?.length || 0 });
    }

    // 批量发放：发给所有用户
    if (batch_send) {
      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id");

      if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

      if (!users || users.length === 0) {
        return NextResponse.json({ error: "没有用户可发放" }, { status: 400 });
      }

      const rows: any[] = [];
      users.forEach((u: any) => {
        for (let i = 0; i < qty; i++) rows.push(buildRow(u.id));
      });

      const { data, error } = await supabase
        .from("coupons")
        .insert(rows)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, count: data?.length || 0 });
    }

    return NextResponse.json({ error: "请指定用户或选择批量发放" }, { status: 400 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/admin/coupons 修改
export async function PUT(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "id必填" }, { status: 400 });

    const { data, error } = await supabase
      .from("coupons")
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

// DELETE /api/admin/coupons?id=xxx
export async function DELETE(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id必填" }, { status: 400 });

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

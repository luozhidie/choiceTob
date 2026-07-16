// ============================================================
// 可领取优惠券模板管理 API：/api/admin/coupon-templates
// GET 列表（含未启用）/ POST 新增 / PUT 修改 / DELETE 删除
// 仅管理员可访问（admin_logged_in cookie）
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function authAdmin(request: NextRequest): Promise<{ ok: boolean; response?: NextResponse }> {
  const cookie = request.cookies.get("admin_logged_in")?.value;
  if (cookie !== "true") {
    return { ok: false, response: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  return { ok: true };
}

// GET /api/admin/coupon-templates 列出全部模板（含未启用），按创建顺序
export async function GET(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { data, error } = await supabase
    .from("coupon_templates")
    .select(
      "id, title, discount_desc, min_amount, discount_amount, coupon_type, valid_days, per_user_limit, total_limit, claimed_count, is_active, created_at"
    )
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/admin/coupon-templates 新增模板
export async function POST(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const {
      title,
      discount_desc = "",
      min_amount = 0,
      discount_amount = 0,
      coupon_type = "general",
      valid_days = 30,
      per_user_limit = 1,
      total_limit = 0,
      is_active = true,
    } = body;

    if (!title || !discount_amount) {
      return NextResponse.json({ error: "标题和抵扣金额必填" }, { status: 400 });
    }
    // coupon_type 受 CHECK 约束：general / vip_gift / festival / invite_reward
    const allowed = ["general", "vip_gift", "festival", "invite_reward"];
    if (!allowed.includes(coupon_type)) {
      return NextResponse.json({ error: "优惠券类型不合法" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("coupon_templates")
      .insert({
        title,
        discount_desc,
        min_amount: Number(min_amount) || 0,
        discount_amount: Number(discount_amount) || 0,
        coupon_type,
        valid_days: Number(valid_days) || 30,
        per_user_limit: Number(per_user_limit) || 1,
        total_limit: Number(total_limit) || 0,
        is_active: is_active !== false,
        claimed_count: 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT /api/admin/coupon-templates 修改（含启用/停用）
export async function PUT(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "id必填" }, { status: 400 });

    const clean: any = {};
    if (updates.title !== undefined) clean.title = updates.title;
    if (updates.discount_desc !== undefined) clean.discount_desc = updates.discount_desc;
    if (updates.min_amount !== undefined) clean.min_amount = Number(updates.min_amount) || 0;
    if (updates.discount_amount !== undefined) clean.discount_amount = Number(updates.discount_amount) || 0;
    if (updates.coupon_type !== undefined) clean.coupon_type = updates.coupon_type;
    if (updates.valid_days !== undefined) clean.valid_days = Number(updates.valid_days) || 30;
    if (updates.per_user_limit !== undefined) clean.per_user_limit = Number(updates.per_user_limit) || 1;
    if (updates.total_limit !== undefined) clean.total_limit = Number(updates.total_limit) || 0;
    if (updates.is_active !== undefined) clean.is_active = !!updates.is_active;

    const { data, error } = await supabase
      .from("coupon_templates")
      .update(clean)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/admin/coupon-templates?id=xxx
export async function DELETE(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id必填" }, { status: 400 });

  const { error } = await supabase.from("coupon_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

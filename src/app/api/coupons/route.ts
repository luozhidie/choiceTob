// ============================================================
// 用户端优惠券 API：/api/coupons
// GET 查看我的优惠券
// POST 使用优惠券（变更状态为 used）
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/coupons?user_id=xxx&status=unused
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  const status = searchParams.get("status");

  if (!userId) {
    return NextResponse.json({ error: "user_id必填" }, { status: 400 });
  }

  let query = supabase
    .from("coupons")
    .select("id, title, discount_desc, min_amount, discount_amount, status, expire_at, coupon_type, created_at, template_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // 自动过期：把所有 expire_at < today 且 status=unused 的改为 expired
  await supabase
    .from("coupons")
    .update({ status: "expired" })
    .eq("user_id", userId)
    .eq("status", "unused")
    .lt("expire_at", new Date().toISOString().split("T")[0]);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

// POST /api/coupons/use 使用优惠券
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coupon_id, user_id } = body;

    if (!coupon_id || !user_id) {
      return NextResponse.json({ error: "coupon_id和user_id必填" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("coupons")
      .update({ status: "used" })
      .eq("id", coupon_id)
      .eq("user_id", user_id)
      .eq("status", "unused")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "优惠券不存在或已使用" }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

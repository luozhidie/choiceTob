// ============================================================
// 可领取优惠券模板 API：/api/coupons/templates
// GET 列出当前可领的模板（is_active=true）
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("coupon_templates")
      .select(
        "id, title, discount_desc, min_amount, discount_amount, coupon_type, valid_days, per_user_limit, total_limit, claimed_count"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

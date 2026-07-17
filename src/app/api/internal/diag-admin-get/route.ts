import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  if (req.headers.get("x-task-token") !== "lzd-diag-admin-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }

  // 完全复现后台 admin GET 的查询（含 profiles 关联）
  const { data: joined, error: joinedErr, count: joinedCount } = await supabase
    .from("coupons")
    .select(
      "id, user_id, title, discount_desc, min_amount, discount_amount, status, expire_at, coupon_type, created_at, profiles:user_id ( full_name, email, phone )",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(0, 19);

  // 对比：不带关联查询
  const { data: simple, error: simpleErr, count: simpleCount } = await supabase
    .from("coupons")
    .select("id, user_id, title, status, expire_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(0, 19);

  return NextResponse.json({
    joined: { count: joinedCount, error: joinedErr?.message || null, row_count: joined?.length || 0 },
    simple: { count: simpleCount, error: simpleErr?.message || null, row_count: simple?.length || 0 },
  });
}

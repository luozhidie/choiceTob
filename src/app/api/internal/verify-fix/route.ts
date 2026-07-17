import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  if (req.headers.get("x-task-token") !== "lzd-verify-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 401 });
  }

  // 复现修复后的 coupons GET（两段式）
  const from = 0, to = 19;
  let query = supabase
    .from("coupons")
    .select("id, user_id, title, discount_desc, min_amount, discount_amount, status, expire_at, coupon_type, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ step: "coupons", error: error.message });

  const userIds = [...new Set((data || []).map((c: any) => c.user_id).filter(Boolean))];
  const profileMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profiles, error: pe } = await supabase
      .from("profiles").select("id, full_name, email, phone").in("id", userIds);
    if (pe) return NextResponse.json({ step: "profiles", error: pe.message });
    (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
  }
  const rows = (data || []).map((c: any) => ({ ...c, profiles: profileMap[c.user_id] || null }));

  return NextResponse.json({
    ok: true,
    count,
    row_count: rows.length,
    sample: rows.slice(0, 3).map((r: any) => ({
      title: r.title,
      user: r.profiles ? (r.profiles.full_name || r.profiles.email || r.profiles.phone) : "(无用户信息)",
    })),
  });
}

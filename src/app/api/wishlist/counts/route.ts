// 后台心愿数统计：返回 { [product_id]: wish_count }
// 仅管理员可访问（admin_logged_in cookie）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie.includes("admin_logged_in=true")) {
    return NextResponse.json({ success: false, error: "未授权" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 视图 product_wish_counts 已聚合好每个商品的心愿数
  const { data, error } = await supabase.from("product_wish_counts").select("product_id, wish_count");
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const map: Record<string, number> = {};
  (data || []).forEach((r: any) => { map[r.product_id] = r.wish_count; });
  return NextResponse.json({ success: true, counts: map });
}

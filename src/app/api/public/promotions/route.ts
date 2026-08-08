// 公开 API：读取营销活动（type=series 返回当前生效的系列/专题）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";
  const limit = parseInt(searchParams.get("limit") || "10");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
  const supabase = createClient(url, key);

  let query = supabase
    .from("promotions")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (type !== "all") query = query.eq("promo_type", type);

  const { data, error } = await query;
  if (error) {
    if (error.code === "42P01" || error.message?.includes("does not exist")) {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: data || [] });
}

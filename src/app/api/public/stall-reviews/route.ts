// 公开 API：获取档口评价列表
// 优先用 service_role_key 绕过 RLS，缺失时降级 anon/publishable
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// 正确的 publishable key（公开安全，作为环境变量缺失时的兜底）
const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

async function fetchReviews(supabase: ReturnType<typeof createClient>, stall_id: string, limit: number) {
  const { data, error } = await supabase
    .from("stall_reviews")
    .select("*")
    .eq("stall_id", stall_id)
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data, error };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const stall_id = searchParams.get("stall_id");
  const limit = parseInt(searchParams.get("limit") || "10");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (!stall_id) {
    return NextResponse.json({ error: "缺少 stall_id" }, { status: 400 });
  }

  // 方式1: service_role_key
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await fetchReviews(supabase, stall_id, limit);
      if (!error) return NextResponse.json({ success: true, data: data || [] });
    } catch {}
  }

  // 方式2: 降级 publishable key
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const { data, error } = await fetchReviews(supabase, stall_id, limit);
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, data: [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || [] });
  } catch {}

  return NextResponse.json({ success: true, data: [] });
}

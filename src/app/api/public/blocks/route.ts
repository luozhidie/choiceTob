import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// 正确的 publishable key（公开安全，作为环境变量缺失时的兜底）
const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

async function fetchBlocks(supabase: ReturnType<typeof createClient>, id?: string | null) {
  if (id) {
    const { data, error } = await supabase
      .from("page_blocks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return { data, error };
  }
  const { data, error } = await supabase
    .from("page_blocks")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return { data, error };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // 方式1: service_role_key（必须从环境变量读取）
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await fetchBlocks(supabase, id);
      if (!error) return NextResponse.json({ success: true, data: data || (id ? null : []) });
    } catch {}
  }

  // 方式2: 降级到 publishable key（可以硬编码）
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const { data, error } = await fetchBlocks(supabase, id);
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ success: true, data: id ? null : [] });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || (id ? null : []) });
  } catch {}

  return NextResponse.json({ success: true, data: id ? null : [] });
}

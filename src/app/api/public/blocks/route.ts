// 公开 API：获取已发布版块（前台首页使用）
// 优先用 service_role_key 绕过 RLS，失败时降级到 anon key
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

async function fetchBlocks(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("page_blocks")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return { data, error };
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // 方式1: 尝试 service_role_key（绕过 RLS）
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await fetchBlocks(supabase);
      if (!error) return NextResponse.json({ success: true, data: data || [] });
      // service role 查询失败，继续尝试 anon key
    } catch {}
  }

  // 方式2: 降级到 anon key
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data, error } = await fetchBlocks(supabase);
      if (error) {
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          return NextResponse.json({ success: true, data: [] });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: data || [] });
    } catch {}
  }

  // 都失败则返回空数组
  return NextResponse.json({ success: true, data: [] });
}

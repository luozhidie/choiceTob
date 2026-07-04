import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GET /api/public/banners
// 返回已启用的轮播图列表（按 sort_order 排序）
export async function GET(request: NextRequest) {
  const { data, error } = await supabase
    .from("site_assets")
    .select("id, key, image_url, link_url, title, subtitle, sort_order")
    .like("key", "hero_banner%")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 过滤掉无图片的条目，统一字段名
  const valid = (data || [])
    .filter((b: any) => b.image_url)
    .map((b: any) => ({
      id: b.id,
      image: b.image_url,   // 小程序端用 item.image
      link_url: b.link_url,
      title: b.title,
      subtitle: b.subtitle,
    }));
  return NextResponse.json(valid);
}

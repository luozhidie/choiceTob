// 公开 API：获取站点资源（Hero背景图等）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keysParam = searchParams.get("keys") || "";
    const keys = keysParam.split(",").filter(Boolean);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (keys.length > 0) {
      // 批量查询指定 key
      const { data, error } = await supabase
        .from("site_assets")
        .select("key, image_url, value")
        .in("key", keys);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const map: Record<string, string> = {};
      (data || []).forEach((item: any) => {
        map[item.key] = item.image_url || item.value || "";
      });
      return NextResponse.json({ success: true, data: map });
    }

    // 返回所有（限制数量）
    const { data, error } = await supabase
      .from("site_assets")
      .select("key, image_url, value")
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

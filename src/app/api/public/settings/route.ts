// 公开 API：读取活动配置（site_settings），供小程序/网站渲染，不写死
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const { searchParams } = new URL(request.url);
    const keys = (searchParams.get("keys") || "").split(",").filter(Boolean);
    if (keys.length === 0) return NextResponse.json({ success: true, data: {} });

    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", keys);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const map: Record<string, any> = {};
    (data || []).forEach((r: any) => { map[r.key] = r.value; });
    return NextResponse.json({ success: true, data: map });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

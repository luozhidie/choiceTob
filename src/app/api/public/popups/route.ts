// 公开 API：获取首页弹窗（已发布 + 在有效期内）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';


function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("缺少 Supabase 配置");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("popups")
      .select("id, title, keywords, image_url, link_url, show_on_home")
      .eq("is_published", true)
      .eq("show_on_home", true)
      .or(`start_at.is.null,start_at.lte.${now}`)
      .or(`end_at.is.null,end_at.gte.${now}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === "42P01") return NextResponse.json({ success: true, data: null });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("[弹窗API]", err);
    return NextResponse.json({ success: true, data: null });
  }
}

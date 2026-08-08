// 后台 API：写入活动配置（site_settings），仅管理员
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未登录或无权限" }, { status: 401 });
    }
    const body = await request.json().catch(() => ({}));
    const { key, value } = body;
    if (!key || value === undefined || value === null) {
      return NextResponse.json({ error: "缺少 key 或 value" }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

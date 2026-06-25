// 后端删除商品API（绕过RLS）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // 验证管理员cookie
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { id, table } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "缺少商品ID" }, { status: 400 });
    }

    // 用Service Role Key绕过RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const tableName = table || "products";
    const { error } = await supabase.from(tableName).delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[删除商品API错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

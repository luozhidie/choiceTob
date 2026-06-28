// 后端创建商品API（绕过RLS）- 使用 service_role
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const payload = await request.json();
    if (!payload.title || !payload.price) {
      return NextResponse.json({ error: "缺少必填字段：标题和价格" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data, error } = await supabase.from("products").insert([payload]).select().single();

    if (error) {
      console.error("[创建商品API错误]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: data });
  } catch (err: any) {
    console.error("[创建商品API错误]", err);
    return NextResponse.json({ error: err.message || "服务器内部错误" }, { status: 500 });
  }
}

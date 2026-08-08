// 商品批量更新 API（service_role 绕过 RLS）
// 用途：批量修改多个商品的分类（待分类 → 指定分类）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { ids, data } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0 || !data) {
      return NextResponse.json({ error: "缺少 ids 或 data" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase
      .from("products")
      .update(data)
      .in("id", ids);

    if (error) throw error;

    return NextResponse.json({ success: true, updated: ids.length });
  } catch (err: any) {
    console.error("[批量更新API错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

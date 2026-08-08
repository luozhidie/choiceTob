// 后端一键清空全部门店（绕过 RLS，软删除）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("crm_stores")
      .update({ deleted_at: now })
      .is("deleted_at", null)
      .select("id");

    if (error) throw error;

    return NextResponse.json({ success: true, count: data?.length || 0 });
  } catch (err: any) {
    console.error("[清空全部门店API错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 销售服务后台管理 API（service_role 绕过 RLS）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 列出店铺 + 已保存方案
export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    const { data: stores } = await supabase
      .from("stores")
      .select("id, name, business_goals")
      .order("name");
    const { data: plans } = await supabase
      .from("sales_services")
      .select("*")
      .not("ai_report", "is", null)
      .order("created_at", { ascending: false })
      .limit(20);
    return NextResponse.json({ stores: stores || [], plans: plans || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: 保存生成的方案
export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { error } = await supabase.from("sales_services").insert([body]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

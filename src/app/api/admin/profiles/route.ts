import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function authAdmin(request: NextRequest) {
  const cookie = request.cookies.get("admin_logged_in")?.value;
  if (cookie !== "true") {
    return { ok: false, response: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  return { ok: true };
}

// GET /api/admin/profiles 后台获取用户列表（用于发放对象下拉）
export async function GET(req: NextRequest) {
  const auth = await authAdmin(req);
  if (!auth.ok) return auth.response!;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

// 认证店铺数据 API（service_role 绕过 RLS，用于后台店铺管理数据积累）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 列出所有认证店主
export async function GET(request: NextRequest) {
  const cookie = request.headers.get("cookie") || "";
  if (!cookie.includes("admin_logged_in=true")) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    // 读取认证数据表（含关联用户邮箱）
    const { data, error } = await supabase
      .from("store_owner_certifications")
      .select("*")
      .order("certified_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    // 补充用户信息
    const results = [];
    for (const row of data || []) {
      let email = "";
      try {
        const { data: u } = await supabase.auth.admin.getUserById(row.user_id);
        email = u?.user?.email || "";
      } catch {}
      results.push({ ...row, user_email: email });
    }

    // 同时读取 profiles 中的认证字段（用于交叉验证）
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, store_owner_certified, certified_at, certified_style, certified_monthly_sales")
      .eq("store_owner_certified", true)
      .order("certified_at", { ascending: false });

    return NextResponse.json({
      certifications: results,
      certified_profiles: profiles || [],
      total: (data || []).length,
    });
  } catch (err: any) {
    console.error("[CertifiedStores API Error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

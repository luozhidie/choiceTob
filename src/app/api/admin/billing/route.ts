// 管理端：计费订单 + 收入合计 + 预付费 key 额度使用（需 admin 登录）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function verifyAdmin(request: NextRequest): boolean {
  const cookie = request.headers.get("cookie") || "";
  return cookie.includes("admin_logged_in=true");
}

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyAdmin(request)) return NextResponse.json({ error: "未授权" }, { status: 401 });
    const supabase = getServiceRoleClient();

    const { data: orders, error } = await supabase
      .from("token_orders")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;

    const { data: keys } = await supabase
      .from("token_api_keys")
      .select("id, api_key, name, owner, status, credit_balance, credit_used, usage_count")
      .is("deleted_at", null);

    const paid = (orders || []).filter((o: any) => o.status === "paid");
    const revenueCents = paid.reduce((s: number, o: any) => s + (o.amount || 0), 0);

    return NextResponse.json({
      ok: true,
      orders: orders || [],
      keys: (keys || []).filter((k: any) => k.credit_balance !== null && k.credit_balance !== undefined),
      revenueCents,
      currency: "usd",
      counts: {
        total: (orders || []).length,
        paid: paid.length,
        pending: (orders || []).filter((o: any) => o.status === "pending").length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "未知错误" }, { status: 500 });
  }
}

// 查询当前代理/预存货款身份状态
// 参数：?openid=xxx
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("服务器配置错误：缺少 SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const openid = searchParams.get("openid");
    if (!openid) {
      return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // 查最近一笔充值记录
    const { data: rec } = await supabase
      .from("agent_recharges")
      .select("plan_id, amount, deposit_amount, status, paid_at, discount_rate, return_rate")
      .eq("openid", openid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // 查已关联的 profile
    const { data: byWechat } = await supabase
      .from("profiles")
      .select("id, membership_type, deposit_amount, deposit_discount_rate, deposit_return_rate")
      .eq("wechat_openid", openid)
      .maybeSingle();
    const { data: byWx } = await supabase
      .from("profiles")
      .select("id, membership_type, deposit_amount, deposit_discount_rate, deposit_return_rate")
      .eq("wx_openid", openid)
      .maybeSingle();

    const profile = byWechat || byWx;
    const isActive = profile?.membership_type === "deposit_discount" && (profile?.deposit_amount || 0) > 0;

    return NextResponse.json({
      active: isActive,
      openid,
      user_id: profile?.id || null,
      membershipType: profile?.membership_type || "none",
      depositAmount: profile?.deposit_amount || 0,
      discountRate: profile?.deposit_discount_rate || 1.0,
      returnRate: profile?.deposit_return_rate || 0,
      lastRecharge: rec
        ? {
            plan_id: rec.plan_id,
            amount: rec.amount,
            deposit_amount: rec.deposit_amount,
            status: rec.status,
            paid_at: rec.paid_at,
            discount_rate: rec.discount_rate,
            return_rate: rec.return_rate,
          }
        : null,
    });
  } catch (err: any) {
    console.error("[agent/me]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabase, decodeToken } from "../wechat-pay/_lib";

/**
 * 代理中心数据
 * GET /api/agent/me?token=xxx
 * 返回代理身份 / 等级 / 退换额度 / 批发价 / 试衣次数 / 店铺
 */
export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    const tk = decodeToken(token);
    if (!tk?.uid) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const userId = tk.uid;

    const supabase = getSupabase();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !profile) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    // 等级折扣 + 有效折扣（取更优）
    const { data: lvDisc } = await supabase.rpc("calc_level_discount", {
      cum: profile.cumulative_order_amount || 0,
    });
    const levelDiscount = typeof lvDisc === "number" ? lvDisc : 1;
    const agentDiscount = profile.agent_discount || 1;
    const effectiveDiscount = Math.min(agentDiscount, levelDiscount);

    // 店铺名
    let storeName: string | null = null;
    if (profile.agent_store_id) {
      const { data: st } = await supabase
        .from("stores")
        .select("name")
        .eq("id", profile.agent_store_id)
        .maybeSingle();
      storeName = st?.name || null;
    }

    const wholesaleVisible = !!profile.wholesale_enabled || !!profile.store_owner_certified;

    return NextResponse.json({
      success: true,
      is_sales_agent: !!profile.is_sales_agent,
      agent_tier: profile.agent_tier || "none",
      agent_level: profile.agent_level || "普通",
      return_rate: profile.return_rate || 0,
      wholesale_enabled: !!profile.wholesale_enabled,
      wholesale_visible: wholesaleVisible,
      store_owner_certified: !!profile.store_owner_certified,
      agent_discount: agentDiscount,
      level_discount: levelDiscount,
      effective_discount: effectiveDiscount,
      cumulative_order_amount: profile.cumulative_order_amount || 0,
      tryon_credits: profile.tryon_credits || 0,
      tryon_subscription_tier: profile.tryon_subscription_tier || "none",
      tryon_subscription_expires_at: profile.tryon_subscription_expires_at || null,
      store_id: profile.agent_store_id || null,
      store_name: storeName,
    });
  } catch (err: any) {
    console.error("[agent/me] 异常:", err?.message || err);
    return NextResponse.json({ error: "获取代理信息失败", detail: err?.message || String(err) }, { status: 500 });
  }
}

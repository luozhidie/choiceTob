import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const cookie = request.headers.get("cookie") || "";
    const authHeader = request.headers.get("authorization") || "";
    let userId: string | null = null;

    // 1. 尝试从 cookie 中的 JWT 获取 user_id
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabase.auth.getUser(token);
        if (data.user) userId = data.user.id;
      } catch {}
    }
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 2. 读取 profiles（会员状态）
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, membership_type, membership_expires_at, deposit_amount, deposit_discount_rate")
      .eq("id", userId)
      .single();

    // 3. 读取订单统计
    const { data: orders, error: oErr } = await supabase
      .from("orders")
      .select("status")
      .eq("user_id", userId);
    const orderStats = { unpaid: 0, toship: 0, toreceive: 0, aftersale: 0 };
    if (orders) {
      orders.forEach((o: any) => {
        if (o.status === "unpaid") orderStats.unpaid++;
        else if (o.status === "toship") orderStats.toship++;
        else if (o.status === "toreceive") orderStats.toreceive++;
        else if (o.status === "aftersale") orderStats.aftersale++;
      });
    }

    // 4. 读取收藏数（本地 + 后端）
    const { data: favRows } = await supabase
      .from("user_favorites")
      .select("count", { count: "exact" })
      .eq("user_id", userId);
    const localFavs = 0; // 前端从 localStorage 合并

    // 5. 读取浏览记录数（本地为主）
    // 暂用本地，不查后端

    // 6. 读取钱包余额
    const { data: wallet } = await supabase
      .from("user_wallet")
      .select("balance")
      .eq("user_id", userId)
      .single();
    const balance = wallet?.balance || 0;

    // 7. 读取卡券数
    const { data: coupons } = await supabase
      .from("coupons")
      .select("count", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "unused");
    const couponCount = coupons?.[0]?.count || 0;

    // 8. 读取红包数
    const { data: redPackets } = await supabase
      .from("red_packets")
      .select("count", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "unused");
    const redPackCount = redPackets?.[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: {
        // 用户信息
        userId: userId,
        role: profile?.role || "user",
        membershipType: profile?.membership_type || "none",
        membershipExpiresAt: profile?.membership_expires_at || null,
        depositAmount: profile?.deposit_amount || 0,
        depositDiscountRate: profile?.deposit_discount_rate || 1.0,

        // 订单统计
        orderStats,

        // 资产
        walletBalance: Math.round(balance / 100), // 分→元
        couponCount,
        redPackCount,

        // 收藏（暂时只返回 0，前端合并本地）
        favCount: couponCount, // placeholder
        historyCount: 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

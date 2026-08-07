import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function parseMiniToken(token: string): { uid: string; exp?: number } | null {
  try {
    if (!token || token.includes(".")) return null;
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.uid) return null;
    if (payload.exp && payload.exp < Date.now()) return null;
    return { uid: payload.uid as string, exp: payload.exp as number | undefined };
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

const ALLOWED = ["pending", "paid", "shipped", "completed", "cancelled", "refund_pending", "refunded"];

/**
 * POST /api/orders/[id]
 * 更新订单状态（确认收货 / 取消订单 等）。
 * 鉴权：小程序自定义 token 或 Supabase JWT；管理员 cookie 亦可。
 * 归属校验：非管理员只能操作本人订单（user_id === uid）。
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "服务器配置错误" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. 鉴权
    let uid: string | null = null;
    let isAdmin = false;
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (token) {
      if (token.includes(".")) {
        const { data } = await supabase.auth.getUser(token);
        if (data.user) uid = data.user.id;
      } else {
        const mini = parseMiniToken(token);
        if (mini) uid = mini.uid;
      }
    }
    const adminCookie = request.cookies.get("admin_logged_in")?.value;
    if (adminCookie === "true") isAdmin = true;
    if (!uid && !isAdmin) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const status = body.status;
    if (!status || ALLOWED.indexOf(status) < 0) {
      return NextResponse.json({ error: "非法的订单状态" }, { status: 400 });
    }

    // 2. 归属校验
    const { data: order, error: fetchErr } = await supabase
      .from("orders")
      .select("id, user_id, status, total_amount")
      .eq("id", id)
      .single();
    if (fetchErr || !order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }
    if (!isAdmin && order.user_id !== uid) {
      return NextResponse.json({ error: "无权操作该订单" }, { status: 403 });
    }

    // 3. 更新
    const update: Record<string, unknown> = { status };
    if (status === "completed") update.completed_at = new Date().toISOString();
    if (status === "cancelled") update.cancelled_at = new Date().toISOString();

    const { data: updated, error: updErr } = await supabase
      .from("orders")
      .update(update)
      .eq("id", id)
      .select()
      .single();
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // 4. 邀请返利（被邀请人首单完成时，返红包给邀请人）。非阻塞、容错。
    if (status === "paid" || status === "completed") {
      try {
        const { data: invitee } = await supabase
          .from("profiles")
          .select("invited_by, invite_code")
          .eq("id", order.user_id)
          .maybeSingle();
        if (invitee?.invited_by) {
          const { data: existing } = await supabase
            .from("referral_rewards")
            .select("id")
            .eq("invitee_id", order.user_id)
            .maybeSingle();
          if (!existing) {
            // 返 8-100 元随机红包（分单位）
            const rewardAmount = Math.floor(800 + Math.random() * (10000 - 800));
            const { error: rErr } = await supabase.from("referral_rewards").insert({
              inviter_id: invitee.invited_by,
              invitee_id: order.user_id,
              invite_code: invitee.invite_code || null,
              first_order_amount: order.total_amount || 0,
              reward_amount: rewardAmount,
              reward_granted: true,
            });
            if (!rErr) {
              const expireAt = new Date(Date.now() + 30 * 86400000)
                .toISOString()
                .split("T")[0];
              await supabase.from("red_packets").insert({
                user_id: invitee.invited_by,
                title: "邀请好友首单红包 ¥" + Math.round(rewardAmount / 100),
                amount: rewardAmount,
                packet_type: "referral",
                expire_at: expireAt,
                status: "unused",
              });
            }
          }
        }
      } catch (e) {
        console.error("邀请返利发放失败（已忽略）:", e);
      }
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    console.error("更新订单状态失败:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

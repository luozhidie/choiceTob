// 查询当前代理/预存货款身份状态 + 推广业绩（仅展示，不涉及结算）
// 支持：网站 session（Authorization JWT）或 小程序 openid 参数
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

function parseMiniToken(token: string): { uid: string } | null {
  try {
    if (!token || token.includes(".")) return null;
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.uid) return null;
    return { uid: payload.uid as string };
  } catch {
    return null;
  }
}

async function resolveUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (token) {
    const supabase = getServiceRoleClient();
    if (token.includes(".")) {
      const { data } = await supabase.auth.getUser(token);
      if (data.user) return data.user.id;
    } else {
      const mini = parseMiniToken(token);
      if (mini) return mini.uid;
    }
  }
  const openid = request.nextUrl.searchParams.get("openid");
  if (openid) {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .or(`wechat_openid.eq.${openid},wx_openid.eq.${openid}`)
      .maybeSingle();
    if (data) return data.id;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const uid = await resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, role, membership_type, deposit_amount, deposit_discount_rate, deposit_return_rate, invite_code, store_owner_certified, certified_style, full_name, store_name, is_admin, wechat_openid, wx_openid"
      )
      .eq("id", uid)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ active: false, user_id: uid, isDepositAgent: false, isCertified: false, isAdmin: false });
    }

    // 管理员判定（与 /api/user/me 保持一致）：profiles 标识 或 auth 邮箱白名单
    let authEmail = "";
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(uid);
      authEmail = authUser?.user?.email || "";
    } catch {}
    const adminEmails = (process.env.ADMIN_EMAILS || "luozhidie@live.cn")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin =
      profile.role === "admin" || profile.is_admin === true || adminEmails.includes(authEmail.toLowerCase());

    const isDepositAgent =
      profile.membership_type === "deposit_discount" && Number(profile.deposit_amount || 0) > 0;
    const isCertified = profile.store_owner_certified === true;

    // 兜底生成推广码（首次进入工作台）：用 user_id 派生稳定码并写回
    let inviteCode = profile.invite_code || null;
    if (!inviteCode) {
      inviteCode = "LZD" + String(profile.id).replace(/-/g, "").slice(0, 8).toUpperCase();
      await supabase.from("profiles").update({ invite_code: inviteCode }).eq("id", profile.id);
    }

    // 业绩归因（仅展示，不涉及结算）。orders.agent_id 由 SQL 脚本补建；未执行时容错返回 0
    let performance = { customerCount: 0, orderCount: 0, gmv: 0 };
    try {
      const { data: agg } = await supabase
        .from("orders")
        .select("user_id, total_amount")
        .eq("agent_id", profile.id);
      if (agg && agg.length) {
        const customers = new Set(agg.map((o: any) => o.user_id).filter(Boolean));
        performance = {
          customerCount: customers.size,
          orderCount: agg.length,
          gmv: agg.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
        };
      }
    } catch {
      // orders.agent_id 尚未建：业绩展示为 0，不影响其余功能
    }

    // 代理可提现收益余额（差价结算累计）
    let walletBalance = 0;
    try {
      const { data: w } = await supabase
        .from("user_wallet")
        .select("balance")
        .eq("user_id", profile.id)
        .maybeSingle();
      walletBalance = w ? Number(w.balance || 0) : 0;
    } catch {
      // user_wallet 尚未建：余额 0
    }

    return NextResponse.json({
      active: isDepositAgent || isCertified || isAdmin,
      isDepositAgent,
      isCertified,
      isAdmin,
      user_id: profile.id,
      membershipType: profile.membership_type || "none",
      fullName: profile.full_name || profile.store_name || "",
      storeName: profile.store_name || "",
      certifiedStyle: profile.certified_style || "",
      depositAmount: profile.deposit_amount || 0,
      discountRate: profile.deposit_discount_rate || 1.0,
      returnRate: profile.deposit_return_rate || 0,
      inviteCode,
      walletBalance,
      performance,
    });
  } catch (err: any) {
    console.error("[agent/me]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

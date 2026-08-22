// 代理资金账单聚合：货款余额 / 可提现佣金 / 冻结佣金 / 试衣剩余 / 资金流水
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const dynamic = "force-dynamic";

function resolveUid(request: NextRequest): string | null {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  if (!token.includes(".")) {
    try {
      const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
      return payload.uid || null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const uid = resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const supabase = createServiceRoleClient();

    // 基础余额
    const { data: profile } = await supabase
      .from("profiles")
      .select("deposit_amount, pre_deposit_agreed, payment_password_hash, wechat_openid, wx_openid")
      .eq("id", uid)
      .maybeSingle();
    const { data: wallet } = await supabase
      .from("user_wallet")
      .select("balance, frozen_balance")
      .eq("user_id", uid)
      .maybeSingle();

    // 试衣剩余
    let tryon = { normalLeft: 0, proLeft: 0, daysLeft: 0 };
    const openid = profile?.wechat_openid || profile?.wx_openid;
    if (openid) {
      const { data: te } = await supabase
        .from("tryon_entitlements")
        .select("normal_left, pro_left, expires_at")
        .eq("openid", openid)
        .maybeSingle();
      if (te) {
        const days = Math.max(0, Math.ceil((new Date(te.expires_at).getTime() - Date.now()) / 86400000));
        tryon = { normalLeft: Number(te.normal_left || 0), proLeft: Number(te.pro_left || 0), daysLeft: days };
      }
    }

    // 流水：货款流水
    const { data: dt } = await supabase
      .from("deposit_transactions")
      .select("id, type, amount, balance_after, remark, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);

    // 流水：提现
    const { data: aw } = await supabase
      .from("agent_withdrawals")
      .select("id, amount, status, type, created_at, tax_deducted, actual_paid, method")
      .eq("agent_id", uid)
      .order("created_at", { ascending: false })
      .limit(50);

    // 流水：佣金入账（orders 中该代理、已结算/冻结的单）
    const { data: orders } = await supabase
      .from("orders")
      .select("order_no, agent_profit, settlement_status, created_at, status")
      .eq("agent_id", uid)
      .in("settlement_status", ["frozen", "settled"])
      .order("created_at", { ascending: false })
      .limit(100);

    // 合并流水
    const txns: any[] = [];
    (dt || []).forEach((r: any) => {
      txns.push({
        id: r.id,
        kind: "deposit",
        type: r.type,
        amount: r.amount,
        balanceAfter: r.balance_after,
        remark: r.remark || "",
        createdAt: r.created_at,
      });
    });
    (aw || []).forEach((r: any) => {
      txns.push({
        id: r.id,
        kind: "withdraw",
        amount: -Math.abs(Number(r.amount || 0)),
        status: r.status,
        taxDeducted: r.tax_deducted || 0,
        actualPaid: r.actual_paid || 0,
        createdAt: r.created_at,
      });
    });
    (orders || []).forEach((r: any) => {
      txns.push({
        id: r.order_no,
        kind: "commission",
        amount: Number(r.agent_profit || 0),
        settlementStatus: r.settlement_status,
        createdAt: r.created_at,
      });
    });
    txns.sort((a: any, b: any) => (a.createdAt < b.createdAt ? 1 : -1));

    return NextResponse.json({
      depositAmount: Number(profile?.deposit_amount || 0),
      walletBalance: Number(wallet?.balance || 0),
      frozenBalance: Number(wallet?.frozen_balance || 0),
      preDepositAgreed: !!profile?.pre_deposit_agreed,
      paymentPasswordSet: !!profile?.payment_password_hash,
      tryon,
      transactions: txns.slice(0, 60),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}

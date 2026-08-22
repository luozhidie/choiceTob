// 代理收益提现（差价收益 → 申请提现，后台人工打款）
// 仅可提现佣金(user_wallet.balance)，货款不可提现。
// GET: 返回可提现余额 + 冻结余额 + 提现记录
// POST: 提交提现申请（微信/银行卡，含个税估算 + 工作日到账说明）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calcCommissionTax, calcExpectedArrival } from "@/lib/agent-deposit";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误");
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
    const uid = await resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const supabase = getServiceRoleClient();
    const { data: w } = await supabase
      .from("user_wallet")
      .select("balance, frozen_balance")
      .eq("user_id", uid)
      .maybeSingle();
    const { data: ws } = await supabase
      .from("agent_withdrawals")
      .select("*")
      .eq("agent_id", uid)
      .order("created_at", { ascending: false })
      .limit(20);
    return NextResponse.json({
      balance: w ? Number(w.balance || 0) : 0,
      frozenBalance: w ? Number(w.frozen_balance || 0) : 0,
      withdrawals: ws || [],
    });
  } catch (err: any) {
    console.error("[agent/withdraw]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const body = await request.json();
    const amount = Math.round(Number(body.amount)); // 分
    const method: string = body.method || "wechat";
    const bankCardId: string | null = body.bank_card_id || null;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "提现金额无效" }, { status: 400 });
    }
    if (!["wechat", "bank"].includes(method)) {
      return NextResponse.json({ error: "不支持的提现方式" }, { status: 400 });
    }
    if (method === "bank" && !bankCardId) {
      return NextResponse.json({ error: "请选择提现银行卡" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { data: w } = await supabase
      .from("user_wallet")
      .select("balance")
      .eq("user_id", uid)
      .maybeSingle();
    const balance = w ? Number(w.balance || 0) : 0;
    if (balance < amount) {
      return NextResponse.json({ error: "可提现佣金不足" }, { status: 400 });
    }

    // 银行卡归属校验（防止提别人卡）
    if (method === "bank") {
      const { data: bc } = await supabase
        .from("user_bank_cards")
        .select("id")
        .eq("id", bankCardId)
        .eq("user_id", uid)
        .maybeSingle();
      if (!bc) return NextResponse.json({ error: "银行卡不存在或不属于您" }, { status: 400 });
    }

    // 个税估算 + 工作日到账
    const { taxDeducted, actualPaid } = calcCommissionTax(amount);
    const expected = calcExpectedArrival(new Date());

    // 写提现申请（后台人工打款后标记 paid）
    const { data: rec, error: insErr } = await supabase
      .from("agent_withdrawals")
      .insert({
        agent_id: uid,
        amount,
        type: "commission",
        method,
        bank_card_id: method === "bank" ? bankCardId : null,
        status: "pending",
        tax_deducted: taxDeducted,
        actual_paid: actualPaid,
        expected_arrival_at: expected.toISOString(),
      })
      .select()
      .single();

    if (insErr) {
      // 写入失败：不扣余额，避免资金丢失
      return NextResponse.json({ error: "提现申请创建失败：" + insErr.message }, { status: 500 });
    }

    // 扣减可提现余额（写记录成功后再扣，避免「扣了但没记录」）
    await supabase
      .from("user_wallet")
      .update({ balance: balance - amount, updated_at: new Date().toISOString() })
      .eq("user_id", uid);

    return NextResponse.json({
      success: true,
      balance: balance - amount,
      withdrawal: rec,
      taxDeducted,
      actualPaid,
      expectedArrival: expected.toISOString(),
    });
  } catch (err: any) {
    console.error("[agent/withdraw]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

// 代理收益提现（差价收益 → 申请提现，后台人工打款）
// GET: 返回可提现余额 + 提现记录
// POST: 提交提现申请（扣减 user_wallet.balance，写 agent_withdrawals）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
      .select("balance")
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
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "提现金额无效" }, { status: 400 });
    }
    const supabase = getServiceRoleClient();
    const { data: w } = await supabase
      .from("user_wallet")
      .select("balance")
      .eq("user_id", uid)
      .maybeSingle();
    const balance = w ? Number(w.balance || 0) : 0;
    if (balance < amount) {
      return NextResponse.json({ error: "可提现余额不足" }, { status: 400 });
    }
    // 扣减余额
    await supabase
      .from("user_wallet")
      .update({ balance: balance - amount, updated_at: new Date().toISOString() })
      .eq("user_id", uid);
    // 写提现申请（后台人工打款后标记 paid）
    const { data: rec } = await supabase
      .from("agent_withdrawals")
      .insert({
        agent_id: uid,
        amount,
        method: body.method || "wechat",
        status: "pending",
      })
      .select()
      .single();
    return NextResponse.json({ success: true, balance: balance - amount, withdrawal: rec });
  } catch (err: any) {
    console.error("[agent/withdraw]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

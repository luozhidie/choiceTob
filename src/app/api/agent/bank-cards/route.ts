// 代理银行卡：绑定 / 列表（脱敏） / 解绑
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { encryptCardNo } from "@/lib/agent-deposit";

export const dynamic = "force-dynamic";

function getUid(request: NextRequest): string | null {
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

// 校验银行卡号 16-19 位
function isValidCard(cardNo: string): boolean {
  return /^\d{16,19}$/.test(cardNo);
}

export async function GET(request: NextRequest) {
  try {
    const uid = getUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("user_bank_cards")
      .select("id, bank_name, account_name, card_no_last4, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cards: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = getUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const bank_name: string = (body.bank_name || "").trim();
    const account_name: string = (body.account_name || "").trim();
    const card_no: string = (body.card_no || "").replace(/\s/g, "");

    if (!bank_name || !account_name) {
      return NextResponse.json({ error: "请填写银行名称和持卡人姓名" }, { status: 400 });
    }
    if (!isValidCard(card_no)) {
      return NextResponse.json({ error: "银行卡号格式不正确（16-19 位数字）" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    // 校验已签协议（仅佣金提现用途，需先签预充货款协议）
    const { data: profile } = await supabase
      .from("profiles")
      .select("pre_deposit_agreed")
      .eq("id", uid)
      .maybeSingle();
    if (!profile?.pre_deposit_agreed) {
      return NextResponse.json({ error: "请先签署《预充货款协议》" }, { status: 403 });
    }

    const enc = encryptCardNo(card_no);
    const { data, error } = await supabase
      .from("user_bank_cards")
      .insert({
        user_id: uid,
        bank_name,
        account_name,
        card_no_last4: card_no.slice(-4),
        card_no_enc: enc,
      })
      .select("id, bank_name, account_name, card_no_last4, created_at")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, card: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "绑定失败" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const uid = getUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少卡片 id" }, { status: 400 });
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("user_bank_cards")
      .delete()
      .eq("id", id)
      .eq("user_id", uid);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "解绑失败" }, { status: 500 });
  }
}

// 货款抵扣支付密码：设置 / 校验
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { hashPaymentPassword, verifyPaymentPassword } from "@/lib/agent-deposit";

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

// 校验 6 位数字
function isValid(password: string): boolean {
  return typeof password === "string" && /^\d{6}$/.test(password);
}

export async function GET(request: NextRequest) {
  try {
    const uid = getUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const supabase = createServiceRoleClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("payment_password_hash")
      .eq("id", uid)
      .maybeSingle();
    return NextResponse.json({ set: !!profile?.payment_password_hash });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}

// POST {action:'set', password} 或 {action:'verify', password}
export async function POST(request: NextRequest) {
  try {
    const uid = getUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const action: string = body.action || "set";
    const password: string = body.password || "";

    if (!isValid(password)) {
      return NextResponse.json({ error: "支付密码需为 6 位数字" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("payment_password_hash")
      .eq("id", uid)
      .maybeSingle();

    if (action === "set") {
      // 已设过则需先验证旧密码（本期简化：已设过直接拒绝，提示先验证）
      if (profile?.payment_password_hash) {
        return NextResponse.json(
          { error: "已设置过支付密码，请先验证旧密码后再修改（本期暂不支持改密，联系客服）" },
          { status: 409 }
        );
      }
      const { error } = await supabase
        .from("profiles")
        .update({ payment_password_hash: hashPaymentPassword(password) })
        .eq("id", uid);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "verify") {
      const ok = profile?.payment_password_hash
        ? verifyPaymentPassword(password, profile.payment_password_hash)
        : false;
      if (!ok) return NextResponse.json({ ok: false, error: "支付密码错误" }, { status: 401 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "操作失败" }, { status: 500 });
  }
}

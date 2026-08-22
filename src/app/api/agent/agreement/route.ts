// 预充货款协议：签约状态查询 + 签约落库
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  PRE_DEPOSIT_AGREEMENT_VERSION,
  PRE_DEPOSIT_AGREEMENT_TEXT,
  agreementContentHash,
} from "@/lib/agent-deposit";

export const dynamic = "force-dynamic";

function getUid(request: NextRequest): string | null {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace("Bearer ", "");
  if (!token) return null;
  // 小程序 base64url uid token
  if (!token.includes(".")) {
    try {
      const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
      return payload.uid || null;
    } catch {
      return null;
    }
  }
  return null; // 网站端另行用 session（本期小程序优先）
}

export async function GET(request: NextRequest) {
  try {
    const uid = getUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const supabase = createServiceRoleClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("pre_deposit_agreed, pre_deposit_agreed_version, pre_deposit_agreed_at")
      .eq("id", uid)
      .maybeSingle();

    const signed = !!profile?.pre_deposit_agreed;
    return NextResponse.json({
      signed,
      version: profile?.pre_deposit_agreed_version || null,
      signedAt: profile?.pre_deposit_agreed_at || null,
      latestVersion: PRE_DEPOSIT_AGREEMENT_VERSION,
      mustSign: !signed,
      agreementText: PRE_DEPOSIT_AGREEMENT_TEXT,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = getUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const version: string = body.version || PRE_DEPOSIT_AGREEMENT_VERSION;
    const hash = agreementContentHash(PRE_DEPOSIT_AGREEMENT_TEXT);

    const supabase = createServiceRoleClient();
    // 写签约记录（版本化，唯一约束防重复）
    await supabase.from("agreements").upsert(
      {
        user_id: uid,
        agreement_key: "pre_deposit",
        version,
        content_hash: hash,
      },
      { onConflict: "user_id,agreement_key,version" }
    );

    // 置 profiles 签约标志
    const { error } = await supabase
      .from("profiles")
      .update({
        pre_deposit_agreed: true,
        pre_deposit_agreed_version: version,
        pre_deposit_agreed_at: new Date().toISOString(),
      })
      .eq("id", uid);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, version });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "签约失败" }, { status: 500 });
  }
}

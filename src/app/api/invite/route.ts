// 邀请有奖：我的邀请码 / 邀请进度 / 返利状态
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = "force-dynamic";

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

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  if (token.includes(".")) {
    const { data } = await supabase.auth.getUser(token);
    if (data.user) return data.user.id;
  } else {
    const mini = parseMiniToken(token);
    if (mini) return mini.uid;
  }
  return null;
}

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function ensureInviteCode(userId: string): Promise<string> {
  const { data: p } = await supabase.from("profiles").select("invite_code").eq("id", userId).maybeSingle();
  if (p?.invite_code) return p.invite_code;
  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const { error } = await supabase.from("profiles").update({ invite_code: code }).eq("id", userId).eq("invite_code", null as any);
    if (!error) return code;
  }
  // 兜底：用 userId 派生
  const fallback = (userId || "").replace(/-/g, "").slice(0, 6).toUpperCase();
  await supabase.from("profiles").update({ invite_code: fallback }).eq("id", userId);
  return fallback;
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const code = await ensureInviteCode(userId);

  const [{ count: invitedCount }, { data: rewards }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("invited_by", userId),
    supabase
      .from("referral_rewards")
      .select("id, invitee_id, first_order_amount, reward_amount, reward_granted, created_at")
      .eq("inviter_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      invite_code: code,
      invite_link: "https://colour-choice.art/?invite=" + code,
      invited_count: invitedCount || 0,
      rewards: rewards || [],
    },
  });
}

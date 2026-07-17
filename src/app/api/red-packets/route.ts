// ============================================================
// 用户端红包 API：/api/red-packets
// GET 查看我的红包
// POST 使用红包
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

// GET /api/red-packets?user_id=xxx&status=unused
// 兼容：未传 user_id 时从 Authorization 解析
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let userId = searchParams.get("user_id");
  const status = searchParams.get("status");

  if (!userId) {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (token) {
      if (token.includes(".")) {
        const { data } = await supabase.auth.getUser(token);
        if (data.user) userId = data.user.id;
      } else {
        const mini = parseMiniToken(token);
        if (mini) userId = mini.uid;
      }
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "user_id必填" }, { status: 400 });
  }

  // 自动过期
  await supabase
    .from("red_packets")
    .update({ status: "expired" })
    .eq("user_id", userId)
    .eq("status", "unused")
    .lt("expire_at", new Date().toISOString().split("T")[0]);

  let query = supabase
    .from("red_packets")
    .select("id, title, amount, status, expire_at, packet_type, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

// POST /api/red-packets/use 使用红包
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { packet_id, user_id } = body;

    if (!packet_id || !user_id) {
      return NextResponse.json({ error: "packet_id和user_id必填" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("red_packets")
      .update({ status: "used" })
      .eq("id", packet_id)
      .eq("user_id", user_id)
      .eq("status", "unused")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "红包不存在或已使用" }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

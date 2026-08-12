// app/api/tryon/entitlement/route.ts
// GET  ?openid=  查询试衣权益（权威来源，防客户端伪造）
// POST {openid}  扣减首单体验次数（每次成功试衣后调用）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function shape(row: any) {
  const now = Date.now();
  const expires = row ? new Date(row.expires_at).getTime() : 0;
  const triesLeft = row ? row.tries_left || 0 : 0;
  const active = expires > now || triesLeft > 0;
  const daysLeft = expires > now ? Math.max(0, Math.ceil((expires - now) / 86400000)) : 0;
  return {
    active,
    type: row ? row.type : null,
    daysLeft,
    triesLeft,
    expires: row ? row.expires_at : null,
  };
}

export async function GET(request: NextRequest) {
  const openid = request.nextUrl.searchParams.get("openid");
  if (!openid) return NextResponse.json({ active: false, error: "缺少 openid" }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("tryon_entitlements").select("*").eq("openid", openid).single();
    return NextResponse.json(shape(data));
  } catch (err: any) {
    return NextResponse.json({ active: false, error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { openid } = body;
    if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    const supabase = await createClient();
    const { data: row } = await supabase.from("tryon_entitlements").select("*").eq("openid", openid).single();
    if (!row) return NextResponse.json({ active: false, triesLeft: 0 });
    if (row.type === "first" && (row.tries_left || 0) > 0) {
      const { error } = await supabase
        .from("tryon_entitlements")
        .update({ tries_left: row.tries_left - 1, updated_at: new Date().toISOString() })
        .eq("openid", openid);
      if (error) console.error("[试衣扣减] 失败", error);
      const { data: updated } = await supabase.from("tryon_entitlements").select("*").eq("openid", openid).single();
      return NextResponse.json(shape(updated));
    }
    return NextResponse.json(shape(row));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "扣减失败" }, { status: 500 });
  }
}

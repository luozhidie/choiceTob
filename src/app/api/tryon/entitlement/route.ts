// app/api/tryon/entitlement/route.ts
// GET  ?openid=  查询试衣权益（权威来源，防客户端伪造）
// POST {openid, tier}  扣减对应档位次数（每次成功试衣后调用）
// tier: 'normal' | 'pro'，由客户端按当前模式传入
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shapeEntitlement } from "@/lib/tryon-entitlement";

export async function GET(request: NextRequest) {
  const openid = request.nextUrl.searchParams.get("openid");
  if (!openid) return NextResponse.json({ active: false, error: "缺少 openid" }, { status: 400 });
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("tryon_entitlements").select("*").eq("openid", openid).single();
    return NextResponse.json(shapeEntitlement(data));
  } catch (err: any) {
    return NextResponse.json({ active: false, error: err.message || "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { openid, tier } = body;
    if (!openid) return NextResponse.json({ error: "缺少 openid" }, { status: 400 });
    if (!tier || (tier !== "normal" && tier !== "pro")) {
      return NextResponse.json({ error: "缺少 tier 参数（normal/pro）" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: row } = await supabase.from("tryon_entitlements").select("*").eq("openid", openid).single();
    if (!row) return NextResponse.json({ active: false, normalLeft: 0, proLeft: 0, triesLeft: 0 });

    const now = Date.now();
    // 双轨独立：专业版只扣专业次数，普通版只扣普通次数（次数不共用，取消跨轨兜底）
    const key = tier === "pro" ? "pro" : "normal";
    const leftKey = key + "_left";
    const expKey = key + "_expires_at";

    // 该轨道到期时间；旧数据回落单行 expires_at
    let exp = row[expKey] ? new Date(row[expKey]).getTime() : 0;
    if (!exp && row.expires_at) exp = new Date(row.expires_at).getTime();

    const expired = !exp || exp <= now;
    let cur = (row[leftKey] || 0) as number;

    // 本轨道次数用完或已过期 → 不可扣减，直接返回当前状态
    if (cur <= 0 || expired) {
      return NextResponse.json(shapeEntitlement(row));
    }

    // 按轨道扣减 1 次
    const { error } = await supabase
      .from("tryon_entitlements")
      .update({ [leftKey]: cur - 1, updated_at: new Date().toISOString() })
      .eq("openid", openid);
    if (error) console.error("[试衣扣减] 失败", error);
    const { data: updated } = await supabase.from("tryon_entitlements").select("*").eq("openid", openid).single();
    return NextResponse.json(shapeEntitlement(updated));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "扣减失败" }, { status: 500 });
  }
}

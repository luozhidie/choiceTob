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
    const expired = new Date(row.expires_at).getTime() <= now;
    let col = tier === "pro" ? "pro_left" : "normal_left";
    let cur = (row[col] || 0) as number;

    // 专业版次数用完时，可用普通版次数兜底（新套餐均为通用次数）
    if (tier === "pro" && (cur <= 0 || expired)) {
      const normalCur = (row.normal_left || 0) as number;
      if (normalCur > 0 && !expired) {
        col = "normal_left";
        cur = normalCur;
      }
    }

    // 对应档位次数用完或已过期，直接返回失效
    if (cur <= 0 || expired) {
      return NextResponse.json({
        active: false,
        type: row.type,
        daysLeft: 0,
        normalLeft: row.normal_left || 0,
        proLeft: row.pro_left || 0,
        triesLeft: (row.normal_left || 0) + (row.pro_left || 0),
        expires: row.expires_at,
      });
    }

    // 按档位扣减 1 次
    const { error } = await supabase
      .from("tryon_entitlements")
      .update({ [col]: cur - 1, updated_at: new Date().toISOString() })
      .eq("openid", openid);
    if (error) console.error("[试衣扣减] 失败", error);
    const { data: updated } = await supabase.from("tryon_entitlements").select("*").eq("openid", openid).single();
    return NextResponse.json(shapeEntitlement(updated));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "扣减失败" }, { status: 500 });
  }
}

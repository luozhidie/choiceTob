// ============================================================
// 领取优惠券 API：/api/coupons/claim
// POST { template_id }  （需登录：Authorization: Bearer <JWT 或小程序自定义token>）
// 校验模板可用性与限领规则，领取后写入 coupons 并 claimed_count+1
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 解析小程序自定义 token（base64url JSON，如 {uid,openid,exp}），与 Supabase JWT 区分
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

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "请先登录", code: "unauthorized" }, { status: 401 });
    }

    let userId: string | null = null;
    if (token.includes(".")) {
      const { data } = await supabase.auth.getUser(token);
      if (data.user) userId = data.user.id;
    } else {
      const mini = parseMiniToken(token);
      if (mini) userId = mini.uid;
    }
    if (!userId) {
      return NextResponse.json({ error: "登录已失效，请重新登录", code: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const templateId = body.template_id;
    if (!templateId) {
      return NextResponse.json({ error: "template_id 必填" }, { status: 400 });
    }

    // 1. 读取模板
    const { data: tpl, error: tplErr } = await supabase
      .from("coupon_templates")
      .select("*")
      .eq("id", templateId)
      .single();
    if (tplErr || !tpl) {
      return NextResponse.json({ error: "优惠券不存在" }, { status: 404 });
    }
    if (!tpl.is_active) {
      return NextResponse.json({ error: "该券已下架" }, { status: 400 });
    }
    if (tpl.total_limit > 0 && tpl.claimed_count >= tpl.total_limit) {
      return NextResponse.json({ error: "已被抢光" }, { status: 400 });
    }

    // 2. 限领校验
    const { count, error: cntErr } = await supabase
      .from("coupons")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("template_id", templateId);
    if (cntErr) {
      return NextResponse.json({ error: cntErr.message }, { status: 500 });
    }
    if ((count || 0) >= tpl.per_user_limit) {
      return NextResponse.json({ error: "您已领取过该券", code: "already_claimed" }, { status: 400 });
    }

    // 3. 发放优惠券
    const expire = new Date();
    expire.setDate(expire.getDate() + (tpl.valid_days || 30));
    const { data: coupon, error: insErr } = await supabase
      .from("coupons")
      .insert({
        user_id: userId,
        template_id: tpl.id,
        title: tpl.title,
        discount_desc: tpl.discount_desc,
        min_amount: tpl.min_amount,
        discount_amount: tpl.discount_amount,
        coupon_type: tpl.coupon_type,
        expire_at: expire.toISOString().split("T")[0],
        status: "unused",
      })
      .select()
      .single();
    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    // 4. 计数 +1（忽略失败，不影响领取结果）
    await supabase
      .from("coupon_templates")
      .update({ claimed_count: (tpl.claimed_count || 0) + 1 })
      .eq("id", tpl.id);

    return NextResponse.json({ success: true, data: coupon });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabase, decodeToken } from "../wechat-pay/_lib";

/**
 * 虚拟试衣免费试用（前 100 名，每人 1 次）
 * GET  /api/tryon/free-trial?token= → { success, claimed, remaining }
 * POST /api/tryon/free-trial         → { ok, credits, remaining } | { ok:false, reason }
 *
 * 落地逻辑见 SQL: claim_tryon_free_trial(p_user_id)
 *  - 已领过 → already_claimed
 *  - 名额 >= 100 → sold_out
 *  - 否则建一条 0 元 free_trial 订阅，profile.tryon_free_claimed=true，试衣次数 +1
 */
export async function GET(req: NextRequest) {
  try {
    const token = new URL(req.url).searchParams.get("token") || "";
    const tk = decodeToken(token);
    if (!tk?.uid) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const supabase = getSupabase();

    const { data: claimed } = await supabase
      .from("tryon_free_trials")
      .select("id")
      .eq("user_id", tk.uid)
      .maybeSingle();

    const { count } = await supabase
      .from("tryon_free_trials")
      .select("*", { count: "exact", head: true });

    const remaining = Math.max(0, 100 - (count || 0));
    return NextResponse.json({ success: true, claimed: !!claimed, remaining });
  } catch (err: any) {
    console.error("[tryon/free-trial GET] 异常:", err?.message || err);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tk = decodeToken(body.token);
    if (!tk?.uid) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("claim_tryon_free_trial", { p_user_id: tk.uid });
    if (error) {
      console.error("[tryon/free-trial POST] 失败:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[tryon/free-trial POST] 异常:", err?.message || err);
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}

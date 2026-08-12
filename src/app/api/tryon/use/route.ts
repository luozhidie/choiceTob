import { NextRequest, NextResponse } from "next/server";
import { getSupabase, decodeToken } from "../wechat-pay/_lib";

/**
 * 扣减一次虚拟试衣次数（look-studio 调用）
 * POST /api/tryon/use
 * Body: { token }
 * 返回: { ok, remaining } 或 { ok:false, reason }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;
    const tk = decodeToken(token);
    if (!tk?.uid) return NextResponse.json({ error: "请先登录" }, { status: 401 });
    const userId = tk.uid;

    const supabase = getSupabase();
    const { data, error } = await supabase.rpc("consume_tryon_credit", { p_user_id: userId });
    if (error) {
      console.error("[tryon/use] 失败:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[tryon/use] 异常:", err?.message || err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

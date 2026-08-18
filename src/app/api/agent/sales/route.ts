// GET /api/agent/sales  归因订单列表（仅展示，不含结算/金额拆分）
// 支持网站 session（Authorization JWT）或小程序 openid 参数
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("服务器配置错误");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function parseMiniToken(token: string): { uid: string } | null {
  try {
    if (!token || token.includes(".")) return null;
    const payload = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (!payload.uid) return null;
    return { uid: payload.uid as string };
  } catch {
    return null;
  }
}

async function resolveUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (token) {
    const supabase = getServiceRoleClient();
    if (token.includes(".")) {
      const { data } = await supabase.auth.getUser(token);
      if (data.user) return data.user.id;
    } else {
      const mini = parseMiniToken(token);
      if (mini) return mini.uid;
    }
  }
  const openid = request.nextUrl.searchParams.get("openid");
  if (openid) {
    const supabase = getServiceRoleClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .or(`wechat_openid.eq.${openid},wx_openid.eq.${openid}`)
      .maybeSingle();
    if (data) return data.id;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const uid = await resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 20));
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset")) || 0);

    let list: any[] = [];
    let total = 0;
    try {
      const { data, count } = await supabase
        .from("orders")
        .select(
          "order_no, product_title, product_image, total_amount, quantity, status, created_at, user_id",
          { count: "exact" }
        )
        .eq("agent_id", uid)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
      list = data || [];
      total = count || 0;
    } catch {
      // orders.agent_id 尚未建：返回空列表，不影响工作台其余功能
    }

    const rows = list.map((o: any) => ({
      order_no: o.order_no,
      product_title: o.product_title || "样衣",
      product_image: o.product_image || null,
      total_amount: o.total_amount || 0,
      quantity: o.quantity || 1,
      status: o.status,
      created_at: o.created_at,
      customer: o.user_id ? o.user_id.slice(0, 8) + "***" : "匿名客户",
    }));

    return NextResponse.json({ list: rows, total });
  } catch (err: any) {
    console.error("[agent/sales]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

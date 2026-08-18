// GET /api/agent/sales  归因订单列表 + 差价明细
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
    const status = request.nextUrl.searchParams.get("status"); // pending | settled | failed | all

    let query = supabase
      .from("orders")
      .select(
        "order_no, product_title, product_image, total_amount, quantity, agent_cost, agent_profit, settlement_status, status, paid_at, created_at, user_id, express_company, tracking_no",
        { count: "exact" }
      )
      .eq("agent_id", uid)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("settlement_status", status);
    }

    const { data, count } = await query.range(offset, offset + limit - 1);
    const list = data || [];
    const total = count || 0;

    // 查客户名称
    const userIds = list.map((o) => o.user_id).filter(Boolean);
    let profilesMap = new Map<string, { full_name?: string; phone?: string }>();
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone")
        .in("id", userIds);
      (profiles || []).forEach((p) => profilesMap.set(p.id, p));
    }

    const rows = list.map((o: any) => {
      const p = profilesMap.get(o.user_id);
      return {
        order_no: o.order_no,
        product_title: o.product_title || "样衣",
        product_image: o.product_image || null,
        quantity: o.quantity || 1,
        total_amount: o.total_amount || 0,
        agent_cost: o.agent_cost || 0,
        agent_profit: o.agent_profit || 0,
        settlement_status: o.settlement_status || "pending",
        order_status: o.status,
        paid_at: o.paid_at,
        created_at: o.created_at,
        customer_name: p?.full_name || (o.user_id ? o.user_id.slice(0, 8) + "***" : "匿名客户"),
        customer_phone: p?.phone || "",
        express_company: o.express_company,
        tracking_no: o.tracking_no,
      };
    });

    // 汇总
    const summary = {
      totalProfit: list.reduce((sum, o) => sum + (o.agent_profit || 0), 0),
      settledProfit: list
        .filter((o) => o.settlement_status === "settled")
        .reduce((sum, o) => sum + (o.agent_profit || 0), 0),
      pendingProfit: list
        .filter((o) => o.settlement_status === "pending")
        .reduce((sum, o) => sum + (o.agent_profit || 0), 0),
    };

    return NextResponse.json({ list: rows, total, summary });
  } catch (err: any) {
    console.error("[agent/sales]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

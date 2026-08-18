// GET /api/agent/orders  代理查看归因订单的物流与售后
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
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const uid = await resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 20));
    const offset = Math.max(0, Number(request.nextUrl.searchParams.get("offset")) || 0);

    const { data, count } = await supabase
      .from("orders")
      .select(
        "id, order_no, product_title, product_image, total_amount, quantity, status, paid_at, shipped_at, express_company, tracking_no, delivered_at, user_id, contact, address",
        { count: "exact" }
      )
      .eq("agent_id", uid)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const orderIds = (data || []).map((o) => o.id);
    let afterSalesMap = new Map<string, any[]>();
    if (orderIds.length) {
      const { data: aas } = await supabase
        .from("agent_after_sales")
        .select("order_id, type, status, reason, created_at")
        .in("order_id", orderIds)
        .order("created_at", { ascending: false });
      (aas || []).forEach((r) => {
        const arr = afterSalesMap.get(r.order_id) || [];
        arr.push(r);
        afterSalesMap.set(r.order_id, arr);
      });
    }

    const rows = (data || []).map((o) => ({
      ...o,
      after_sales: afterSalesMap.get(o.id) || [],
    }));

    return NextResponse.json({ list: rows, total: count || 0 });
  } catch (err: any) {
    console.error("[agent/orders]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

// POST 申请售后
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const uid = await resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const body = await request.json();
    const { order_id, type, reason, images = [] } = body;
    if (!order_id || !type || !reason) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    // 校验订单归属
    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id")
      .eq("id", order_id)
      .eq("agent_id", uid)
      .single();
    if (!order) {
      return NextResponse.json({ error: "订单不存在或无权限" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("agent_after_sales")
      .insert({
        agent_id: uid,
        order_id,
        user_id: order.user_id,
        type,
        reason,
        images,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("[agent/orders POST]", err);
    return NextResponse.json({ error: err.message || "提交失败" }, { status: 500 });
  }
}

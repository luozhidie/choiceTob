import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 解析当前用户 uid（小程��� token 或网站 cookie）
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser(token);
    if (data?.user?.id) return data.user.id;
  }
  const cookie = req.cookies.get("admin_user_id")?.value;
  if (cookie) return cookie;
  return null;
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const supabase = await createClient();

  // 取代理身份信息，判断 valid
  const { data: profile } = await supabase
    .from("profiles")
    .select("membership_type, deposit_amount, store_owner_certified, role")
    .eq("id", userId)
    .single();

  const isAdmin = profile?.role === "admin";
  const isAgent =
    isAdmin ||
    profile?.membership_type === "deposit_discount" ||
    (profile?.store_owner_certified && (profile?.deposit_amount || 0) > 0);

  if (!isAgent) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Number(searchParams.get("pageSize") || "20"));

  // 聚合买家：首次下单时间、订单数、累计GMV、最近下单时间
  const { data: customers, error, count } = await supabase
    .from("orders")
    .select(
      "user_id, created_at, total_amount, status, id",
      { count: "exact" }
    )
    .eq("agent_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("agent/customers error:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }

  // 按 user_id 聚合
  const map = new Map<
    string,
    {
      userId: string;
      firstOrderAt: string;
      lastOrderAt: string;
      orderCount: number;
      gmv: number;
      paidGmv: number;
      orderIds: string[];
    }
  >();

  (customers || []).forEach((o) => {
    const uid = o.user_id || "guest";
    const existed = map.get(uid);
    const amount = Number(o.total_amount) || 0;
    if (existed) {
      existed.orderCount += 1;
      existed.gmv += amount;
      if (o.status === "paid") existed.paidGmv += amount;
      if (o.created_at < existed.firstOrderAt) existed.firstOrderAt = o.created_at;
      if (o.created_at > existed.lastOrderAt) existed.lastOrderAt = o.created_at;
      existed.orderIds.push(o.id);
    } else {
      map.set(uid, {
        userId: uid,
        firstOrderAt: o.created_at,
        lastOrderAt: o.created_at,
        orderCount: 1,
        gmv: amount,
        paidGmv: o.status === "paid" ? amount : 0,
        orderIds: [o.id],
      });
    }
  });

  let list = Array.from(map.values());

  // 查 profiles 补充昵称/手机号
  const userIds = list.map((c) => c.userId).filter((id) => id && id !== "guest");
  let profilesMap = new Map<string, { full_name?: string; phone?: string; avatar_url?: string }>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, phone, avatar_url")
      .in("id", userIds);
    (profiles || []).forEach((p) => profilesMap.set(p.id, p));
  }

  // 查最近试衣记录
  const allOrderIds = list.flatMap((c) => c.orderIds);
  let tryonMap = new Map<string, { created_at: string; result_image_url?: string; product_title?: string }>();
  if (allOrderIds.length) {
    const { data: tryons } = await supabase
      .from("tryon_records")
      .select("order_id, created_at, result_image_url, product_id, products(title)")
      .in("order_id", allOrderIds)
      .order("created_at", { ascending: false })
      .limit(50);
    (tryons || []).forEach((t: any) => {
      if (t.order_id && !tryonMap.has(t.order_id)) {
        tryonMap.set(t.order_id, {
          created_at: t.created_at,
          result_image_url: t.result_image_url,
          product_title: t.products?.title,
        });
      }
    });
  }

  list = list.map((c) => {
    const p = profilesMap.get(c.userId);
    const lastTryon = c.orderIds
      .map((oid) => tryonMap.get(oid))
      .filter(Boolean)[0];
    return {
      ...c,
      name: p?.full_name || "匿名客户",
      phone: p?.phone || "",
      avatar: p?.avatar_url || "",
      lastTryon: lastTryon || null,
    };
  });

  // 分页
  const total = list.length;
  const paged = list.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    valid: true,
    customers: paged,
    pagination: { page, pageSize, total },
  });
}

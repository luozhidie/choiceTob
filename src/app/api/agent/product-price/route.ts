// 代理自定义卖价（对客价）
// GET: 列出已发布商品 + 该代理的自定义卖价
// POST: 设置某商品自定义卖价（分），防止客户看到批发价
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
    const uid = await resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const supabase = getServiceRoleClient();
    const { data: products } = await supabase
      .from("products")
      .select("id, title, cover_image, price, params")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    const { data: prices } = await supabase
      .from("agent_product_prices")
      .select("product_id, custom_price")
      .eq("agent_id", uid);
    const map = new Map((prices || []).map((p: any) => [p.product_id, p.custom_price]));
    const list = (products || []).map((p: any) => ({
      product_id: p.id,
      title: p.title,
      cover_image: p.cover_image || null,
      retail_price: p.price || 0,
      custom_price: map.has(p.id) ? map.get(p.id) : null,
      style: (p.params && typeof p.params.style === "string" && p.params.style) || "",
    }));
    return NextResponse.json({ products: list });
  } catch (err: any) {
    console.error("[agent/product-price]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const uid = await resolveUid(request);
    if (!uid) return NextResponse.json({ error: "未登录" }, { status: 401 });
    const body = await request.json();
    const product_id = body.product_id;
    const custom_price = Math.round(Number(body.custom_price));
    if (!product_id || !custom_price || custom_price <= 0) {
      return NextResponse.json({ error: "自定义卖价无效" }, { status: 400 });
    }
    const supabase = getServiceRoleClient();
    const { data: prod } = await supabase
      .from("products")
      .select("id")
      .eq("id", product_id)
      .maybeSingle();
    if (!prod) return NextResponse.json({ error: "商品不存在" }, { status: 404 });
    await supabase.from("agent_product_prices").upsert(
      { agent_id: uid, product_id, custom_price, updated_at: new Date().toISOString() },
      { onConflict: "agent_id,product_id" }
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[agent/product-price]", err);
    return NextResponse.json({ error: err.message || "系统错误" }, { status: 500 });
  }
}

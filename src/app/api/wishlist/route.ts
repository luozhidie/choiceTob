// 心愿单 API：查询 / 增删（用户侧）
// GET  /api/wishlist?product_id=xxx  -> { success, wished }
// GET  /api/wishlist                 -> { success, items:[{id,title,cover_image,price,wishlist_mode}] }
// POST /api/wishlist                 -> body { product_id, action:'add'|'remove' }
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 用 Authorization: Bearer <token> 校验用户身份，返回 user 或 null
async function getUserFromToken(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function GET(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const productId = new URL(request.url).searchParams.get("product_id");

  // 单品是否已加入心愿单
  if (productId) {
    const { count } = await supabase
      .from("product_wishes")
      .select("*", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("user_id", user.id);
    return NextResponse.json({ success: true, wished: (count || 0) > 0 });
  }

  // 列出我的全部心愿商品（含商品摘要）
  const { data: wishes, error } = await supabase
    .from("product_wishes")
    .select("product_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  const ids = (wishes || []).map((w: any) => w.product_id);
  if (ids.length === 0) {
    return NextResponse.json({ success: true, items: [] });
  }

  const { data: products } = await supabase
    .from("products")
    .select("id, title, cover_image, price, wholesale_price, bulk_price, wishlist_mode, is_published")
    .in("id", ids);

  const byId: Record<string, any> = {};
  (products || []).forEach((p: any) => { byId[p.id] = p; });

  // 批量拉取心愿数（service_role 直查 product_wish_counts 视图，沉默降级）
  const wishCounts: Record<string, number> = {};
  try {
    const { data: wc } = await supabase
      .from("product_wish_counts")
      .select("product_id, wish_count")
      .in("product_id", ids);
    (wc || []).forEach((r: any) => { wishCounts[r.product_id] = Number(r.wish_count) || 0; });
  } catch (e) { /* 视图不存在或被 RLS 限制时静默降级 */ }

  const items = (wishes || []).map((w: any) => {
    const p = byId[w.product_id] || {};
    return {
      id: w.product_id,
      title: p.title || "商品",
      cover_image: p.cover_image || null,
      price: p.price || 0,
      wholesale_price: p.wholesale_price || null,
      bulk_price: p.bulk_price || null,
      wishlist_mode: !!p.wishlist_mode,
      is_published: p.is_published ?? true,
      wish_count: wishCounts[w.product_id] || 0,
      created_at: w.created_at,
    };
  });

  return NextResponse.json({ success: true, items });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromToken(request);
  if (!user) return NextResponse.json({ success: false, error: "未登录" }, { status: 401 });

  let body: any = {};
  try { body = await request.json(); } catch { /* ignore */ }
  const productId = body.product_id;
  const action = body.action === "remove" ? "remove" : "add";
  if (!productId) return NextResponse.json({ success: false, error: "缺少 product_id" }, { status: 400 });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    if (action === "add") {
      const { error } = await supabase
        .from("product_wishes")
        .upsert({ product_id: productId, user_id: user.id }, { onConflict: "product_id,user_id" });
      if (error) throw error;
      return NextResponse.json({ success: true, wished: true });
    } else {
      const { error } = await supabase
        .from("product_wishes")
        .delete()
        .eq("product_id", productId)
        .eq("user_id", user.id);
      if (error) throw error;
      return NextResponse.json({ success: true, wished: false });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

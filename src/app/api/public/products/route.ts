// 公开 API：获取商品（前台首页/版块使用）
// 优先用 service_role_key 绕过 RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

function formatProducts(data: any[]) {
  return data.map((p: any) => ({
    id: p.id,
    name: p.name || p.title || "商品",
    title: p.title || p.name || "商品",
    price: p.price || 0,
    original_price: p.original_price || null,
    wholesale_price: p.wholesale_price || null,
    image_url: p.image_url || p.cover_image,
    cover_image: p.cover_image || p.image_url,
    images: p.images || null,
    category: p.category || null,
    sub_category: p.sub_category || p.subcategory || null,
    subcategory: p.sub_category || p.subcategory || null,
    description: p.description || null,
    is_published: p.is_published ?? true,
    stock: p.stock ?? 0,
    tags: p.tags || null,
  }));
}

async function queryWithClient(supabase: ReturnType<typeof createClient>, request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  const idsParam = searchParams.get("ids") || "";
  const singleId = searchParams.get("id") || ""; // 商品详情页用

  // 按 ID 单条查询（给商品详情页用）
  if (singleId) {
    // 先查 products 表
    let { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", singleId)
      .limit(1);
    if (data && data.length > 0 && !error) {
      return { success: true, data: [data[0]], error: null };
    }
    // 再查 buyer_products 表
    const bp = await supabase
      .from("buyer_products")
      .select("*")
      .eq("id", singleId)
      .limit(1);
    if (bp.data && bp.data.length > 0 && !bp.error) {
      return { success: true, data: [bp.data[0]], error: null };
    }
    return { success: false, data: [], error: error || bp.error };
  }

  // 按ID批量查
  if (idsParam) {
    const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
    if (ids.length > 0) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", ids)
        .limit(ids.length);
      if (error) return { error };
      return { success: true, data: formatProducts(data || []), error: null };
    }
  }

  // 分类/全部查询
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);

  let { data, error } = await query;

  if ((!data || data.length === 0) && !error) {
    let fallbackQuery = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (category) fallbackQuery = fallbackQuery.eq("category", category);
    const fb = await fallbackQuery;
    data = fb.data;
    error = fb.error;
  }

  if ((!data || data.length === 0) && error?.code === "42703") {
    let rawQuery = supabase.from("products").select("*").limit(limit);
    if (category) rawQuery = rawQuery.eq("category", category);
    const rw = await rawQuery;
    data = rw.data;
    error = rw.error;
  }

  return { success: true, data: formatProducts(data || []), error };
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // 方式1: service_role_key
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const result = await queryWithClient(supabase, request);
      if (!result.error && result.success !== false) {
        return NextResponse.json(result);
      }
    } catch {}
  }

  // 方式2: 降级到 anon key
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const result = await queryWithClient(supabase, request);
      if (result.error) {
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }
      return NextResponse.json(result);
    } catch {}
  }

  return NextResponse.json({ success: true, data: [] });
}

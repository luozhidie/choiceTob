// 公开 API：获取商品（前台首页/版块使用）
// 优先用 service_role_key 绕过 RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// 正确的 publishable key（公开安全，作为环境变量缺失时的兜底）
const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function formatProducts(data: any[]) {
  return data.map((p: any) => ({
    id: p.id,
    name: p.name || p.title || "商品",
    title: p.title || p.name || "商品",
    price: p.price || 0,
    original_price: p.original_price || null,
    wholesale_price: p.wholesale_price || null,
    bulk_price: p.bulk_price || null,
    image_url: p.image_url || p.cover_image,
    cover_image: p.cover_image || p.image_url,
    images: p.images || null,
    category: p.category || null,
    sub_category: p.sub_category || p.subcategory || null,
    subcategory: p.sub_category || p.subcategory || null,
    description: p.description || null,
    is_published: p.is_published ?? true,
    stock: p.stock ?? 0,
    sales: p.sales || 0,
    created_at: p.created_at || null,
  }));
}

async function queryWithClient(supabase: ReturnType<typeof createClient>, request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const limit = parseInt(searchParams.get("limit") || "20");
  const idsParam = searchParams.get("ids") || "";
  const singleId = searchParams.get("id") || "";

  // 按 ID 单条查询（给商品详情页用）
  if (singleId) {
    // 并行查两个表，提升速度
    const [pResult, bpResult] = await Promise.all([
      supabase.from("products").select("*").eq("id", singleId).maybeSingle(),
      supabase.from("buyer_products").select("*").eq("id", singleId).maybeSingle(),
    ]);

    if (pResult.data) {
      console.log(`[products API] 找到商品 in products: id=${singleId}`);
      return { success: true, data: [pResult.data], error: null };
    }

    if (bpResult.data) {
      console.log(`[products API] 找到商品 in buyer_products: id=${singleId}`);
      return { success: true, data: [bpResult.data], error: null };
    }

    // 两个表都没找到：记录日志，返回空数组
    console.log(`[products API] 商品不存在: id=${singleId}, pError=${pResult.error?.message}, bpError=${bpResult.error?.message}`);
    return { success: true, data: [], error: null };
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

  // 方式1: service_role_key（必须从环境变量读取，不能硬编码）
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const result = await queryWithClient(supabase, request);
      if (result.error) {
        console.error("[products API] service_role 查询出错:", result.error);
      } else {
        return NextResponse.json(result);
      }
    } catch (e: any) {
      console.error("[products API] service_role 异常:", e.message);
    }
  } else {
    console.warn("[products API] 警告: SUPABASE_SERVICE_ROLE_KEY 未设置，使用 anon key（可能被 RLS 限制）");
  }

  // 方式2: 降级到 publishable key（可以硬编码，因为是公开的）
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const result = await queryWithClient(supabase, request);
    if (result.error) {
      console.error("[products API] anon key 查询出错:", result.error);
      return NextResponse.json({ success: false, data: [], error: result.error.message }, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[products API] anon key 异常:", e.message);
    return NextResponse.json({ success: false, data: [], error: e.message }, { status: 500 });
  }
}

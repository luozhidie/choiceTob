// 公开 API：获取商品（前台首页/版块/分类结果页使用）
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
    params: p.params || null,
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
    sizes: p.sizes || null,
    color: p.color || null,
    ship_from: p.ship_from || null,
    ship_est_days: p.ship_est_days ?? null,
    ship_text: p.ship_text || null,
    ship_image: p.ship_image || null,
  }));
}

function applySort(query: any, sort: string) {
  if (sort === "sales") return query.order("sales", { ascending: false });
  if (sort === "price_asc") return query.order("price", { ascending: true });
  if (sort === "price_desc") return query.order("price", { ascending: false });
  if (sort === "newest") return query.order("created_at", { ascending: false });
  return query.order("created_at", { ascending: false });
}

async function queryWithClient(supabase: any, request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const keyword = searchParams.get("keyword") || "";
  const sort = searchParams.get("sort") || "default";
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const priceMin = searchParams.get("priceMin") || "";
  const priceMax = searchParams.get("priceMax") || "";
  const idsParam = searchParams.get("ids") || "";
  const singleId = searchParams.get("id") || "";

  // 按 ID 单条查询（给商品详情页用）
  if (singleId) {
    const [pResult, bpResult] = await Promise.all([
      supabase.from("products").select("*").eq("id", singleId).maybeSingle(),
      supabase.from("buyer_products").select("*").eq("id", singleId).maybeSingle(),
    ]);
    if (pResult.data) return { success: true, data: [pResult.data], error: null };
    if (bpResult.data) return { success: true, data: [bpResult.data], error: null };
    return { success: true, data: [], error: null };
  }

  // 按ID批量查
  if (idsParam) {
    const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
    if (ids.length > 0) {
      const { data, error } = await supabase.from("products").select("*").in("id", ids).limit(ids.length);
      if (error) return { error };
      return { success: true, data: formatProducts(data || []), error: null };
    }
  }

  // 分类/全部查询
  let query = supabase.from("products").select("*");

  if (category) query = query.eq("category", category);
  if (keyword) query = query.or(`name.ilike.%${keyword}%,title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
  if (priceMin) query = query.gte("price", parseFloat(priceMin) * 100);
  if (priceMax) query = query.lte("price", parseFloat(priceMax) * 100);

  // params 过滤：f[key]=value 或 f[key]=value1,value2
  const filters: Record<string, string[]> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith("f[") && key.endsWith("]")) {
      const paramKey = key.slice(2, -1);
      filters[paramKey] = value.split(",").map(v => v.trim()).filter(Boolean);
    }
  });
  for (const [k, vals] of Object.entries(filters)) {
    // 尺码 / 面料：商品以「/值/」wrap 形式存储，使用 ilike 分词匹配，避免 XS 误命中 S
    if (k === "sizes" || k === "fabrics") {
      const safe = vals.map((v) => v.replace(/\//g, "").trim()).filter(Boolean);
      if (safe.length === 1) {
        query = query.ilike(`params->>${k}`, `%/${safe[0]}/%`);
      } else if (safe.length > 1) {
        query = query.or(
          safe.map((v) => `params->>${k}.ilike.%/${v}/%`).join(",")
        );
      }
    } else if (vals.length === 1) {
      query = query.eq(`params->>${k}`, vals[0]);
    } else if (vals.length > 1) {
      query = query.or(vals.map((v) => `params->>${k}.eq.${v}`).join(","));
    }
  }

  query = applySort(query, sort);
  query = query.range(offset, offset + limit - 1);

  let { data, error } = await query;

  if ((!data || data.length === 0) && !error) {
    let fallbackQuery = supabase.from("products").select("*");
    if (category) fallbackQuery = fallbackQuery.eq("category", category);
    if (keyword) fallbackQuery = fallbackQuery.or(`name.ilike.%${keyword}%,title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    if (priceMin) fallbackQuery = fallbackQuery.gte("price", parseFloat(priceMin) * 100);
    if (priceMax) fallbackQuery = fallbackQuery.lte("price", parseFloat(priceMax) * 100);
    fallbackQuery = applySort(fallbackQuery, sort);
    fallbackQuery = fallbackQuery.range(offset, offset + limit - 1);
    const fb = await fallbackQuery;
    data = fb.data;
    error = fb.error;
  }

  return { success: true, data: formatProducts(data || []), error };
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

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

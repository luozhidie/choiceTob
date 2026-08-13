// 公开 API：获取档口列表 / 单个档口详情（含关联商品）
// 优先用 service_role_key 绕过 RLS，缺失时降级 anon/publishable
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// 正确的 publishable key（公开安全，作为环境变量缺失时的兜底）
const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function formatProduct(p: any) {
  return {
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
    description: p.description || null,
    is_published: p.is_published ?? true,
    stock: p.stock ?? 0,
    sales: p.sales || 0,
    sizes: p.sizes || null,
    color: p.color || null,
  };
}

// 按 product_ids 批量拉取商品，并映射成 { id => product }
async function fetchProductsMap(supabase: ReturnType<typeof createClient>, allIds: string[]) {
  if (allIds.length === 0) return {};
  const uniqueIds = Array.from(new Set(allIds));
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", uniqueIds);
  if (error || !data) return {};
  const map: Record<string, any> = {};
  for (const p of data as any[]) map[p.id] = formatProduct(p);
  return map;
}

async function fetchStalls(supabase: ReturnType<typeof createClient>, opts: {
  id?: string | null;
  market_id?: string | null;
  limit?: number;
  sort?: string | null;
}) {
  const { id, market_id, limit = 20, sort } = opts;

  if (id) {
    const { data, error } = await supabase
      .from("peer_stalls")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return { data, error };
  }

  let query = supabase
    .from("peer_stalls")
    .select("*")
    .eq("is_published", true);

  if (market_id) query = query.eq("market_id", market_id);

  // 排序：default=sort_order；rating=评分；fans=粉丝；reorder=返单率
  if (sort === "rating") query = query.order("rating", { ascending: false });
  else if (sort === "fans") query = query.order("fan_count", { ascending: false });
  else if (sort === "reorder") query = query.order("reorder_rate", { ascending: false });
  else query = query.order("sort_order", { ascending: true });

  query = query.limit(limit);
  const { data, error } = await query;
  return { data, error };
}

async function runWithClient(supabase: ReturnType<typeof createClient>, opts: any) {
  // 1. 取档口
  const { data: stallsRaw, error } = await fetchStalls(supabase, opts);
  if (error) return { error };
  if (!stallsRaw) return { data: opts.id ? null : [] };

  const stalls = Array.isArray(stallsRaw) ? stallsRaw : [stallsRaw];

  // 2. 汇总所有 product_ids，批量取商品
  const allIds: string[] = [];
  for (const s of stalls) {
    if (Array.isArray(s.product_ids)) allIds.push(...s.product_ids);
  }
  const productMap = await fetchProductsMap(supabase, allIds);

  // 3. 组装返回：列表用前 3 个预览商品；详情返回全部商品
  const result = stalls.map((s: any) => {
    const ids: string[] = Array.isArray(s.product_ids) ? s.product_ids : [];
    const products = ids.map((pid) => productMap[pid]).filter(Boolean);
    const previewProducts = opts.id ? products : products.slice(0, 3);
    return { ...s, products, previewProducts };
  });

  return { data: opts.id ? result[0] : result };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const market_id = searchParams.get("market_id");
  const sort = searchParams.get("sort");
  const limit = parseInt(searchParams.get("limit") || "20");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const opts = { id, market_id, sort, limit };

  // 方式1: service_role_key
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await runWithClient(supabase, opts);
      if (!error) return NextResponse.json({ success: true, data: data ?? (id ? null : []) });
    } catch {}
  }

  // 方式2: 降级 publishable key
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
  try {
    const supabase = createClient(supabaseUrl, publishableKey);
    const { data, error } = await runWithClient(supabase, opts);
    if (error) {
      if (error.code === "42P01" || (error as any).message?.includes("does not exist")) {
        return NextResponse.json({ success: true, data: id ? null : [] });
      }
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data ?? (id ? null : []) });
  } catch {}

  return NextResponse.json({ success: true, data: id ? null : [] });
}

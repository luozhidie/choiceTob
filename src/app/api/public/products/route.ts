// 公开 API：获取商品（前台首页/版块/分类结果页使用）
// 优先用 service_role_key 绕过 RLS
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

// 正确的 publishable key（公开安全，作为环境变量缺失时的兜底）
const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function formatProducts(data: any[], wishMap: Record<string, number> = {}) {
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
    style_type: p.style_type || null,
    created_at: p.created_at || null,
    sizes: p.sizes || null,
    color: p.color || null,
    ship_from: p.ship_from || null,
    ship_est_days: p.ship_est_days ?? null,
    ship_text: p.ship_text || null,
    ship_image: p.ship_image || null,
    // 心愿单（需求聚合）模式标记与心愿数，供前台「打码价 + 倒计时」使用
    wishlist_mode: p.wishlist_mode ?? false,
    wish_count: wishMap[p.id] || 0,
  }));
}

/** 批量拉取商品心愿数（service_role 可直查 product_wish_counts 视图） */
async function fetchWishCounts(supabase: any, ids: string[]): Promise<Record<string, number>> {
  const map: Record<string, number> = {};
  if (!ids || ids.length === 0) return map;
  try {
    const { data } = await supabase
      .from("product_wish_counts")
      .select("product_id, wish_count")
      .in("product_id", ids);
    (data || []).forEach((r: any) => {
      map[r.product_id] = Number(r.wish_count) || 0;
    });
  } catch (e) {
    // 视图不存在或被 RLS 限制时静默降级，不影响主流程
  }
  return map;
}

// 中文筛选 key ←→ 商品编辑页英文 params key 的别名映射。
// 历史商品用英文 key 录入，新配置用中文 key，两套都要能筛到。
const KEY_ALIAS: Record<string, string> = {
  面料: "fabric",
  季节: "season",
  领型: "collar",
  版型: "fit",
  袖长: "sleeve_length",
  袖型: "sleeve_type",
  图案: "pattern",
  工艺: "craft",
  裙型: "skirt_type",
  裙长: "skirt_length",
  廓形: "silhouette",
  门襟: "placket",
  厚度: "thickness",
  里布: "lining",
  配件: "accessories",
  穿着场景: "scene",
};

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
  const tagsParam = searchParams.get("tags") || "";
  const singleId = searchParams.get("id") || "";
  // 分类层级顶层参数（市场/风情/风格），并入通用 params 过滤
  const market = searchParams.get("market") || "";
  const vibe = searchParams.get("vibe") || "";
  const style = searchParams.get("style") || "";
  const subcategory = searchParams.get("subcategory") || "";

  // 按 ID 单条查询（给商品详情页用）——保留 select(*) 全字段，仅补充心愿数
  if (singleId) {
    const [pResult, bpResult] = await Promise.all([
      supabase.from("products").select("*").eq("id", singleId).maybeSingle(),
      supabase.from("buyer_products").select("*").eq("id", singleId).maybeSingle(),
    ]);
    const raw: any = pResult.data || bpResult.data;
    if (raw) {
      const wishMap = await fetchWishCounts(supabase, [raw.id]);
      raw.wish_count = wishMap[raw.id] || 0;
      raw.wishlist_mode = raw.wishlist_mode ?? false;
      return { success: true, data: [raw], error: null };
    }
    return { success: true, data: [], error: null };
  }

  // 解析通用 params 过滤
  const filters: Record<string, string[]> = {};
  searchParams.forEach((value, key) => {
    if (key.startsWith("f[") && key.endsWith("]")) {
      const paramKey = key.slice(2, -1);
      filters[paramKey] = value.split(",").map(v => v.trim()).filter(Boolean);
    }
  });
  if (market) filters.market = [market];
  if (vibe) filters.vibe = [vibe];
  if (style) filters.style = [style];

  // 快捷开关（toggle）：映射到真实业务字段，而不是去 params 里找不存在的键
  function applyToggle(query: any, key: string) {
    switch (key) {
      case "in_stock":        // 现货：有库存
        return query.gt("stock", 0);
      case "bulk_price":      // 批量采购价：填了批量价
        return query.gt("bulk_price", 0);
      case "is_special":      // 特价：有划线原价
        return query.gt("original_price", 0);
      case "source_brand":    // 源头厂牌：商品参数里标记
        return query.or("params->>source_brand.eq.1,params->>source_brand.eq.true");
      case "subscribed_stall": // 订阅风格：前端按本地订阅列表过滤，后端放行
        return query;
      default:
        return query;
    }
  }

  // 近期上新：今日上新 / 近3日上新 / 近7日上新
  function applyRecent(query: any, vals: string[]) {
    const v = vals[0] || "";
    const days = v.indexOf("今日") >= 0 ? 1 : v.indexOf("3") >= 0 ? 3 : v.indexOf("7") >= 0 ? 7 : 0;
    if (!days) return query;
    return query.gte("created_at", new Date(Date.now() - days * 86400000).toISOString());
  }

  const TOGGLE_KEYS = ["in_stock", "bulk_price", "is_special", "source_brand", "subscribed_stall"];

  function applyFilters(query: any) {
    if (keyword) query = query.or(`name.ilike.%${keyword}%,title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    if (priceMin) query = query.gte("price", parseFloat(priceMin) * 100);
    if (priceMax) query = query.lte("price", parseFloat(priceMax) * 100);

    for (const [k, vals] of Object.entries(filters)) {
      if (!vals || vals.length === 0) continue;

      // 1) 快捷开关
      if (TOGGLE_KEYS.indexOf(k) >= 0) { query = applyToggle(query, k); continue; }
      // 2) 近期上新
      if (k === "recent") { query = applyRecent(query, vals); continue; }

      // 2.5) 风格：支持多选（params.style 以逗号分隔，如 "少女型,优雅型"）。
      //      不能简单 eq 整串，需按子串包含匹配，且避免 "优雅" 误中 "优雅型"。
      if (k === "style") {
        const stVals = vals
          .join(",")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const conds: string[] = [];
        stVals.forEach((v) => {
          conds.push(`params->>style.eq.${v}`);          // 精确（仅一个风格）
          conds.push(`params->>style.ilike.${v},%`);      // 开头："优雅型,..."
          conds.push(`params->>style.ilike.%,${v}`);      // 结尾："...,优雅型"
        });
        if (conds.length) query = query.or(conds.join(","));
        continue;
      }

      // 3) 普通属性：单选存纯值「圆领」，多选存 wrap 值「/圆领/V领/」，两种都要命中；
      //    同时兼容中文 key（面料）与英文 key（fabric）两套录入历史
      const safe = vals.map((v) => v.replace(/[/,]/g, "").trim()).filter(Boolean);
      if (safe.length === 0) continue;
      const keys = [k];
      const alias = KEY_ALIAS[k];
      if (alias) keys.push(alias);

      const conds: string[] = [];
      keys.forEach((kk) => {
        safe.forEach((v) => {
          conds.push(`params->>${kk}.eq.${v}`);
          conds.push(`params->>${kk}.ilike.%/${v}/%`);
        });
      });
      query = query.or(conds.join(","));
    }
    return query;
  }

  // 按ID批量查（也支持附加筛选/排序）
  if (idsParam) {
    const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
    if (ids.length > 0) {
      let query = supabase.from("products").select("*").in("id", ids);
      query = applyFilters(query);
      query = applySort(query, sort);
      const { data, error } = await query;
      if (error) return { error };
      const wishMap = await fetchWishCounts(supabase, (data || []).map((p: any) => p.id));
      return { success: true, data: formatProducts(data || [], wishMap), error: null };
    }
  }

  // 分类/全部查询
  let query = supabase.from("products").select("*");

  // 默认隐藏未填库存(数量0)的未完成商品，避免买手端看到空白商品
  if (!filters.in_stock) query = query.gt("stock", 0);
  if (category) query = query.eq("category", category);
  if (subcategory) query = query.eq("subcategory", subcategory);
  if (tagsParam) {
    const tags = tagsParam.split(",").map(s => s.trim()).filter(Boolean);
    if (tags.length > 0) query = query.overlaps("tags", tags);
  }
  query = applyFilters(query);

  query = applySort(query, sort);
  query = query.range(offset, offset + limit - 1);

  let { data, error } = await query;

  if ((!data || data.length === 0) && !error) {
    let fallbackQuery = supabase.from("products").select("*");
    if (!filters.in_stock) fallbackQuery = fallbackQuery.gt("stock", 0);
    if (category) fallbackQuery = fallbackQuery.eq("category", category);
    if (subcategory) fallbackQuery = fallbackQuery.eq("subcategory", subcategory);
    if (market) fallbackQuery = fallbackQuery.eq("params->>market", market);
    if (vibe) fallbackQuery = fallbackQuery.eq("params->>vibe", vibe);
    if (style) {
      const stVals = style.split(",").map((s) => s.trim()).filter(Boolean);
      const stConds: string[] = [];
      stVals.forEach((v) => {
        stConds.push(`params->>style.eq.${v}`);
        stConds.push(`params->>style.ilike.${v},%`);
        stConds.push(`params->>style.ilike.%,${v}`);
      });
      if (stConds.length) fallbackQuery = fallbackQuery.or(stConds.join(","));
    }
    if (keyword) fallbackQuery = fallbackQuery.or(`name.ilike.%${keyword}%,title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    if (priceMin) fallbackQuery = fallbackQuery.gte("price", parseFloat(priceMin) * 100);
    if (priceMax) fallbackQuery = fallbackQuery.lte("price", parseFloat(priceMax) * 100);
    fallbackQuery = applySort(fallbackQuery, sort);
    fallbackQuery = fallbackQuery.range(offset, offset + limit - 1);
    const fb = await fallbackQuery;
    data = fb.data;
    error = fb.error;
  }

  const wishMap = await fetchWishCounts(supabase, (data || []).map((p: any) => p.id));
  return { success: true, data: formatProducts(data || [], wishMap), error };
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

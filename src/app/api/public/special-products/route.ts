// 公开 API：特价·换季清仓商品（按折扣自动筛选，供首页 special 货架模块使用）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const FALLBACK_PUBLISHABLE = "sb_publishable_gQlwSK2XDm52k-z5iDhemg_yUJeBSCW";

function yuan(n: number) {
  return n ? (n / 100).toFixed(2) : "0";
}

// 折扣比 = 批发价 / 零售价（均按“分”存储）
function ratioOf(p: any): number | null {
  const retail = Number(p.price) || 0;
  const wholesale = Number(p.wholesale_price) || 0;
  if (retail <= 0 || wholesale <= 0) return null;
  return wholesale / retail;
}

function decorate(p: any) {
  const ratio = ratioOf(p);
  const retail = Number(p.price) || 0;
  const wholesale = Number(p.wholesale_price) || 0;
  let discountText = "";
  if (ratio != null && ratio > 0 && ratio < 1) {
    discountText = Math.round(ratio * 100) / 10 + "折"; // 0.3 -> 3折
  }
  return {
    id: p.id,
    name: p.name || p.title || "商品",
    title: p.title || p.name || "商品",
    price: retail,
    priceText: yuan(retail),
    wholesale_price: wholesale,
    wholesaleText: wholesale ? "¥" + yuan(wholesale) : "",
    original_price: p.original_price || null,
    image_url: p.image_url || p.cover_image,
    cover_image: p.cover_image || p.image_url,
    category: p.category || null,
    sub_category: p.sub_category || p.subcategory || null,
    sales: p.sales || 0,
    created_at: p.created_at || null,
    is_new: (p.sales || 0) === 0,
    ratio,
    discountText,
    savedText: retail && wholesale ? "省¥" + yuan(retail - wholesale) : "",
  };
}

async function getProducts(supabase: ReturnType<typeof createClient>, limit = 600) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  // 同时尝试 buyer_products（与 /api/public/products 保持一致）
  const { data: bp } = await supabase
    .from("buyer_products")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return [...(data || []), ...(bp || [])];
}

function filterByMode(all: any[], mode: string, take: number): any[] {
  let list: any[] = [];
  if (mode === "below30") {
    list = all.filter((x) => x.ratio <= 0.3).sort((a, b) => a.ratio - b.ratio);
  } else if (mode === "first_drop") {
    list = all.filter((x) => x.is_new).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  } else if (mode === "offseason") {
    // 反季清仓：折扣深的（后续可接商品季节标签做更精确筛选）
    list = all.filter((x) => x.ratio <= 0.5).sort((a, b) => a.ratio - b.ratio);
  } else {
    // special 特价甄选：有折扣的全部，按折扣从大到小
    list = all.filter((x) => x.ratio < 1).sort((a, b) => a.ratio - b.ratio);
  }
  return list.slice(0, take);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "special";
    const take = Math.min(parseInt(searchParams.get("limit") || "20"), 60);
    const ids = searchParams.get("ids");
    const excludeRaw = searchParams.get("exclude");
    const excludeSet = new Set(
      (excludeRaw || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_PUBLISHABLE;
    const supabase = createClient(supabaseUrl, key);

    // 自动拉取的同款去重/排除：decorate 后过滤掉 ratio 无效或用户排除的商品
    const decorateAndFilter = (raw: any[]) =>
      raw.map(decorate).filter((x) => x.ratio != null && !excludeSet.has(x.id));

    // 手动挑选：按 ids 取指定商品，再走同一套折扣/tab 逻辑（避免自动拉取导致同款重复进多个货架）
    if (ids) {
      const idList = ids
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (idList.length > 0) {
        const { data: pd } = await supabase.from("products").select("*").in("id", idList);
        const { data: bpd } = await supabase.from("buyer_products").select("*").in("id", idList);
        const seen = new Set<string>();
        const raw = [...(pd || []), ...(bpd || [])].filter((p: any) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        const all = decorateAndFilter(raw);
        return NextResponse.json({ success: true, mode, manual: true, data: filterByMode(all, mode, 100) });
      }
    }

    const raw = await getProducts(supabase);
    const all = decorateAndFilter(raw);
    return NextResponse.json({ success: true, mode, data: filterByMode(all, mode, take) });
  } catch (err: any) {
    return NextResponse.json({ success: false, data: [], error: err.message }, { status: 500 });
  }
}

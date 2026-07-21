import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const SECRET = "lzd-fix-pricerule-2026";

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== SECRET) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
  const { data: rows } = await supabase
    .from("products")
    .select("id,title,price,original_price,params");
  const withSet = (rows || []).filter((r: any) => r.params && Array.isArray(r.params.set_items) && r.params.set_items.length > 0);
  return NextResponse.json({
    total_products: count,
    products: (rows || []).map((r: any) => ({
      title: r.title,
      price: r.price,
      original_price: r.original_price,
      has_set_items: !!(r.params && Array.isArray(r.params.set_items) && r.params.set_items.length),
    })),
    withSetCount: withSet.length,
  });
}

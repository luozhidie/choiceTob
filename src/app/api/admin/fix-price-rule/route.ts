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
  const { data: rows, error } = await supabase.from("products").select("id,price,original_price,params");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const log: any[] = [];
  let done = 0;
  for (const r of (rows || [])) {
    const items = (r.params && Array.isArray(r.params.set_items)) ? r.params.set_items : [];
    let retailSum = 0;
    items.forEach((it: any) => { retailSum += Number(it.retail) || 0; });
    const target = retailSum > 0 ? retailSum : r.price; // 原价 = 部件零售总和（无套装则等于零售价）
    if (target !== r.original_price) {
      const { error: e2 } = await supabase.from("products").update({ original_price: target }).eq("id", r.id);
      if (!e2) { done++; log.push({ price: r.price, original_price_new: target }); }
    }
  }
  return NextResponse.json({ checked: (rows || []).length, done, log });
}

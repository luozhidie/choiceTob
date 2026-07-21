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
  // 原价 = 套装各部件零售价总和（分）；零售价保持实际售价不变
  const { data: rows, error } = await supabase
    .from("products")
    .select("id,title,price,original_price,params")
    .not("price", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const log: any[] = [];
  let done = 0;
  for (const r of (rows || [])) {
    const items = (r.params && Array.isArray(r.params.set_items)) ? r.params.set_items : [];
    let retailSum = 0;
    items.forEach((it: any) => { retailSum += Number(it.retail) || 0; });
    if (retailSum > 0 && retailSum !== r.original_price) {
      const { error: e2 } = await supabase
        .from("products")
        .update({ original_price: retailSum })
        .eq("id", r.id);
      if (!e2) { done++; log.push({ title: r.title, price: r.price, original_price: retailSum, setRetailSum: retailSum }); }
    }
  }
  return NextResponse.json({ checked: (rows || []).length, done, log });
}

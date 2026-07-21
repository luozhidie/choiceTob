import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const SECRET = "lzd-fix-pricerule-2026";

// 用户指定：原价=价格总和 3529（含待加背心），零售价=实际售价 2395
const NEW_ORIGINAL = 352900;

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== SECRET) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: rows, error } = await supabase.from("products").select("id,price,original_price");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const log: any[] = [];
  let done = 0;
  for (const r of (rows || [])) {
    if (r.original_price !== NEW_ORIGINAL) {
      const { error: e2 } = await supabase.from("products").update({ original_price: NEW_ORIGINAL }).eq("id", r.id);
      if (!e2) { done++; log.push({ id: r.id, price: r.price, original_price_old: r.original_price, original_price_new: NEW_ORIGINAL }); }
    }
  }
  return NextResponse.json({ checked: (rows || []).length, done, log });
}

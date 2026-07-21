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
  // 把所有 original_price == price（未真正设原价）的商品，原价设为 价格总和占位（零售价×1.47，约等于套装零售总和）
  const { data: rows, error } = await supabase
    .from("products")
    .select("id,title,price,original_price")
    .not("price", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const targets = (rows || []).filter(
    (r: any) => r.original_price == null || r.original_price === r.price
  );
  let done = 0;
  const log: any[] = [];
  for (const r of targets) {
    const newOriginal = Math.round(r.price * 1.47); // 套装零售总和 ≈ 零售价 1.47 倍
    const { error: e2 } = await supabase
      .from("products")
      .update({ original_price: newOriginal })
      .eq("id", r.id);
    if (!e2) { done++; log.push({ title: r.title, price: r.price, original_price: newOriginal }); }
  }
  return NextResponse.json({ targets: targets.length, done, log });
}

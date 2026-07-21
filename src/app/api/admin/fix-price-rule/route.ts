// 一次性脚本：把「原价 < 零售价」的填反数据对调（新规则下原价=价格总和，零售价=促销价）
// 用完即删。需带 ?token 调用。
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SECRET = "lzd-fix-pricerule-2026";

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token");
  if (token !== SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: rows, error } = await supabase
    .from("products")
    .select("id,title,price,original_price")
    .not("original_price", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const backwards = (rows || []).filter(
    (r: any) => r.original_price != null && r.original_price < r.price
  );

  let swapped = 0;
  for (const r of backwards) {
    const { error: e2 } = await supabase
      .from("products")
      .update({ price: r.original_price, original_price: r.price })
      .eq("id", r.id);
    if (!e2) swapped++;
  }

  return NextResponse.json({
    total_checked: (rows || []).length,
    to_swap: backwards.length,
    swapped,
    sample: backwards.slice(0, 10).map((r: any) => ({
      title: r.title,
      old_retail: r.price,
      old_original: r.original_price,
    })),
  });
}

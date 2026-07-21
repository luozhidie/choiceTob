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
  const dump = (rows || []).map((r: any) => ({
    price: r.price,
    original_price: r.original_price,
    params_keys: r.params ? Object.keys(r.params) : null,
    set_items: r.params && r.params.set_items ? r.params.set_items : null,
  }));
  return NextResponse.json({ dump });
}

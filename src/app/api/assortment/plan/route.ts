import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { computeAssortment, MixInput } from "@/lib/assortment/engine";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("服务器配置错误");
  return createServiceClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET /api/assortment/plan?store_id=xxx  -> 最新方案
export async function GET(req: NextRequest) {
  try {
    const storeId = req.nextUrl.searchParams.get("store_id");
    if (!storeId) return NextResponse.json({ error: "缺少 store_id" }, { status: 400 });
    const supabase = client();
    const { data, error } = await supabase
      .from("store_assortment_plan")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0)
      return NextResponse.json({ error: "尚未生成组货方案" }, { status: 404 });
    return NextResponse.json({ plan: data[0].plan_json, total_sku: data[0].total_sku, area: data[0].area });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "查询失败" }, { status: 500 });
  }
}

// POST /api/assortment/plan  { store_id, area, mix? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const storeId = body.store_id ? String(body.store_id) : null;
    const area = Number(body.area);
    if (!storeId) return NextResponse.json({ error: "缺少 store_id" }, { status: 400 });
    if (!area || area <= 0) return NextResponse.json({ error: "area 必须为正数" }, { status: 400 });

    const overrideMix: MixInput[] | undefined = Array.isArray(body.mix)
      ? body.mix.map((m: any) => ({ style_code: String(m.style_code), vip_count: Number(m.vip_count) }))
      : undefined;

    const supabase = client();
    const plan = await computeAssortment(supabase, storeId, area, overrideMix);

    const { error } = await supabase.from("store_assortment_plan").insert({
      store_id: storeId,
      area,
      total_sku: plan.total_sku,
      plan_json: plan,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    console.error("[assortment/plan] error:", err);
    return NextResponse.json({ error: err.message || "生成失败" }, { status: 500 });
  }
}

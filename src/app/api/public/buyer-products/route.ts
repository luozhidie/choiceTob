// 公开 API：获取买手选品（前台版块用）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const idsParam = searchParams.get("ids") || "";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let query = supabase
      .from("buyer_products")
      .select("id, title, name, price, cover_image, image_url, category, subcategory")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .limit(limit);

    if (idsParam) {
      const ids = idsParam.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        query = query.in("id", ids);
      }
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const products = (data || []).map((p: any) => ({
      id: p.id,
      name: p.title || p.name || "选品",
      price: p.price || 0,
      image_url: p.cover_image || p.image_url || "",
      category: p.category || "",
      sub_category: p.subcategory || "",
    }));

    return NextResponse.json({ success: true, data: products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

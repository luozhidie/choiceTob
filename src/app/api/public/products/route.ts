// 公开 API：获取已发布商品（前台首页/版块使用）
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
      .from("products")
      .select("id, name, title, price, image_url, cover_image, category, sub_category, subcategory, is_published")
      .eq("is_published", true)
      .limit(limit);

    if (category) query = query.eq("category", category);

    // 支持按ID筛选（逗号分隔）
    if (idsParam) {
      const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) query = query.in("id", ids);
    }

    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 统一字段名返回
    const products = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name || p.title || "商品",
      price: p.price || 0,
      image_url: p.image_url || p.cover_image,
      category: p.category,
      sub_category: p.sub_category || p.subcategory,
    }));

    return NextResponse.json({ success: true, data: products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

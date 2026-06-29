// 公开 API：获取商品（前台首页/版块使用）
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

    // 支持按ID筛选（管理员指定商品时不过滤发布状态）
    if (idsParam) {
      const ids = idsParam.split(",").map(s => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        const { data, error } = await supabase
          .from("products")
          .select("id, name, title, price, image_url, cover_image, category, sub_category, subcategory")
          .in("id", ids)
          .limit(ids.length);

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, data: formatProducts(data || []) });
      }
    }

    // 按分类加载（只显示已发布的）
    let query = supabase
      .from("products")
      .select("id, name, title, price, image_url, cover_image, category, sub_category, subcategory, is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);

    const { data, error } = await query;

    if (error) {
      // is_published 列不存在时 fallback（不过滤）
      if (error.code === "42703") {
        const fallbackQuery = supabase
          .from("products")
          .select("id, name, title, price, image_url, cover_image, category, sub_category, subcategory")
          .limit(limit);
        if (category) fallbackQuery.eq("category", category);
        const { data: fd, error: fe } = await fallbackQuery;
        if (fe) return NextResponse.json({ error: fe.message }, { status: 500 });
        return NextResponse.json({ success: true, data: formatProducts(fd || []) });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: formatProducts(data || []) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatProducts(data: any[]) {
  return data.map((p: any) => ({
    id: p.id,
    name: p.name || p.title || "商品",
    price: p.price || 0,
    image_url: p.image_url || p.cover_image,
    category: p.category,
    sub_category: p.sub_category || p.subcategory,
  }));
}

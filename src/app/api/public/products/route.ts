// 公开 API：获取商品（前台首页/版块使用）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    const idsParam = searchParams.get("ids") || "";

    
    // 按ID查：不过滤任何状态
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

    // 分类/全部查询：先尝试已发布，为空则返回全部
    let query = supabase
      .from("products")
      .select("id, name, title, price, image_url, cover_image, category, sub_category, subcategory, is_published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);

    let { data, error } = await query;

    // 第一级结果为空 → 去掉 is_published 过滤再试
    if ((!data || data.length === 0) && !error) {
      let fallbackQuery = supabase
        .from("products")
        .select("id, name, title, price, image_url, cover_image, category, sub_category, subcategory")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (category) fallbackQuery = fallbackQuery.eq("category", category);
      const fb = await fallbackQuery;
      data = fb.data;
      error = fb.error;
    }

    // 再不行，is_published 列可能不存在
    if ((!data || data.length === 0) && error?.code === "42703") {
      let rawQuery = supabase
        .from("products")
        .select("*")
        .limit(limit);
      if (category) rawQuery = rawQuery.eq("category", category);
      const rw = await rawQuery;
      data = rw.data;
      error = rw.error;
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

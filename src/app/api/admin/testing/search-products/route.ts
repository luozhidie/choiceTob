// 后端搜索商品API（绕过RLS，用Service Role Key）
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    // 验证管理员cookie
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ products: [] });
    }

    // 用Service Role Key绕过RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 搜索 products 表和 buyer_products 表
    const [productsRes, buyerProductsRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, cover_image, price, is_published")
        .ilike("title", `%${query}%`)
        .limit(10),
      supabase
        .from("buyer_products")
        .select("id, title, cover_image, price")
        .ilike("title", `%${query}%`)
        .limit(10),
    ]);

    const products = [
      ...(productsRes.data || []).map((p: any) => ({ ...p, source: "platform" })),
      ...(buyerProductsRes.data || []).map((p: any) => ({ ...p, source: "buyer" })),
    ];

    return NextResponse.json({ products });
  } catch (err: any) {
    console.error("[搜索商品API错误]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

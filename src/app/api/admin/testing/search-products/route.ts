// 后端搜索商品API - 直接调用Supabase REST API绕过RLS
import { NextRequest, NextResponse } from "next/server";

// 直接用HTTP调Supabase REST API（不需要JS客户端）
async function querySupabase(table: string, select: string, filters: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(`${url}/rest/v1/${table}?${select}${filters}`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`,
    },
  });

  if (!res.ok) {
    const text = await text.text();
    console.error(`[Supabase查询错误] ${table}:`, text);
    return [];
  }

  return await res.json();
}

export async function POST(request: NextRequest) {
  try {
    // 验证管理员cookie
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("admin_logged_in=true")) {
      return NextResponse.json({ error: "未授权", products: [] }, { status: 401 });
    }

    const body = await request.json();
    const query = body?.query?.trim() || "";

    if (!query) {
      return NextResponse.json({ products: [], message: "请输入搜索关键词" });
    }

    console.log(`[测款搜索] 关键词: "${query}"`);

    // 同时搜索 products 和 buyer_products 两张表
    const [platformProducts, buyerProducts] = await Promise.all([
      querySupabase(
        "products",
        "id,title,cover_image,price,is_published",
        `&title=ilike.*${encodeURIComponent(query)}*`
      ),
      querySupabase(
        "buyer_products",
        "id,title,cover_image,price",
        `&title=ilike.*${encodeURIComponent(query)}*`
      ),
    ]);

    const products = [
      ...(platformProducts || []).map((p: any) => ({ ...p, source: "platform" as const })),
      ...(buyerProducts || []).map((p: any) => ({ ...p, source: "buyer" as const })),
    ];

    console.log(`[测款搜索] 结果: products=${platformProducts?.length||0}, buyer=${buyerProducts?.length||0}, 总计=${products.length}`);

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (err: any) {
    console.error("[搜索商品API错误]", err);
    return NextResponse.json({ error: err.message, products: [] }, { status: 500 });
  }
}

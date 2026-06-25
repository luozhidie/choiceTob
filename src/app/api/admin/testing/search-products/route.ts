// 后端搜索商品API - 直接调用Supabase REST API绕过RLS
import { NextRequest, NextResponse } from "next/server";

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
    const text = await res.text();
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
    let query = body?.query?.trim() || "";

    if (!query) {
      return NextResponse.json({ products: [], message: "请输入搜索关键词" });
    }

    console.log(`[测款搜索] 关键词: "${query}"`);

    // 关键改进：多关键词用 OR 匹配（空格分隔的每个词独立匹配）
    // "旗袍 连衣裙" → 搜标题含"旗袍" OR 含"连衣裙" 的商品
    const keywords = query.split(/\s+/).filter(k => k.length > 0);
    
    // 构建 Supabase OR 过滤条件
    // 格式: or=(title.ilike.*词1*,title.ilike.*词2*)
    let orFilter = "";
    if (keywords.length > 1) {
      const orConditions = keywords.map(k => `title.ilike.*${encodeURIComponent(k)}*`).join(",");
      orFilter = `&or=(${orConditions})`;
    } else {
      orFilter = `&title=ilike.*${encodeURIComponent(keywords[0])}*`;
    }

    const filterStr = orFilter + "&limit=20";

    // 同时搜索 products 和 buyer_products 两张表
    const [platformProducts, buyerProducts] = await Promise.all([
      querySupabase(
        "products",
        "id,title,cover_image,price,is_published",
        filterStr
      ),
      querySupabase(
        "buyer_products",
        "id,title,cover_image,price",
        filterStr
      ),
    ]);

    // 合并结果并去重（同一商品可能两张表都有）
    const seen = new Set<string>();
    const products: any[] = [];
    
    for (const p of [...(platformProducts || []), ...(buyerProducts || [])]) {
      const id = p.id;
      if (!seen.has(id)) {
        seen.add(id);
        products.push({
          ...p,
          source: platformProducts?.find((x: any) => x.id === id) ? "platform" : "buyer",
        });
      }
    }

    console.log(`[测款搜索] 关键词[${keywords.join(',')}] 结果: products=${platformProducts?.length||0}, buyer=${buyerProducts?.length||0}, 去重后=${products.length}`);

    return NextResponse.json({
      products,
      count: products.length,
      keywords,
    });
  } catch (err: any) {
    console.error("[搜索商品API错误]", err);
    return NextResponse.json({ error: err.message, products: [] }, { status: 500 });
  }
}

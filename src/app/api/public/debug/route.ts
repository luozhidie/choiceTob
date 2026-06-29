// 临时诊断接口 - 上线后删除
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const [productsRes, blocksRes, productsCount] = await Promise.all([
      supabase.from("products").select("id, name, title, is_published, category").limit(10),
      supabase.from("page_blocks").select("*"),
      supabase.from("products").select("id", { count: "exact", head: true }),
    ]);

    // 找到日韩风版块
    const rikanBlock = blocksRes.data?.find((b: any) => b.title?.includes("日韩风"));

    let rikanProducts = null;
    if (rikanBlock?.content?.productIds) {
      const ids = rikanBlock.content.productIds.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (ids.length > 0) {
        const { data } = await supabase
          .from("products")
          .select("id, name, title, is_published, category")
          .in("id", ids);
        rikanProducts = { requested: ids, found: data };
      }
    }

    return NextResponse.json({
      success: true,
      products_total: productsCount.count,
      products_sample: productsRes.data || [],
      blocks_count: blocksRes.data?.length || 0,
      all_blocks: (blocksRes.data || []).map((b: any) => ({
        id: b.id,
        title: b.title,
        type: b.type,
        is_published: b.is_published,
        position: b.content?.position,
        productIds: b.content?.productIds,
        category: b.content?.category,
        content_keys: b.content ? Object.keys(b.content) : [],
      })),
      rikan_block: rikanBlock ? {
        id: rikanBlock.id,
        content: rikanBlock.content,
        content_type: typeof rikanBlock.content,
      } : null,
      rikan_products: rikanProducts,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 公开数据接口：供网站/小程序 Look Studio 拉取真实「色彩季型 × 穿衣风格」体系与商品。
// 无需登录；返回 12 季型 + 89 style_tags + 已发布商品（含季型/风格标签）。
export async function GET() {
  try {
    const sb = await createClient();
    const [{ data: seasons }, { data: styles }, { data: products }] = await Promise.all([
      sb.from("color_seasons").select("code,name_zh,meta,sort_order").order("sort_order"),
      sb.from("style_tags").select("code,name_zh,gender,type,frame,is_main,parent_code,direction,sort_order").order("sort_order"),
      sb
        .from("products")
        .select("id,title,price,cover_image,color_season_codes,style_tag_codes,category")
        .eq("is_published", true)
        .not("cover_image", "is", null)
        .limit(240),
    ]);

    return NextResponse.json({
      seasons: seasons || [],
      styles: styles || [],
      products: (products || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        cover: p.cover_image,
        seasons: p.color_season_codes || [],
        styles: p.style_tag_codes || [],
        category: p.category || "",
      })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "加载失败", seasons: [], styles: [], products: [] }, { status: 500 });
  }
}

import { createClient } from "@/lib/supabase/server";
import LookStudioClient from "@/components/look-studio/LookStudioClient";

export const dynamic = "force-dynamic";

// 整体造型 · Look Studio
// 融合真实「色彩季型 × 穿衣风格」体系（12 季型 + 女士8主56偏/男士5主20偏）
// 与 Genlook 试衣：把打过季型/风格标签的服装，试穿到「季型+风格结论匹配」的顾客身上。

async function loadData() {
  const sb = await createClient();
  const out: any = { seasons: [], styles: [], products: [] };

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

  out.seasons = seasons || [];
  out.styles = styles || [];
  out.products = (products || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    cover: p.cover_image,
    seasons: p.color_season_codes || [],
    styles: p.style_tag_codes || [],
    category: p.category || "",
  }));
  return out;
}

export default async function LookStudioPage({ searchParams }: { searchParams?: Promise<{ baseImageUrl?: string }> }) {
  let data;
  try {
    data = await loadData();
  } catch (e: any) {
    data = { seasons: [], styles: [], products: [], error: e?.message || "数据加载失败" };
  }
  const params = await searchParams;
  return <LookStudioClient data={data} baseImageUrl={params?.baseImageUrl || ""} />;
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 奢品品牌库 API
 * 
 * GET /api/luxury/brands           — 返回品牌列表
 * GET /api/luxury/brands/[key] — 品牌详情 + 经典款
 */

// ============ 预置品牌数据（Supabase 表不存在时的降级数据）============
const FALLBACK_BRANDS = [
  {
    brand_key: "chanel",
    brand_name_cn: "香奈儿",
    brand_name_en: "Chanel",
    founded_year: 1910,
    origin_country: "法国",
    brand_profile: "以简约优雅、斜纹软呢、珍珠元素著称，现代女性时尚的奠基者。经典元素：斜纹软呢外套、双色鞋、珍珠项链、山茶花、CC扣。",
    classics: [
      { item_type: "classic_style", title: "斜纹软呢外套", description: "Chanel 最具标志性的外套，源自1950s，永恒优雅。", attributes: { colors: ["黑色","米色","白色"], styles: ["经典","优雅"] } },
      { item_type: "classic_style", title: "255 手袋", description: "1955年2月推出的翻盖包，菱格纹 + 金属链。", attributes: { colors: ["黑色","米色"], styles: ["经典"] } },
      { item_type: "brand_element", title: "双色鞋", description: "米色鞋身 + 黑色鞋尖，拉长脚型，适配所有装束。", attributes: { colors: ["米色","黑色"], patterns: ["纯色"] } },
      { item_type: "brand_element", title: "山茶花元素", description: "Coco Chanel 最爱的花朵，出现在服饰/包袋/首饰各处。", attributes: { colors: ["白色","红色"], patterns: ["花卉"] } },
    ],
  },
  {
    brand_key: "dior",
    brand_name_cn: "迪奥",
    brand_name_en: "Dior",
    founded_year: 1946,
    origin_country: "法国",
    brand_profile: "新风貌（New Look）开创者，优雅奢华的代名词。经典元素：Bar Jacket 收腰外套、Oblique 老花、CD扣、藤格纹。",
    classics: [
      { item_type: "classic_style", title: "Bar Jacket 收腰外套", description: "1947 新风貌（New Look）的核心单品，收腰 + 阔摆裙。", attributes: { colors: ["米色","黑色"], cuts: ["收腰"] } },
      { item_type: "classic_style", title: "Lady Dior 戴妃包", description: "1995 年赠予戴安娜王妃得名的菱格纹手提包。", attributes: { colors: ["黑色","nude"], patterns: ["菱格"] } },
      { item_type: "brand_element", title: "Oblique 老花帆布", description: "Dior 标志性 monogram 图案，近年强势回归。", attributes: { patterns: ["monogram"], colors: ["蓝色","白色"] } },
    ],
  },
  {
    brand_key: "ysl",
    brand_name_cn: "圣罗兰",
    brand_name_en: "Saint Laurent",
    founded_year: 1961,
    origin_country: "法国",
    brand_profile: "颠覆传统，倡导女性西装与中性风。经典元素：Le Smoking 吸烟装、Kate 手袋、YSL金扣、漆皮红唇。",
    classics: [
      { item_type: "classic_style", title: "Le Smoking 吸烟装", description: "1966 年首推女性燕尾服，颠覆性别着装规范。", attributes: { colors: ["黑色"], styles: ["中性","先锋"] } },
      { item_type: "classic_style", title: "Sac de Jour 手袋", description: "极简线条，硬挺廓形，职场女性的力量之选。", attributes: { colors: ["黑色","白色","棕色"], styles: ["极简"] } },
      { item_type: "brand_element", title: "YSL 金扣 LOGO", description: "Cassandre 设计的黄金字母扣，出现在包袋/首饰/鞋履。", attributes: { colors: ["金色","银色"], patterns: ["logo"] } },
    ],
  },
  {
    brand_key: "loewe",
    brand_name_cn: "罗意威",
    brand_name_en: "Loewe",
    founded_year: 1846,
    origin_country: "西班牙",
    brand_profile: "百年皮具世家，创意总监 Jonathan Anderson 注入艺术先锋感。经典元素：Puzzle 拼图包、Flamenco 软包、Anagram 字母扣、皮革编织。",
    classics: [
      { item_type: "classic_style", title: "Puzzle 拼图包", description: "可多角度背负，几何解构主义代表作。", attributes: { colors: ["棕色","黑色","白色"], styles: ["解构","艺术"] } },
      { item_type: "classic_style", title: "Flamenco 软包", description: "无结构化软身设计，卷曲褶皱封口。", attributes: { colors: ["棕色","黑色"], styles: ["柔软","松弛"] } },
      { item_type: "brand_element", title: "Anagram 字母扣", description: "Loewe 交织字母 L 标志，出现在皮具五金。", attributes: { patterns: ["字母"], colors: ["金色"] } },
    ],
  },
  {
    brand_key: "valentino",
    brand_name_cn: "华伦天奴",
    brand_name_en: "Valentino",
    founded_year: 1960,
    origin_country: "意大利",
    brand_profile: "以 Valentino Red 正红和仙女裙著称。经典元素：Valentino Red 正红礼服、Rockstud 铆钉、VLogo 扣、高定仙女裙。",
    classics: [
      { item_type: "classic_style", title: "Valentino Red 正红礼服", description: "品牌标志性「Valentino Red」，高级定制礼服代表作。", attributes: { colors: ["红色"], styles: ["优雅","高定"] } },
      { item_type: "brand_element", title: "Rockstud 铆钉", description: "金字塔形铆钉装饰，出现在鞋履/包袋/服饰。", attributes: { patterns: ["铆钉"], styles: ["摇滚","奢华"] } },
      { item_type: "classic_style", title: "VLogo 标识手袋", description: "当代辨识度最高的 Valentino 手袋系列。", attributes: { colors: ["白色","黑色","红色"], patterns: ["logo"] } },
    ],
  },
];

// ============ GET 主逻辑 ============

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const brandKey = searchParams.get("key");

    if (brandKey) {
      // 查询单个品牌详情 + 经典款
      const { data: brand, error: brandError } = await supabase
        .from("luxury_brands")
        .select("*")
        .eq("brand_key", brandKey)
        .single();

      if (brandError || !brand) {
        // 降级：从预置数据查找
        const fallback = FALLBACK_BRANDS.find(b => b.brand_key === brandKey);
        if (!fallback) {
          return NextResponse.json({ error: "品牌不存在" }, { status: 404 });
        }
        return NextResponse.json({
          brand: {
            brand_key: fallback.brand_key,
            brand_name_cn: fallback.brand_name_cn,
            brand_name_en: fallback.brand_name_en,
            founded_year: fallback.founded_year,
            origin_country: fallback.origin_country,
            brand_profile: fallback.brand_profile,
          },
          classics: fallback.classics,
          source: "fallback",
        });
      }

      // 查询该品牌的经典款
      const { data: classics, error: cError } = await supabase
        .from("luxury_classics")
        .select("*")
        .eq("brand_key", brandKey)
        .order("year", { ascending: false });

      return NextResponse.json({
        brand,
        classics: classics || [],
        source: "supabase",
      });
    }

    // 查询品牌列表
    const { data: brands, error } = await supabase
      .from("luxury_brands")
      .select("brand_key, brand_name_cn, brand_name_en, founded_year, origin_country, brand_profile")
      .order("founded_year", { ascending: true });

    if (error || !brands || brands.length === 0) {
      // 降级：返回预置数据
      return NextResponse.json({
        brands: FALLBACK_BRANDS.map(b => ({
          brand_key: b.brand_key,
          brand_name_cn: b.brand_name_cn,
          brand_name_en: b.brand_name_en,
          founded_year: b.founded_year,
          origin_country: b.origin_country,
          brand_profile: b.brand_profile,
        })),
        source: "fallback",
      });
    }

    return NextResponse.json({ brands, source: "supabase" });

  } catch (error: any) {
    console.error("[Luxury] API错误:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============ POST：初始化品牌数据 ============

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { action } = body;

    if (action === "seed") {
      // 将预置数据写入 Supabase
      for (const brand of FALLBACK_BRANDS) {
        // 插入品牌
        const { data: insertedBrand, error: brandError } = await supabase
          .from("luxury_brands")
          .upsert({
            brand_key: brand.brand_key,
            brand_name_cn: brand.brand_name_cn,
            brand_name_en: brand.brand_name_en,
            founded_year: brand.founded_year,
            origin_country: brand.origin_country,
            brand_profile: brand.brand_profile,
          })
          .select()
          .single();

        if (brandError) {
          console.error(`[Luxury] 插入品牌 ${brand.brand_key} 失败:`, brandError);
          continue;
        }

        // 插入经典款
        if (brand.classics && insertedBrand) {
          const classicsToInsert = brand.classics.map(c => ({
            brand_key: brand.brand_key,
            item_type: c.item_type,
            title: c.title,
            description: c.description,
            attributes: c.attributes,
          }));
          await supabase.from("luxury_classics").upsert(classicsToInsert, { onConflict: "brand_key,title" });
        }
      }

      return NextResponse.json({ success: true, message: "品牌数据初始化完成" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error: any) {
    console.error("[Luxury] 初始化失败:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

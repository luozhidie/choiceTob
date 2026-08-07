// 商品「风格 → 品类」两级联动筛选数据源（公开读）
// 入参：?category=<中文品类，如 "上装">（兼容 home_cat）
// 返回：data = { styles, subcategories, map }
//  - styles       该品类下商品库里真实存在的风格（去重）——只展示有货的，避免空标签
//  - subcategories 该品类的全部子品类（永远来自分类树配置，保证每个品类都有可点标签）
//  - map          风格 → 子品类 聚合（驱动第二行联动）；同时给 "全部" 一个全量子品类入口
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_CATEGORY_TREE,
  getSubcategoryValues,
  sanitize,
} from "@/lib/category-tree";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "app-config";
const FILE_PATH = "category-tree.json";

export const dynamic = "force-dynamic";

async function loadCategoryTree() {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).download(FILE_PATH);
    if (error || !data) return DEFAULT_CATEGORY_TREE;
    const text = await data.text();
    const parsed = JSON.parse(text);
    return sanitize(parsed);
  } catch {
    return DEFAULT_CATEGORY_TREE;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category =
    searchParams.get("category") || searchParams.get("home_cat") || "";

  const tree = await loadCategoryTree();

  // 子品类：始终来自分类树配置（保证每个品类都有可点的二级标签）
  const subcategories = category ? getSubcategoryValues(tree, category) : [];

  // 风格 / 风格→子品类 映射：来自真实商品聚合
  const map: Record<string, string[]> = {};
  const stylesSet = new Set<string>();

  if (category) {
    const { data, error } = await supabase
      .from("products")
      .select("subcategory, params")
      .eq("category", category)
      .gt("stock", 0)
      .limit(2000);
    if (!error && data) {
      for (const row of data) {
        const p = row.params || {};
        const style =
          (typeof p.style === "string" && p.style) ||
          (typeof p["风格"] === "string" && p["风格"]) ||
          "";
        const sub = row.subcategory || "";
        if (!style || !sub) continue;
        stylesSet.add(style);
        if (!map[style]) map[style] = [];
        if (map[style].indexOf(sub) < 0) map[style].push(sub);
      }
    }
  }

  // "全部" 入口：全量子品类（保证切回全部时第二行不空）
  if (subcategories.length) map["全部"] = subcategories.slice();

  return NextResponse.json({
    success: true,
    data: {
      styles: Array.from(stylesSet),
      subcategories,
      map,
    },
  });
}
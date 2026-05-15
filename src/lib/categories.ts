/**
 * 商品品类体系配置
 * 主分类 + 子分类，用于前端展示和后台管理
 */

export interface CategoryDef {
  key: string;
  label: string;
  icon?: string;
  subcategories: SubcategoryDef[];
}

export interface SubcategoryDef {
  key: string;
  label: string;
}

/**
 * 主分类定义
 * 适配 B2B 服装供应链 + 色彩服务平台定位
 */
export const CATEGORIES: CategoryDef[] = [
  {
    key: "color_tools",
    label: "色彩工具",
    subcategories: [
      { key: "color_cloth", label: "色布套组" },
      { key: "color_card", label: "色卡" },
      { key: "diagnosis_tool", label: "诊断工具" },
      { key: "test_prop", label: "测试道具" },
    ],
  },
  {
    key: "clothing",
    label: "服装",
    subcategories: [
      { key: "tops", label: "上装" },
      { key: "bottoms", label: "下装" },
      { key: "outerwear", label: "外套" },
      { key: "dress", label: "连衣裙" },
      { key: "suit", label: "套装" },
    ],
  },
  {
    key: "accessory",
    label: "配饰",
    subcategories: [
      { key: "scarf", label: "围巾丝巾" },
      { key: "jewelry", label: "首饰" },
      { key: "bag", label: "包袋" },
      { key: "hat", label: "帽饰" },
    ],
  },
  {
    key: "book",
    label: "书籍资料",
    subcategories: [
      { key: "color_theory", label: "色彩理论" },
      { key: "style_matching", label: "风格搭配" },
      { key: "industry_report", label: "行业报告" },
    ],
  },
  {
    key: "pro_tool",
    label: "专业工具",
    subcategories: [
      { key: "display_prop", label: "陈列道具" },
      { key: "display_rack", label: "展示架" },
      { key: "lighting", label: "灯光设备" },
    ],
  },
];

/**
 * 快速查找：主分类 key → label
 */
export const CATEGORY_MAP: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label])
);

/**
 * 快速查找：subcategory key → label
 */
export const SUBCATEGORY_MAP: Record<string, string> = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.subcategories.map((s) => [s.key, s.label]))
);

/**
 * 获取某个主分类下的子分类列表
 */
export function getSubcategories(categoryKey: string): SubcategoryDef[] {
  return CATEGORIES.find((c) => c.key === categoryKey)?.subcategories ?? [];
}

/**
 * 获取分类完整路径标签，如 "服装 > 上装"
 */
export function getCategoryPath(category?: string | null, subcategory?: string | null): string {
  const parts: string[] = [];
  if (category) parts.push(CATEGORY_MAP[category] || category);
  if (subcategory) parts.push(SUBCATEGORY_MAP[subcategory] || subcategory);
  return parts.join(" > ");
}

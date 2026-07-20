/**
 * 商品品类体系配置
 * 主分类 + 子分类，用于前端展示和后台管理
 * 对应数据库 categories 表
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
 * 包含：行业板块 + 传统品类
 */
export const CATEGORIES: CategoryDef[] = [
  // ===== 行业板块分类 =====
  {
    key: "fashion",
    label: "穿搭",
    icon: "👗",
    subcategories: [
      { key: "tops", label: "上装" },
      { key: "bottoms", label: "下装" },
      { key: "outerwear", label: "外套" },
      { key: "dress", label: "连衣裙" },
      { key: "suit", label: "套装" },
      { key: "casual_wear", label: "休闲装" },
      { key: "formal_wear", label: "正装" },
      { key: "streetwear", label: "潮牌" },
    ],
  },
  {
    key: "skincare",
    label: "护肤",
    icon: "🧴",
    subcategories: [
      { key: "cleanser", label: "洁面" },
      { key: "toner", label: "爽肤水" },
      { key: "serum", label: "精华液" },
      { key: "moisturizer", label: "面霜/乳液" },
      { key: "sunscreen", label: "防晒" },
      { key: "mask", label: "面膜" },
      { key: "eye_care", label: "眼部护理" },
    ],
  },
  {
    key: "makeup",
    label: "彩妆",
    icon: "💄",
    subcategories: [
      { key: "foundation", label: "底妆" },
      { key: "lipstick", label: "口红/唇釉" },
      { key: "eyeshadow", label: "眼影" },
      { key: "mascara", label: "睫毛膏" },
      { key: "blush", label: "腮红" },
      { key: "makeup_tools", label: "化妆工具" },
    ],
  },
  {
    key: "wellness",
    label: "养生",
    icon: "🧘",
    subcategories: [
      { key: "tea", label: "茶饮" },
      { key: "supplements", label: "保健品" },
      { key: "aromatherapy", label: "香薰" },
      { key: "health_food", label: "健康食品" },
      { key: "tcm", label: "中医养生" },
    ],
  },
  {
    key: "food",
    label: "食品",
    icon: "🍱",
    subcategories: [
      { key: "snacks", label: "零食" },
      { key: "beverages", label: "饮品" },
      { key: "organic", label: "有机食品" },
      { key: "imported_food", label: "进口食品" },
      { key: "local_specialty", label: "地方特产" },
    ],
  },
  {
    key: "home",
    label: "家居",
    icon: "🏠",
    subcategories: [
      { key: "decor", label: "装饰品" },
      { key: "textile", label: "纺织品" },
      { key: "kitchenware", label: "厨房用品" },
      { key: "storage", label: "收纳整理" },
      { key: "fragrance", label: "香氛" },
    ],
  },
  {
    key: "creative",
    label: "文创",
    icon: "🎨",
    subcategories: [
      { key: "artwork", label: "艺术品" },
      { key: "handcraft", label: "手工艺品" },
      { key: "stationery", label: "文创文具" },
      { key: "design_goods", label: "设计单品" },
      { key: "ip_goods", label: "IP周边" },
    ],
  },
  {
    key: "art",
    label: "艺术",
    icon: "🖼️",
    subcategories: [
      { key: "painting", label: "绘画" },
      { key: "sculpture", label: "雕塑" },
      { key: "photography", label: "摄影作品" },
      { key: "digital_art", label: "数字艺术" },
      { key: "installation", label: "装置艺术" },
    ],
  },

  // ===== 传统品类（保留兼容）=====
  {
    key: "clothing",
    label: "服装（传统）",
    subcategories: [
      { key: "tops", label: "上装" },
      { key: "bottoms", label: "下装" },
      { key: "outerwear", label: "外套" },
      { key: "dress", label: "连衣裙" },
      { key: "suit", label: "套装" },
      { key: "underwear", label: "内衣" },
      { key: "maternity", label: "母婴/家居服" },
    ],
  },
  // 小程序预设扁平品类兜底：key/value 直接用中文 label，便于同步显示
  { key: "套装", label: "套装", subcategories: [] },
  { key: "上装", label: "上装", subcategories: [] },
  { key: "下装", label: "下装", subcategories: [] },
  { key: "连衣裙", label: "连衣裙", subcategories: [] },
  { key: "外套", label: "外套", subcategories: [] },
  { key: "鞋靴", label: "鞋靴", subcategories: [] },
  { key: "箱包", label: "箱包", subcategories: [] },
  { key: "配饰", label: "配饰", subcategories: [] },
  { key: "珠宝首饰", label: "珠宝首饰", subcategories: [] },
  { key: "其他", label: "其他", subcategories: [] },
  {
    key: "accessory",
    label: "配饰（传统）",
    subcategories: [
      { key: "scarf", label: "围巾丝巾" },
      { key: "jewelry", label: "首饰" },
      { key: "bag", label: "包袋" },
      { key: "hat", label: "帽饰" },
      { key: "shoes", label: "鞋靴" },
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

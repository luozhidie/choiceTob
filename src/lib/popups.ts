// 通用弹窗配置：买家页/分类页/进货车/我的 等页面首次进入自动弹出的营销弹窗
// 配置以 JSON 文件存于 Storage 桶 app-config/popups.json
// 后台可编辑：/admin/popups

export type PopupPage = "buyer" | "category" | "cart" | "my" | "all";

export type PopupConfig = {
  id: string;
  page: PopupPage;
  is_active: boolean;
  sort_order: number;
  // 主视觉
  hero_image: string;
  // 品牌徽标（左上角小字）
  brand_label: string;
  brand_label_color: string;
  // 文案
  top_title: string; // 顶部标题（如：新客首单4大福利 拿货赚钱快人一步）
  subtitle_1: string; // 副标题 1（如：07.22 大牌联合 十三行）
  subtitle_2: string; // 副标题 2（如：秋款大上新企划）
  // 品牌行
  brands: string[];
  // 按钮
  button_text: string;
  button_link: string;
  // 配色
  bg_color: string; // 弹窗背景色
  button_color: string; // 按钮颜色
  text_color: string; // 主文字色
};

const DEFAULT_HERO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iODAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM3YTI2MzAiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1OTFhMjIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjMwMCIgeT0iMzkyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSI0OCIgZmlsbD0iI2ZmZjdlMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U0FNUExFPC90ZXh0Pjx0ZXh0IHg9IjMwMCIgeT0iNDQyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNiIgZmlsbD0iI2Q0YjM1YSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+cmVwbGFjZSBpbiBhZG1pbjwvdGV4dD48L3N2Zz4=";
const DEFAULT_HERO_CART = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iODAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNiNTY1MWQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM4YTRiMTUiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjMwMCIgeT0iMzkyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSI0NiIgZmlsbD0iI2ZmZjdlMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U0FNUExFPC90ZXh0Pjx0ZXh0IHg9IjMwMCIgeT0iNDQyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Y2FydCBwYWdlPC90ZXh0Pjwvc3ZnPg==";
const DEFAULT_HERO_MY = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MDAiIGhlaWdodD0iODAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM4YTRiNmUiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1YTJhNGEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjgwMCIgZmlsbD0idXJsKCNnKSIvPjx0ZXh0IHg9IjMwMCIgeT0iMzkyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSI0NiIgZmlsbD0iI2ZmZjdlMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U0FNUExFPC90ZXh0Pjx0ZXh0IHg9IjMwMCIgeT0iNDQyIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+bXkgcGFnZTwvdGV4dD48L3N2Zz4=";
const DEFAULT_BG = "#6e1f25"; // 默认深酒红
const DEFAULT_BTN = "#d4b35a"; // 默认金黄
const DEFAULT_TEXT = "#fff7e0"; // 默认奶白

export const DEFAULT_POPUPS: PopupConfig[] = [
  {
    id: "demo_buyer_first_order",
    page: "buyer",
    is_active: true, // 预置启用示例，扫码即可见；后台可改/关
    sort_order: 0,
    hero_image: DEFAULT_HERO,
    brand_label: "品 牌 围 栏",
    brand_label_color: "#d4b35a",
    top_title: "新客首单4大福利 拿货赚钱快人一步",
    subtitle_1: "07.22 大牌联合 十三行",
    subtitle_2: "秋款大上新企划",
    brands: ["T.G", "KAPOK", "SMX", "元照", "Have·U", "THE WANG岛屿"],
    button_text: "上新100+ 满减省¥320",
    button_link: "/pages/buyer/index?from=popup_first_order",
    bg_color: DEFAULT_BG,
    button_color: DEFAULT_BTN,
    text_color: DEFAULT_TEXT,
  },
];
  {
    id: "demo_cart_topup",
    page: "cart",
    is_active: true,
    sort_order: 1,
    hero_image: DEFAULT_HERO_CART,
    brand_label: "品 牌 围 栏",
    brand_label_color: DEFAULT_BTN,
    top_title: "进货车满减 凑单更划算",
    subtitle_1: "满299 包邮",
    subtitle_2: "限时凑单礼",
    brands: [],
    button_text: "去凑单 立省¥50",
    button_link: "/pages/cart/index",
    bg_color: DEFAULT_BG,
    button_color: DEFAULT_BTN,
    text_color: DEFAULT_TEXT,
  },
  {
    id: "demo_my_certify",
    page: "my",
    is_active: true,
    sort_order: 2,
    hero_image: DEFAULT_HERO_MY,
    brand_label: "品 牌 围 栏",
    brand_label_color: DEFAULT_BTN,
    top_title: "认证拿货价 一件也是批发价",
    subtitle_1: "新客专享",
    subtitle_2: "认证即解锁",
    brands: [],
    button_text: "立即认证",
    button_link: "/pages/certify/index",
    bg_color: DEFAULT_BG,
    button_color: DEFAULT_BTN,
    text_color: DEFAULT_TEXT,
  },
];

const PAGES: PopupPage[] = ["buyer", "category", "cart", "my", "all"];

export function sanitize(input: any): PopupConfig[] {
  if (!Array.isArray(input)) return DEFAULT_POPUPS;
  const out: PopupConfig[] = [];
  input.forEach((p, i) => {
    if (!p || typeof p !== "object") return;
    const page: PopupPage = PAGES.includes(p.page) ? p.page : "all";
    out.push({
      id: String(p.id || `popup_${Date.now()}_${i}`),
      page,
      is_active: !!p.is_active,
      sort_order:
        typeof p.sort_order === "number"
          ? p.sort_order
          : Number(p.sort_order) || i,
      hero_image: String(p.hero_image || ""),
      brand_label: String(p.brand_label || ""),
      brand_label_color: String(p.brand_label_color || DEFAULT_BTN),
      top_title: String(p.top_title || ""),
      subtitle_1: String(p.subtitle_1 || ""),
      subtitle_2: String(p.subtitle_2 || ""),
      brands: Array.isArray(p.brands)
        ? p.brands.map((b: any) => String(b)).filter(Boolean)
        : [],
      button_text: String(p.button_text || ""),
      button_link: String(p.button_link || ""),
      bg_color: String(p.bg_color || DEFAULT_BG),
      button_color: String(p.button_color || DEFAULT_BTN),
      text_color: String(p.text_color || DEFAULT_TEXT),
    });
  });
  // 排序：sort_order 升序
  out.sort((a, b) => a.sort_order - b.sort_order);
  return out;
}

// 按页面筛选启用的弹窗
export function filterByPage(
  list: PopupConfig[],
  page: PopupPage
): PopupConfig[] {
  return list
    .filter((p) => p.is_active)
    .filter((p) => p.page === page || p.page === "all")
    .sort((a, b) => a.sort_order - b.sort_order);
}

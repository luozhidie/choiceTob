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

const DEFAULT_BG = "#6e1f25"; // 默认深酒红
const DEFAULT_BTN = "#d4b35a"; // 默认金黄
const DEFAULT_TEXT = "#fff7e0"; // 默认奶白

export const DEFAULT_POPUPS: PopupConfig[] = [
  {
    id: "demo_buyer_first_order",
    page: "buyer",
    is_active: false, // 默认关闭，后台启用
    sort_order: 0,
    hero_image: "",
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

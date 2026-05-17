/**
 * 全站统一风格定义
 * 后端存拼音key，前端展示市场化名称
 * 女士八大风格 + 男士五大风格
 */

/** 女士八大风格 */
export const FEMALE_STYLES = [
  { value: "shao_nv", label: "甜美少女" },
  { value: "you_ya", label: "法式优雅" },
  { value: "lang_man_f", label: "浪漫女神" },
  { value: "shao_nian_f", label: "简约通勤" },
  { value: "shi_shang_f", label: "街头潮牌" },
  { value: "gu_dian_f", label: "轻奢极简" },
  { value: "zi_ran_f", label: "日系文艺" },
  { value: "xi_ju_f", label: "气场女王" },
] as const;

/** 男士五大风格 */
export const MALE_STYLES = [
  { value: "xi_ju_m", label: "气场型男" },
  { value: "zi_ran_m", label: "随性达人" },
  { value: "gu_dian_m", label: "精英绅士" },
  { value: "lang_man_m", label: "优雅先生" },
  { value: "shi_shang_m", label: "潮流先锋" },
] as const;

/** 全部风格（带分组） */
export const ALL_STYLES = [
  ...FEMALE_STYLES.map(s => ({ ...s, group: "女士八大风格" as const })),
  ...MALE_STYLES.map(s => ({ ...s, group: "男士五大风格" as const })),
];

/** 风格Key → 市场名映射 */
export const STYLE_KEY_MAP: Record<string, string> = {
  // 女士八大风格
  shao_nv: "甜美少女", you_ya: "法式优雅", lang_man_f: "浪漫女神",
  shao_nian_f: "简约通勤", shi_shang_f: "街头潮牌", gu_dian_f: "轻奢极简",
  zi_ran_f: "日系文艺", xi_ju_f: "气场女王",
  // 男士五大风格
  xi_ju_m: "气场型男", zi_ran_m: "随性达人", gu_dian_m: "精英绅士",
  lang_man_m: "优雅先生", shi_shang_m: "潮流先锋",
  // 旧英文key兼容（数据库历史数据）
  minimal_commute: "简约通勤", french_elegant: "法式优雅", korean_fresh: "韩系清新",
  japanese_art: "日系文艺", retro_vintage: "复古港风", sport_casual: "运动休闲",
  luxury_minimal: "轻奢极简", street_trend: "街头潮牌", chinese_style: "新中式",
  bohemian: "波西米亚",
};

/** 女士风格key集合 */
export const FEMALE_STYLE_KEYS: Set<string> = new Set(FEMALE_STYLES.map(s => s.value as string));

/** 男士风格key集合 */
export const MALE_STYLE_KEYS: Set<string> = new Set(MALE_STYLES.map(s => s.value as string));

/** 判断风格key属于哪个性别分组 */
export function getStyleGroup(key: string): "女士八大风格" | "男士五大风格" | "" {
  if (FEMALE_STYLE_KEYS.has(key)) return "女士八大风格";
  if (MALE_STYLE_KEYS.has(key)) return "男士五大风格";
  return "";
}

/** 获取风格的市场名（带兼容） */
export function getStyleLabel(key: string | null | undefined): string {
  if (!key) return "";
  return STYLE_KEY_MAP[key] || key;
}

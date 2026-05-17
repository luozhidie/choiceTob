/**
 * 全站统一风格定义
 * 
 * 核心原则：
 * - 后端（数据库、系统、文件、报告）= 专业术语（少女型、优雅型、戏剧型…）
 * - 前端（用户端展示）= 通俗风格名（淑女风、知性风、大牌风…）
 * 
 * 女士八大风格 + 男士五大风格
 * 参考：12季型色彩体系 & 女士八大风格专业文档 & 男士五大风格专业文档
 */

/** 女士八大风格（后端专业术语 → 前端通俗风格名） */
export const FEMALE_STYLES = [
  { value: "shao_nv",    label: "淑女风",   proLabel: "少女型", styleRefs: "甜美风、淑女风、日系风" },
  { value: "you_ya",     label: "知性风",   proLabel: "优雅型", styleRefs: "通勤风、简约风、知性风" },
  { value: "lang_man_f", label: "名媛风",   proLabel: "浪漫型", styleRefs: "名媛风、御姐风、复古风" },
  { value: "shao_nian_f",label: "中性风",   proLabel: "少年型", styleRefs: "中性风、简约风、街头风" },
  { value: "shi_shang_f",label: "潮牌风",   proLabel: "时尚型", styleRefs: "街头风、潮牌风、设计师款" },
  { value: "gu_dian_f",  label: "职业风",   proLabel: "古典型", styleRefs: "通勤风、职业风、简约风" },
  { value: "zi_ran_f",   label: "休闲风",   proLabel: "自然型", styleRefs: "休闲风、森系风、棉麻风" },
  { value: "xi_ju_f",    label: "大牌风",   proLabel: "戏剧型", styleRefs: "御姐风、名媛风、大牌风" },
] as const;

/** 男士五大风格（后端专业术语 → 前端通俗风格名） */
export const MALE_STYLES = [
  { value: "xi_ju_m",    label: "气场型男", proLabel: "戏剧型", styleRefs: "气派、华丽、国王级别" },
  { value: "zi_ran_m",   label: "随性达人", proLabel: "自然型", styleRefs: "潇洒、阳刚、有朝气" },
  { value: "gu_dian_m",  label: "精英绅士", proLabel: "古典型", styleRefs: "严谨、稳重、端正" },
  { value: "lang_man_m", label: "优雅先生", proLabel: "浪漫型", styleRefs: "儒雅、温柔、华丽" },
  { value: "shi_shang_m",label: "潮流先锋", proLabel: "时尚型", styleRefs: "年轻、个性、多变" },
] as const;

/** 全部风格（带分组，用于下拉选择） */
export const ALL_STYLES = [
  ...FEMALE_STYLES.map(s => ({ ...s, group: "女士八大风格" as const })),
  ...MALE_STYLES.map(s => ({ ...s, group: "男士五大风格" as const })),
];

/**
 * 风格Key → 前端通俗名映射
 * 前端所有展示都用这个映射
 */
export const STYLE_KEY_MAP: Record<string, string> = {
  // 女士八大风格
  shao_nv: "淑女风", you_ya: "知性风", lang_man_f: "名媛风",
  shao_nian_f: "中性风", shi_shang_f: "潮牌风", gu_dian_f: "职业风",
  zi_ran_f: "休闲风", xi_ju_f: "大牌风",
  // 男士五大风格
  xi_ju_m: "气场型男", zi_ran_m: "随性达人", gu_dian_m: "精英绅士",
  lang_man_m: "优雅先生", shi_shang_m: "潮流先锋",
  // 旧英文key兼容（数据库历史数据）
  minimal_commute: "中性风", french_elegant: "知性风", korean_fresh: "淑女风",
  japanese_art: "休闲风", retro_vintage: "大牌风", sport_casual: "潮牌风",
  luxury_minimal: "职业风", street_trend: "潮牌风", chinese_style: "职业风",
  bohemian: "休闲风",
  // 旧市场化名兼容（上一版前端数据）
  "甜美少女": "淑女风", "法式优雅": "知性风", "浪漫女神": "名媛风",
  "简约通勤": "中性风", "街头潮牌": "潮牌风", "轻奢极简": "职业风",
  "日系文艺": "休闲风", "气场女王": "大牌风",
};

/**
 * 风格Key → 后端专业术语映射
 * 后台管理系统、报告、文件中使用
 */
export const STYLE_PRO_MAP: Record<string, string> = {
  // 女士八大风格
  shao_nv: "少女型", you_ya: "优雅型", lang_man_f: "浪漫型",
  shao_nian_f: "少年型", shi_shang_f: "时尚型", gu_dian_f: "古典型",
  zi_ran_f: "自然型", xi_ju_f: "戏剧型",
  // 男士五大风格
  xi_ju_m: "戏剧型", zi_ran_m: "自然型", gu_dian_m: "古典型",
  lang_man_m: "浪漫型", shi_shang_m: "时尚型",
};

/** 女士风格key集合（拼音key） */
export const FEMALE_STYLE_KEYS: Set<string> = new Set(FEMALE_STYLES.map(s => s.value as string));

/** 男士风格key集合（拼音key） */
export const MALE_STYLE_KEYS: Set<string> = new Set(MALE_STYLES.map(s => s.value as string));

/** 女士风格所有标识（拼音key + 市场名 + 专业术语） */
export const FEMALE_STYLE_ALL_KEYS: Set<string> = new Set([
  ...FEMALE_STYLES.map(s => s.value as string),
  ...FEMALE_STYLES.map(s => s.label),
  ...FEMALE_STYLES.map(s => s.proLabel),
]);

/** 男士风格所有标识（拼音key + 市场名 + 专业术语） */
export const MALE_STYLE_ALL_KEYS: Set<string> = new Set([
  ...MALE_STYLES.map(s => s.value as string),
  ...MALE_STYLES.map(s => s.label),
  ...MALE_STYLES.map(s => s.proLabel),
]);

/** 判断风格key属于哪个性别分组 */
export function getStyleGroup(key: string): "女士八大风格" | "男士五大风格" | "" {
  if (FEMALE_STYLE_KEYS.has(key)) return "女士八大风格";
  if (MALE_STYLE_KEYS.has(key)) return "男士五大风格";
  return "";
}

/** 获取前端通俗风格名（用户端展示） */
export function getStyleLabel(key: string | null | undefined): string {
  if (!key) return "";
  return STYLE_KEY_MAP[key] || key;
}

/** 市场名 → 专业术语 反向查找表 */
const MARKET_TO_PRO_MAP: Record<string, string> = Object.fromEntries([
  ...FEMALE_STYLES.map(s => [s.label, s.proLabel]),
  ...MALE_STYLES.map(s => [s.label, s.proLabel]),
]);

/** 获取后端专业术语（后台管理/报告/文件使用） */
export function getStyleProLabel(key: string | null | undefined): string {
  if (!key) return "";
  return STYLE_PRO_MAP[key] || MARKET_TO_PRO_MAP[key] || key;
}

/** 获取带专业术语标注的展示名，如"淑女风（少女型）" */
export function getStyleFullLabel(key: string | null | undefined): string {
  if (!key) return "";
  const market = STYLE_KEY_MAP[key];
  const pro = STYLE_PRO_MAP[key];
  if (market && pro) return `${market}（${pro}）`;
  return market || pro || key;
}

// ==================== 12季色彩定义 ====================

/** 12季色彩（后端专业术语） */
export const COLOR_SEASONS_PRO = [
  { value: "light_warm", label: "浅暖型", group: "春", marketLabel: "樱花粉" },
  { value: "warm_bright", label: "暖亮型", group: "春", marketLabel: "珊瑚橘" },
  { value: "clear_warm", label: "净暖型", group: "春", marketLabel: "柠檬黄" },
  { value: "light_cool", label: "浅冷型", group: "夏", marketLabel: "天空蓝" },
  { value: "soft_cool", label: "柔冷型", group: "夏", marketLabel: "薰衣草" },
  { value: "cool_soft", label: "冷柔型", group: "夏", marketLabel: "薄荷绿" },
  { value: "warm_soft", label: "暖柔型", group: "秋", marketLabel: "焦糖棕" },
  { value: "soft_warm", label: "柔暖型", group: "秋", marketLabel: "枫叶红" },
  { value: "deep_warm", label: "深暖型", group: "秋", marketLabel: "酒红色" },
  { value: "clear_cool", label: "净冷型", group: "冬", marketLabel: "宝石蓝" },
  { value: "cool_bright", label: "冷亮型", group: "冬", marketLabel: "银白色" },
  { value: "deep_cool", label: "深冷型", group: "冬", marketLabel: "墨黑色" },
] as const;

/** 色彩季型Key → 后端专业术语 */
export const COLOR_SEASON_PRO_MAP: Record<string, string> = {
  light_warm: "浅暖型", warm_bright: "暖亮型", clear_warm: "净暖型",
  light_cool: "浅冷型", soft_cool: "柔冷型", cool_soft: "冷柔型",
  warm_soft: "暖柔型", soft_warm: "柔暖型", deep_warm: "深暖型",
  clear_cool: "净冷型", cool_bright: "冷亮型", deep_cool: "深冷型",
};

/** 色彩季型Key → 前端通俗色系名 */
export const COLOR_SEASON_MARKET_MAP: Record<string, string> = {
  light_warm: "樱花粉", warm_bright: "珊瑚橘", clear_warm: "柠檬黄",
  light_cool: "天空蓝", soft_cool: "薰衣草", cool_soft: "薄荷绿",
  warm_soft: "焦糖棕", soft_warm: "枫叶红", deep_warm: "酒红色",
  clear_cool: "宝石蓝", cool_bright: "银白色", deep_cool: "墨黑色",
};

/**
 * 色彩季型 综合映射表（含所有旧key兼容）
 * 旧中文key → 新通俗色系名
 * 旧"形容词+季节"无后缀 key → 新通俗色系名
 * 旧"形容词+季节型" key → 新通俗色系名
 */
export const COLOR_SEASON_KEY_MAP: Record<string, string> = {
  // === 标准英文key → 通俗色系名 ===
  light_warm: "樱花粉", warm_bright: "珊瑚橘", clear_warm: "柠檬黄",
  light_cool: "天空蓝", soft_cool: "薰衣草", cool_soft: "薄荷绿",
  warm_soft: "焦糖棕", soft_warm: "枫叶红", deep_warm: "酒红色",
  clear_cool: "宝石蓝", cool_bright: "银白色", deep_cool: "墨黑色",
  // === 旧中文key兼容（mock-data 中的"浅春""冷冬"等，无"型"后缀） ===
  "浅春": "樱花粉", "暖春": "珊瑚橘", "净春": "柠檬黄",
  "柔夏": "薰衣草", "冷夏": "天空蓝", "深夏": "薄荷绿",
  "柔秋": "焦糖棕", "暖秋": "枫叶红", "净秋": "柠檬黄", "深秋": "酒红色",
  "净冬": "宝石蓝", "冷冬": "银白色",
  // === 旧"形容词+季节型"兼容（supplier/submit, brand 中的"浅春型"等） ===
  "浅春型": "樱花粉", "暖春型": "珊瑚橘", "净春型": "柠檬黄",
  "浅夏型": "天空蓝", "冷夏型": "薰衣草", "柔夏型": "薄荷绿",
  "柔秋型": "焦糖棕", "暖秋型": "枫叶红", "深秋型": "酒红色",
  "净冬型": "宝石蓝", "冷冬型": "银白色", "深冬型": "墨黑色",
  // === 旧"形容词+季节+型"额外变体（customers 页面中的错误命名） ===
  "浅秋": "焦糖棕", "浅冬": "宝石蓝", "柔春": "樱花粉",
  "深春": "珊瑚橘", "柔冬": "银白色",
};

/**
 * 色彩季型 旧key → 标准英文key 归一化映射
 * 用于将数据库中的旧中文key转换为标准英文key
 */
export const COLOR_SEASON_NORMALIZE_MAP: Record<string, string> = {
  // 旧中文key → 标准英文key
  "浅春": "light_warm", "暖春": "warm_bright", "净春": "clear_warm",
  "柔夏": "soft_cool", "冷夏": "light_cool", "深夏": "cool_soft",
  "柔秋": "warm_soft", "暖秋": "soft_warm", "净秋": "clear_warm", "深秋": "deep_warm",
  "净冬": "clear_cool", "冷冬": "cool_bright",
  // 旧"型"后缀key → 标准英文key
  "浅春型": "light_warm", "暖春型": "warm_bright", "净春型": "clear_warm",
  "浅夏型": "light_cool", "冷夏型": "soft_cool", "柔夏型": "cool_soft",
  "柔秋型": "warm_soft", "暖秋型": "soft_warm", "深秋型": "deep_warm",
  "净冬型": "clear_cool", "冷冬型": "cool_bright", "深冬型": "deep_cool",
  // 非标准名 → 最近似标准key
  "浅秋": "warm_soft", "浅冬": "clear_cool", "柔春": "light_warm",
  "深春": "warm_bright", "柔冬": "cool_bright",
  // monochrome（黑白型）→ 深冷型（最接近）
  "monochrome": "deep_cool",
};

/** 12季色彩代表性颜色（用于UI展示） */
export const COLOR_SEASON_COLORS: Record<string, string> = {
  light_warm: "#F9A8D4", warm_bright: "#FB923C", clear_warm: "#FDE047",
  light_cool: "#93C5FD", soft_cool: "#A5B4FC", cool_soft: "#6EE7B7",
  warm_soft: "#D4A574", soft_warm: "#F87171", deep_warm: "#92400E",
  clear_cool: "#818CF8", cool_bright: "#E0E7FF", deep_cool: "#1E3A5F",
};

/** 色彩季型标准英文key集合 */
export const COLOR_SEASON_KEYS: Set<string> = new Set(
  COLOR_SEASONS_PRO.map(c => c.value as string)
);

/** 归一化色彩季型key（旧key → 标准英文key） */
export function normalizeColorSeasonKey(key: string | null | undefined): string {
  if (!key) return "";
  if (COLOR_SEASON_KEYS.has(key)) return key;
  return COLOR_SEASON_NORMALIZE_MAP[key] || key;
}

/** 获取色彩季型前端通俗名 */
export function getColorSeasonLabel(key: string | null | undefined): string {
  if (!key) return "";
  return COLOR_SEASON_KEY_MAP[key] || COLOR_SEASON_MARKET_MAP[key] || COLOR_SEASON_PRO_MAP[key] || key;
}

/** 获取色彩季型后端专业术语 */
export function getColorSeasonProLabel(key: string | null | undefined): string {
  if (!key) return "";
  const normalized = normalizeColorSeasonKey(key);
  return COLOR_SEASON_PRO_MAP[normalized] || key;
}

/** 获取带专业术语的色彩季型展示名，如"樱花粉（浅暖春）" */
export function getColorSeasonFullLabel(key: string | null | undefined): string {
  if (!key) return "";
  const normalized = normalizeColorSeasonKey(key);
  const market = COLOR_SEASON_MARKET_MAP[normalized];
  const pro = COLOR_SEASON_PRO_MAP[normalized];
  const season = COLOR_SEASONS_PRO.find(c => c.value === normalized)?.group;
  if (market && pro && season) return `${market}（${pro}${season}）`;
  if (market && pro) return `${market}（${pro}）`;
  return market || pro || key;
}

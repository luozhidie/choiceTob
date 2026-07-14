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

// ==================== 风格特征 + 偏风格（主风格 × 偏风格）====================
// 女士八大风格：曲线型（少女/优雅/浪漫）/ 直线型（少年/时尚/古典/自然/戏剧）
// 男士五大风格：不分直曲（时尚/浪漫/古典/自然/戏剧）
// 说明：以下为形象顾问体系「标准特征基线」，用于商品企划/组货/陈列/销售落地。
//       市场风格映射由运营在 styleRefs 手动设置，此处不自动对应（避免覆盖人工判断）。

export type StyleLine = "曲线型" | "直线型" | "";

export type StyleDetail = {
  proLabel: string;   // 专业术语（少女型…）
  market: string;     // 通俗名（淑女风…）
  line: StyleLine;    // 女士：曲线/直线；男士：空
  keywords: string[]; // 风格关键词
  silhouette: string; // 廓形
  fabric: string;     // 面料
  pattern: string;    // 图案
  detail: string;     // 细节设计
  occasion: string;   // 适用场合
  body: string;       // 适合人群 / 量感
  avoid: string;      // 避雷
};

export const STYLE_DETAILS: Record<string, StyleDetail> = {
  /* ── 女士曲线型 ── */
  shao_nv: {
    proLabel: "少女型", market: "淑女风", line: "曲线型",
    keywords: ["甜美", "可爱", "活泼", "圆润"],
    silhouette: "圆润可爱、A字、泡泡袖、抽褶、高腰",
    fabric: "棉、针织、雪纺、蕾丝、灯芯绒",
    pattern: "圆点、小碎花、卡通、荷叶边、糖果色",
    detail: "蝴蝶结、木耳边、抽褶、娃娃领",
    occasion: "校园、约会、日常休闲、轻旅行",
    body: "小骨架、娇小量感、面部圆润柔和",
    avoid: "成熟厚重、中性硬朗、夸张廓形",
  },
  you_ya: {
    proLabel: "优雅型", market: "知性风", line: "曲线型",
    keywords: ["柔美", "知性", "精致", "温婉"],
    silhouette: "X型、收腰、柔美垂坠、合身",
    fabric: "真丝、羊绒、精纺毛料、软糯针织",
    pattern: "小花卉、暗纹、素色、细条纹",
    detail: "珍珠、细腻镶边、小立领、低调配饰",
    occasion: "职场通勤、约会、正式社交、茶歇",
    body: "中等偏瘦量感、曲线柔和",
    avoid: "夸张前卫、运动休闲、硬朗直线",
  },
  lang_man_f: {
    proLabel: "浪漫型", market: "名媛风", line: "曲线型",
    keywords: ["华丽", "妩媚", "女人味", "浓郁"],
    silhouette: "X型、鱼尾、收腰大摆、贴身",
    fabric: "真丝缎、丝绒、蕾丝、雪纺",
    pattern: "大花卉、华丽印花、渐变",
    detail: "荷叶边、亮片、立领、水晶点缀",
    occasion: "宴会、晚装、约会、红毯",
    body: "中大量感、丰满曲线明显",
    avoid: "中性直线、极简冷淡、运动风",
  },
  /* ── 女士直线型 ── */
  shao_nian_f: {
    proLabel: "少年型", market: "中性风", line: "直线型",
    keywords: ["利落", "中性", "少年感", "清爽"],
    silhouette: "H型、直线、boyfriend、中性",
    fabric: "棉、牛仔、牛津纺、帆布、工装布",
    pattern: "格纹、条纹、字母、素色",
    detail: "工装袋、拉链、金属扣、平领",
    occasion: "校园、街头、休闲、运动",
    body: "小骨架、平肩、量感偏小",
    avoid: "柔美蕾丝、繁琐堆砌、贴身曲线",
  },
  shi_shang_f: {
    proLabel: "时尚型", market: "潮牌风", line: "直线型",
    keywords: ["个性", "前卫", "混搭", "潮流"],
    silhouette: "不规则、解构、O型、层叠混搭",
    fabric: "新型混纺、PVC、牛仔、科技面料",
    pattern: "几何、撞色、抽象、标语",
    detail: "露脐、破洞、层叠、金属装饰",
    occasion: "街头、派对、潮玩、音乐节",
    body: "适中量感、骨感或适中",
    avoid: "传统正式、老气保守",
  },
  gu_dian_f: {
    proLabel: "古典型", market: "职业风", line: "直线型",
    keywords: ["严谨", "端庄", "精致", "克制"],
    silhouette: "H型、合身收腰、对称、利落",
    fabric: "精纺羊毛、真丝、高支棉、哔叽",
    pattern: "素色、细条纹、小格纹、暗纹",
    detail: "翻领、排扣、精致剪裁、低调配饰",
    occasion: "职场、商务、正式场合",
    body: "中等量感、端庄匀称",
    avoid: "夸张廓形、破洞、过于休闲运动",
  },
  zi_ran_f: {
    proLabel: "自然型", market: "休闲风", line: "直线型",
    keywords: ["潇洒", "松弛", "文艺", "质朴"],
    silhouette: "H型、宽松直线、自然垂坠",
    fabric: "棉麻、针织、麂皮、灯芯绒",
    pattern: "大地色、民族风、格纹、素色",
    detail: "原色、自然褶皱、木质扣、手作感",
    occasion: "度假、日常、文艺、休闲",
    body: "中到中大量感、自然舒展",
    avoid: "精致华丽、紧身束缚、金属感强",
  },
  xi_ju_f: {
    proLabel: "戏剧型", market: "大牌风", line: "直线型",
    keywords: ["气场", "夸张", "华丽", "个性"],
    silhouette: "T型、夸张长线条、建筑感、大廓形",
    fabric: "皮革、缎面、金属感、挺括羊毛",
    pattern: "几何大图案、高对比、动物纹",
    detail: "夸张配饰、垫肩、大廓形、强对比",
    occasion: "红毯、舞台、晚宴、个性表达",
    body: "大量感、高大骨架、存在感强",
    avoid: "小家子气、琐碎细节、平庸",
  },
  /* ── 男士五大风格（不分直曲）── */
  xi_ju_m: {
    proLabel: "戏剧型", market: "气场型男", line: "",
    keywords: ["气场", "华丽", "国王级别", "存在感"],
    silhouette: "宽肩、长款、挺括、强对比",
    fabric: "羊毛、皮革、缎面、金属感",
    pattern: "几何、高对比、大图案",
    detail: "垫肩、夸张配饰、强结构",
    occasion: "商务精英、舞台、红毯",
    body: "大量感、高大骨架",
    avoid: "小家子气、琐碎",
  },
  zi_ran_m: {
    proLabel: "自然型", market: "随性达人", line: "",
    keywords: ["潇洒", "阳刚", "有朝气", "松弛"],
    silhouette: "宽松、直线、自然垂坠",
    fabric: "棉麻、针织、麂皮、牛仔",
    pattern: "素色、格纹、大地色",
    detail: "原色、休闲剪裁、木质扣",
    occasion: "休闲、度假、商务休闲",
    body: "中大量感、自然舒展",
    avoid: "精致华丽、紧身束缚",
  },
  gu_dian_m: {
    proLabel: "古典型", market: "精英绅士", line: "",
    keywords: ["严谨", "稳重", "端正", "精英"],
    silhouette: "合身、对称、H型、利落",
    fabric: "精纺羊毛、高支棉、真丝",
    pattern: "素色、细条纹、暗纹",
    detail: "精致剪裁、领带、翻领",
    occasion: "商务、正式、职场",
    body: "中等量感、端庄匀称",
    avoid: "夸张、破洞、运动休闲",
  },
  lang_man_m: {
    proLabel: "浪漫型", market: "优雅先生", line: "",
    keywords: ["儒雅", "温柔", "华丽", "绅士"],
    silhouette: "收腰、X型、柔和线条",
    fabric: "真丝、羊绒、缎面",
    pattern: "花卉、暗纹、低饱和",
    detail: "柔和领型、细腻配饰",
    occasion: "社交、约会、正式晚宴",
    body: "中量感、柔和五官",
    avoid: "硬朗中性、运动粗犷",
  },
  shi_shang_m: {
    proLabel: "时尚型", market: "潮流先锋", line: "",
    keywords: ["年轻", "个性", "多变", "潮流"],
    silhouette: "不规则、混搭、层叠",
    fabric: "科技面料、牛仔、混纺",
    pattern: "几何、标语、撞色",
    detail: "层叠、破洞、金属装饰",
    occasion: "街头、派对、潮玩",
    body: "适中量感、骨感或适中",
    avoid: "传统正式、老气",
  },
};

/** 主风格 → 常见偏风格集合（含自身=纯风格）。
 *  基于「直偏曲 / 曲偏直」为现实常见、「直偏直 / 曲偏曲」罕见的理论框架。 */
export const STYLE_LEAN: Record<string, string[]> = {
  // 女士曲线型
  shao_nv: ["shao_nv", "you_ya", "lang_man_f", "shao_nian_f"], // 纯少女 / 偏优雅 / 偏浪漫 / 偏少年(甜酷)
  you_ya: ["you_ya", "shao_nv", "lang_man_f", "gu_dian_f"],    // 纯优雅 / 偏少女 / 偏浪漫 / 偏古典(知性职业)
  lang_man_f: ["lang_man_f", "shao_nian_f", "shi_shang_f", "gu_dian_f", "zi_ran_f", "xi_ju_f"], // 用户给定：曲偏直
  // 女士直线型
  shao_nian_f: ["shao_nian_f", "shao_nv", "you_ya", "shi_shang_f", "zi_ran_f"], // 偏少女(盐系)/偏优雅(clean)/偏时尚/偏自然
  shi_shang_f: ["shi_shang_f", "shao_nian_f", "xi_ju_f", "lang_man_f", "zi_ran_f"], // 偏少年/偏戏剧/偏浪漫/偏自然
  gu_dian_f: ["gu_dian_f", "shao_nv", "you_ya", "lang_man_f"],  // 用户给定：直偏曲
  zi_ran_f: ["zi_ran_f", "shao_nian_f", "you_ya", "gu_dian_f", "shi_shang_f"], // 偏少年(森系)/偏优雅(文艺)/偏古典/偏时尚
  xi_ju_f: ["xi_ju_f", "lang_man_f", "shi_shang_f", "gu_dian_f"], // 偏浪漫(华丽)/偏时尚(前卫)/偏古典
  // 男士五大风格（不分直曲，互偏皆常见）
  xi_ju_m: ["xi_ju_m", "gu_dian_m", "lang_man_m", "shi_shang_m"],
  zi_ran_m: ["zi_ran_m", "gu_dian_m", "shi_shang_m", "lang_man_m"],
  gu_dian_m: ["gu_dian_m", "xi_ju_m", "lang_man_m", "zi_ran_m"],
  lang_man_m: ["lang_man_m", "gu_dian_m", "xi_ju_m", "zi_ran_m"],
  shi_shang_m: ["shi_shang_m", "xi_ju_m", "zi_ran_m", "lang_man_m"],
};

export type StyleCombo = {
  main: string;       // 主风格 value
  lean: string;       // 偏风格 value
  combo: string;      // 组合展示名（古典型（偏浪漫型）/ 古典型）
  gender: "女士" | "男士";
  common: "纯风格" | "常见" | "罕见";
};

/** 列出某主风格的常见偏风格（含自身），用于下拉/约束 */
export function getStyleLeanOptions(main: string): string[] {
  return STYLE_LEAN[main] || [main];
}

/** 格式化组合名：主风格（偏XX型）；若偏=主则只显示主风格 */
export function formatStyleCombo(main: string, lean: string): string {
  const m = STYLE_DETAILS[main]?.proLabel || getStyleProLabel(main);
  const l = STYLE_DETAILS[lean]?.proLabel || getStyleProLabel(lean);
  if (!m) return "";
  if (!l || l === m) return m;
  return `${m}（偏${l}）`;
}

/** 生成全部 主×偏 组合：女士 8×8=64，男士 5×5=25 */
export function getStyleCombos(gender?: "女士" | "男士"): StyleCombo[] {
  const out: StyleCombo[] = [];
  const groups: { list: typeof FEMALE_STYLES | typeof MALE_STYLES; g: "女士" | "男士" }[] = [
    { list: FEMALE_STYLES, g: "女士" },
    { list: MALE_STYLES, g: "男士" },
  ];
  const lineOf = (v: string): StyleLine => STYLE_DETAILS[v]?.line || "";
  for (const { list, g } of groups) {
    if (gender && g !== gender) continue;
    for (const main of list) {
      for (const lean of list) {
        const isPure = main.value === lean.value;
        let common: StyleCombo["common"];
        if (isPure) {
          common = "纯风格";
        } else if (g === "男士") {
          // 男士不分直曲，5×5=25 组合均成立，无"罕见"
          common = "常见";
        } else {
          // 女士：跨直/曲（直偏曲 / 曲偏直）= 常见；同直/曲（直偏直 / 曲偏曲）= 罕见
          const ml = lineOf(main.value as string);
          const ll = lineOf(lean.value as string);
          common = ml && ll && ml !== ll ? "常见" : "罕见";
        }
        out.push({
          main: String(main.value),
          lean: String(lean.value),
          combo: formatStyleCombo(String(main.value), String(lean.value)),
          gender: g,
          common,
        });
      }
    }
  }
  return out;
}

// ==================== 12季色彩定义 ====================

/** 12季色彩（后端专业术语；label 为季型名，group 为其所属四季家族，不做大地/暖/冷等过度色彩家族归类） */
export const COLOR_SEASONS_PRO = [
  { value: "light_warm", label: "浅暖型", group: "春", marketLabel: "浅暖色", desc: "轻浅、明亮、暖色调" },
  { value: "warm_bright", label: "暖亮型", group: "春", marketLabel: "暖亮色", desc: "暖色调、轻浅、亮丽" },
  { value: "clear_warm", label: "净暖型", group: "春", marketLabel: "净暖色", desc: "明亮、艳丽、分明" },
  { value: "light_cool", label: "浅冷型", group: "夏", marketLabel: "浅冷色", desc: "轻浅、柔和、淡雅" },
  { value: "soft_cool", label: "柔冷型", group: "夏", marketLabel: "柔冷色", desc: "柔和淡雅、冷色调" },
  { value: "cool_soft", label: "冷柔型", group: "夏", marketLabel: "冷柔色", desc: "冷色调、浅淡、柔和" },
  { value: "warm_soft", label: "暖柔型", group: "秋", marketLabel: "暖柔色", desc: "暖色调、色泽浓重" },
  { value: "soft_warm", label: "柔暖型", group: "秋", marketLabel: "柔暖色", desc: "深厚、低饱和、暖色调" },
  { value: "deep_warm", label: "深暖型", group: "秋", marketLabel: "深暖色", desc: "浓郁、厚重" },
  { value: "clear_cool", label: "净冷型", group: "冬", marketLabel: "净冷色", desc: "艳丽明亮、深沉浓烈" },
  { value: "cool_bright", label: "冷亮型", group: "冬", marketLabel: "冷亮色", desc: "深沉、明亮、极端" },
  { value: "deep_cool", label: "深冷型", group: "冬", marketLabel: "深冷色", desc: "浓郁、艳丽、冷色调" },
] as const;

/** 12季色彩详细特征（真实色彩季型，单一事实来源；市场流行色由运营手动设置，不在此对应） */
export type ColorSeasonDetail = {
  tone: string; brightness: string; saturation: string;
  bestColors: string[]; avoidColors: string[];
  bestFabrics: string[]; bestPatterns: string[];
  matchingStyles: string[];
};

export const COLOR_SEASON_DETAILS: Record<string, ColorSeasonDetail> = {
  light_warm: { tone: "暖", brightness: "高明度", saturation: "高艳度", bestColors: ["浅金黄", "桃粉", "象牙白", "鹅黄", "浅杏"], avoidColors: ["深棕", "墨绿", "纯黑"], bestFabrics: ["雪纺", "真丝", "细棉", "蕾丝"], bestPatterns: ["小碎花", "圆点", "细条纹"], matchingStyles: ["少女型", "优雅型"] },
  warm_bright: { tone: "暖", brightness: "高明度", saturation: "高艳度", bestColors: ["珊瑚色", "金黄", "南蛇藤色", "橙红", "草绿"], avoidColors: ["灰蓝", "灰紫", "冷灰"], bestFabrics: ["棉质", "亚麻", "丝棉"], bestPatterns: ["花卉", "几何", "波普"], matchingStyles: ["少女型", "时尚型"] },
  clear_warm: { tone: "暖", brightness: "中高明度", saturation: "高艳度", bestColors: ["亮粉", "鲜绿", "西瓜红", "正红", "明黄"], avoidColors: ["卡其", "灰粉", "雾霾蓝"], bestFabrics: ["丝光棉", "亮面材质", "精细针织"], bestPatterns: ["大花", "撞色", "色块"], matchingStyles: ["戏剧型", "时尚型"] },
  light_cool: { tone: "冷", brightness: "高明度", saturation: "低艳度", bestColors: ["柔白", "雾粉", "奶柔色", "薰衣草紫", "灰蓝"], avoidColors: ["正红", "亮橙", "鲜绿"], bestFabrics: ["雪纺", "薄纱", "柔软棉"], bestPatterns: ["水彩风", "渐变", "淡雅印花"], matchingStyles: ["优雅型", "少年型"] },
  soft_cool: { tone: "冷", brightness: "中高明度", saturation: "低艳度", bestColors: ["绿玉色", "宝石蓝", "灰玫瑰色", "梅紫", "薄荷绿"], avoidColors: ["大红", "金黄", "草绿"], bestFabrics: ["精纺羊毛", "真丝", "棉混纺"], bestPatterns: ["暗纹", "提花", "素色"], matchingStyles: ["古典型", "优雅型"] },
  cool_soft: { tone: "冷", brightness: "中明度", saturation: "低艳度", bestColors: ["玫瑰粉", "石青色", "玫瑰红", "灰粉", "雾霾蓝"], avoidColors: ["橙红", "芥末黄", "焦糖"], bestFabrics: ["棉麻混纺", "柔软针织", "磨毛面料"], bestPatterns: ["抽象", "水墨风", "素色"], matchingStyles: ["自然型", "古典型"] },
  warm_soft: { tone: "暖", brightness: "中低明度", saturation: "低艳度", bestColors: ["驼色", "橄榄绿", "砖红", "焦糖色", "暖橙"], avoidColors: ["纯白", "宝蓝", "电光蓝"], bestFabrics: ["棉麻", "灯芯绒", "羊毛"], bestPatterns: ["格纹", "民族风", "大地色系"], matchingStyles: ["自然型", "优雅型"] },
  soft_warm: { tone: "暖", brightness: "低明度", saturation: "低艳度", bestColors: ["卡其", "咖啡", "铁锈红", "米色", "深棕"], avoidColors: ["亮粉", "鲜绿", "天蓝"], bestFabrics: ["粗针织", "丝绒", "皮革"], bestPatterns: ["粗花呢", "编织纹", "深色格纹"], matchingStyles: ["自然型", "古典型"] },
  deep_warm: { tone: "暖", brightness: "低明度", saturation: "中艳度", bestColors: ["深棕", "墨绿", "酒红", "深金", "咖啡棕"], avoidColors: ["浅粉", "天蓝", "鹅黄"], bestFabrics: ["羊绒", "丝绒", "粗花呢"], bestPatterns: ["大格纹", "动物纹", "深色花纹"], matchingStyles: ["戏剧型", "浪漫型"] },
  clear_cool: { tone: "冷", brightness: "低明度", saturation: "高艳度", bestColors: ["纯黑", "正红", "电光蓝", "宝蓝", "翠绿"], avoidColors: ["卡其", "驼色", "米色"], bestFabrics: ["真丝缎面", "皮革", "金属感面料"], bestPatterns: ["色块", "几何", "高对比"], matchingStyles: ["戏剧型", "时尚型"] },
  cool_bright: { tone: "冷", brightness: "低明度", saturation: "高艳度", bestColors: ["黑白", "藏蓝", "冰粉", "宝蓝", "松石绿"], avoidColors: ["焦糖", "暖橙", "芥末黄"], bestFabrics: ["皮革", "真丝", "缎面"], bestPatterns: ["极简", "撞色", "条纹"], matchingStyles: ["古典型", "戏剧型"] },
  deep_cool: { tone: "冷", brightness: "低明度", saturation: "高艳度", bestColors: ["纯白", "深海军蓝", "木莓红", "酒红", "玫红"], avoidColors: ["浅黄", "暖橙", "焦糖"], bestFabrics: ["精纺羊毛", "缎面", "亮面皮革"], bestPatterns: ["暗纹", "提花", "低调奢华"], matchingStyles: ["古典型", "浪漫型"] },
};

/** 色彩季型Key → 后端专业术语 */
export const COLOR_SEASON_PRO_MAP: Record<string, string> = {
  light_warm: "浅暖型", warm_bright: "暖亮型", clear_warm: "净暖型",
  light_cool: "浅冷型", soft_cool: "柔冷型", cool_soft: "冷柔型",
  warm_soft: "暖柔型", soft_warm: "柔暖型", deep_warm: "深暖型",
  clear_cool: "净冷型", cool_bright: "冷亮型", deep_cool: "深冷型",
};

/** 色彩季型Key → 前端通俗色系名（12季真实特征，避免大地/暖/冷等过度归类） */
export const COLOR_SEASON_MARKET_MAP: Record<string, string> = {
  light_warm: "浅暖色", warm_bright: "暖亮色", clear_warm: "净暖色",
  light_cool: "浅冷色", soft_cool: "柔冷色", cool_soft: "冷柔色",
  warm_soft: "暖柔色", soft_warm: "柔暖色", deep_warm: "深暖色",
  clear_cool: "净冷色", cool_bright: "冷亮色", deep_cool: "深冷色",
};

/**
 * 色彩季型 综合映射表（含所有旧key兼容）
 * 旧中文key → 新通俗色系名
 * 旧"形容词+季节"无后缀 key → 新通俗色系名
 * 旧"形容词+季节型" key → 新通俗色系名
 */
export const COLOR_SEASON_KEY_MAP: Record<string, string> = {
  // === 标准英文key → 通俗色系名 ===
  light_warm: "奶茶色", warm_bright: "珊瑚橘", clear_warm: "鹅黄色",
  light_cool: "雾霾蓝", soft_cool: "灰紫色", cool_soft: "薄荷绿",
  warm_soft: "驼色", soft_warm: "焦糖色", deep_warm: "酒红色",
  clear_cool: "藏蓝色", cool_bright: "冰白色", deep_cool: "墨灰色",
  // === 旧中文key兼容（mock-data 中的"浅春""冷冬"等，无"型"后缀） ===
  "浅春": "奶茶色", "暖春": "珊瑚橘", "净春": "鹅黄色",
  "柔夏": "灰紫色", "冷夏": "薄荷绿",
  "柔秋": "驼色", "暖秋": "焦糖色", "净秋": "鹅黄色", "深秋": "酒红色",
  "净冬": "藏蓝色", "冷冬": "冰白色",
  // === 旧"形容词+季节型"兼容（supplier/submit, brand 中的"浅春型"等） ===
  "浅春型": "奶茶色", "暖春型": "珊瑚橘", "净春型": "鹅黄色",
  "浅夏型": "雾霾蓝", "冷夏型": "薄荷绿", "柔夏型": "灰紫色",
  "柔秋型": "驼色", "暖秋型": "焦糖色", "深秋型": "酒红色",
  "净冬型": "藏蓝色", "冷冬型": "冰白色", "深冬型": "墨灰色",
  // === 旧"形容词+季节+型"额外变体（customers 页面中的错误命名） ===
  "浅秋": "驼色", "浅冬": "藏蓝色", "柔春": "奶茶色",
  "深春": "珊瑚橘", "柔冬": "冰白色",
  // === 旧通俗名兼容（上一版 marketLabel） ===
  "樱花粉": "奶茶色", "柠檬黄": "鹅黄色", "天空蓝": "雾霾蓝",
  "薰衣草": "灰紫色", "焦糖棕": "驼色", "枫叶红": "焦糖色",
  "宝石蓝": "藏蓝色", "银白色": "冰白色", "墨黑色": "墨灰色",
};

/**
 * 色彩季型 旧key → 标准英文key 归一化映射
 * 用于将数据库中的旧中文key转换为标准英文key
 */
export const COLOR_SEASON_NORMALIZE_MAP: Record<string, string> = {
  // 旧中文key（浅春/暖春…等旧名）→ 标准英文key（与真实十二季型一一对应）
  "浅春": "light_warm", "暖春": "warm_bright", "净春": "clear_warm",
  "浅夏": "light_cool", "柔夏": "soft_cool", "冷夏": "cool_soft",
  "柔秋": "soft_warm", "暖秋": "warm_soft", "净秋": "clear_warm", "深秋": "deep_warm",
  "净冬": "clear_cool", "冷冬": "cool_bright", "深冬": "deep_cool",
  // 旧"型"后缀key → 标准英文key
  "浅春型": "light_warm", "暖春型": "warm_bright", "净春型": "clear_warm",
  "浅夏型": "light_cool", "柔夏型": "soft_cool", "冷夏型": "cool_soft",
  "柔秋型": "soft_warm", "暖秋型": "warm_soft", "深秋型": "deep_warm",
  "净冬型": "clear_cool", "冷冬型": "cool_bright", "深冬型": "deep_cool",
  // 非标准名 → 最近似标准key
  "浅秋": "soft_warm", "浅冬": "clear_cool", "柔春": "light_warm",
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

/** 获取色彩季型前端显示名（默认返回真实季型名，如"浅暖型"；市场流行色由运营手动设置，不作为默认显示） */
export function getColorSeasonLabel(key: string | null | undefined): string {
  if (!key) return "";
  const normalized = normalizeColorSeasonKey(key);
  return COLOR_SEASON_PRO_MAP[normalized] || COLOR_SEASON_MARKET_MAP[normalized] || COLOR_SEASON_KEY_MAP[key] || key;
}

/** 获取色彩季型后端专业术语 */
export function getColorSeasonProLabel(key: string | null | undefined): string {
  if (!key) return "";
  const normalized = normalizeColorSeasonKey(key);
  return COLOR_SEASON_PRO_MAP[normalized] || key;
}

/** 获取带专业术语的色彩季型展示名，如"浅暖色（浅暖型·春）" */
export function getColorSeasonFullLabel(key: string | null | undefined): string {
  if (!key) return "";
  const normalized = normalizeColorSeasonKey(key);
  const market = COLOR_SEASON_MARKET_MAP[normalized];
  const pro = COLOR_SEASON_PRO_MAP[normalized];
  const season = COLOR_SEASONS_PRO.find(c => c.value === normalized)?.group;
  if (market && pro && season) return `${market}（${pro}·${season}）`;
  if (market && pro) return `${market}（${pro}）`;
  return market || pro || key;
}

/** 商品品类全表（编号 + 名称） */
export const PRODUCT_CATEGORIES = [
  { code: "TX",   label: "T恤针织衫" },
  { code: "BQ",   label: "半身裙" },
  { code: "KZ",   label: "裤装（仔裤/西裤/休闲裤/牛仔外套）" },
  { code: "SZ",   label: "梭织上装（小衫/打底衫）" },
  { code: "JJF",  label: "家居服" },
  { code: "LQ",   label: "连衣裙" },
  { code: "KL",   label: "夹克衫" },
  { code: "DY",   label: "大衣" },
  { code: "FY",   label: "风衣/外套/单西装" },
  { code: "XZ",   label: "西装套装" },
  { code: "PK",   label: "派克服（含内胆真毛）" },
  { code: "PK2",  label: "派克服（不含内胆）" },
  { code: "MF",   label: "棉服" },
  { code: "YR",   label: "羽绒服（真毛领）" },
  { code: "MS",   label: "毛衫（上衣/连衣裙）" },
  { code: "TZ",   label: "套装（1套1-2件）" },
  { code: "HF",   label: "汉服（1套3件）" },
  { code: "WY",   label: "卫衣" },
  { code: "FH",   label: "复合颗粒羽绒（仿皮毛/含帽真毛领）" },
  { code: "MJ",   label: "马甲（羊绒/毛呢时尚款）" },
  { code: "MJ2",  label: "马甲衬衣假两件（1套2件）" },
  { code: "YJF",  label: "瑜伽服（1套3件）" },
  { code: "NY",   label: "内衣（不含杯模）" },
  { code: "XF",   label: "校服" },
  { code: "ZY",   label: "职业装" },
  { code: "WD",   label: "舞蹈服" },
  { code: "HSLF", label: "礼服/香云纱" },
  { code: "TZQP", label: "唐装/旗袍" },
  { code: "WJ",   label: "围巾" },
  { code: "YP",   label: "婴幼儿爬行服" },
  { code: "YY",   label: "泳衣（1套2件）" },
  { code: "LQF",  label: "篮球服（T恤+短裤）" },
  { code: "CW",   label: "宠物服" },
] as const;

/** 品类选项（用于下拉选择，显示格式：编号-名称） */
export const CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map(c => `${c.code}-${c.label}`);

/** 根据编号获取品类名称 */
export function getCategoryLabel(code: string): string {
  const cat = PRODUCT_CATEGORIES.find(c => c.code === code);
  return cat ? cat.label : code;
}

/** 从 "编号-名称" 格式中提取编号 */
export function extractCategoryCode(display: string): string {
  const idx = display.indexOf("-");
  return idx > 0 ? display.slice(0, idx) : display;
}

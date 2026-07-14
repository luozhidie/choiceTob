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
// 说明：风格名与直曲分类由运营定义（见上方 FEMALE_STYLES / MALE_STYLES）。
//       特征字段（廓形/面料/图案/场合/避雷/关键词语）默认留空——禁用西曼等外部理论体系，
//       由运营按自有体系在 STYLE_DETAILS 中填写；市场风格映射在 styleRefs 手动设置。

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
  /* ── 少女型（淑女风）── */
  shao_nv: {
    proLabel: "少女型", market: "淑女风", line: "曲线型",
    keywords: [],
    silhouette: "曲线版型、曲线款型、长度到小腿的连衣裙、喇叭裙、百褶裙（褶不能太大）、大圆领、荷叶边、飘带、窄边装饰（要曲线的）、精致小花边、蕾丝边、裙装比裤装更合适",
    fabric: "细棉、软质毛料、细呢料、窄灯芯绒、平绒、丝绒、苏格兰呢、真丝、纱",
    pattern: "小圆点、可爱的小花朵、细条纹、细格、中格、小碎花、小动物、卡通图案",
    detail: "曲线款型的小套装、圆领、圆襟、兜袋边缘线为曲线型、袖/领口有蝴蝶结装饰、喇叭裙、百褶裙、可穿毛衣、开衫上班",
    occasion: "日常、职业、休闲",
    body: "",
    avoid: "硬皮装、粗毛线、粗毛线衣等带有粗糙感的面料、成熟感、大人化、浓重、粗糙的图案",
  },
  /* ── 优雅型（知性风）── */
  you_ya: {
    proLabel: "优雅型", market: "知性风", line: "曲线型",
    keywords: [],
    silhouette: "曲线剪裁、收腰、领襟边缘呈曲线型、回避直角、皱褶装饰、膨松袖子、垂吊感连衣长裙、飘逸长裙、身材丰满可穿包身收口裙",
    fabric: "纱、真丝、丝绒、羊绒、细呢、细毛料、兔毛、裘皮",
    pattern: "水彩画式温柔、朦胧的图案、中等大小的花朵、稍大的水点、排列不均匀的、有凹凸感的、曲线型的",
    detail: "合身的西式套裙、领襟兜处边缘线为曲线、西服驳头呈圆形、小圆领、无领套装、短裙包身收口或鱼尾短裙、上下面料质地可不同（上硬下软）、可穿连衣裙加外套上班、方领/尖领套装要配丝巾破其尖锐感",
    occasion: "日常、职业、休闲、晚装",
    body: "",
    avoid: "卡其布、粗麻、粗灯芯绒等粗糙厚重的面料、粗糙、生硬、粗犷豪放的图案、宽平垫肩",
  },
  /* ── 浪漫型（名媛风）── */
  lang_man_f: {
    proLabel: "浪漫型", market: "名媛风", line: "曲线型",
    keywords: [],
    silhouette: "曲线版型、X型剪裁、包身裙、收腰多皱连衣裙、鱼尾裙、喇叭裙、大领子、大领口、垂吊大领、肩部可膨松、灯笼袖、荷叶边衬衣、裤子不带裤线",
    fabric: "有光泽的丝缎、羊绒、细呢、兔毛等有华丽感的、高级的面料",
    pattern: "华美的装饰图案、大花、花边装饰、曲线感强的",
    detail: "强调曲线感、面料华丽、领襟兜处边缘线为曲线形、西服驳头呈圆形、圆领、无领套装、领口最好有荷叶边等装饰、短裙包身收口、方/尖领套装要配丝巾、丝绸衬衣、连衣裙都可",
    occasion: "日常、职业、休闲、晚装",
    body: "",
    avoid: "土布、粗麻织物、男性化、小孩子气、硬朗的图案、直筒裙、A字裙",
  },
  /* ── 少年型（中性风）── */
  shao_nian_f: {
    proLabel: "少年型", market: "中性风", line: "直线型",
    keywords: [],
    silhouette: "直版型、直线剪裁、短上衣、夹克衫、小皮装、短裤、短裙、裤装比裙装更漂亮、拉链、明兜、立领、多扣、明线做工",
    fabric: "棉类、灯芯绒、薄毛料、中粗呢料、咔叽布（斜纹棉布）、毛绒布、编织细毛衣、各种皮装",
    pattern: "清晰明朗的竖条、细格、有个性的图案、当季流行的、抽象的图案",
    detail: "多扣、小立领、小开领、短小精干的西式套装、可以是裤套装",
    occasion: "日常、职业、休闲、晚装",
    body: "",
    avoid: "过于女性化、柔软的面料、花朵图案、女性化、成熟、端庄、柔软的图案",
  },
  /* ── 时尚型（潮牌风）── */
  shi_shang_f: {
    proLabel: "时尚型", market: "潮牌风", line: "直线型",
    keywords: [],
    silhouette: "直线打扮比曲线好、剪裁锋利有棱角、符合当年流行趋势、裤装（直筒裤、喇叭裤等，不适合西裤）、可带钉饰、流苏、磨破等装饰、短夹克衫、强调民族感的、复杂、有变化、不规则、不对称",
    fabric: "细、薄薄的织物、皮装",
    pattern: "紧跟时尚当年流行的图案、有个性、造型独特、异想天开的、图案切割清晰",
    detail: "短小精干的套装、领子衣襟兜袋等处一定要有变化、小小的西装领、翻领、配A字裙",
    occasion: "日常、职业、休闲、晚装",
    body: "",
    avoid: "粗糙质地、自然质地、过时的、土气的、过于端庄保守的图案、西裤",
  },
  /* ── 古典型（职业风）── */
  gu_dian_f: {
    proLabel: "古典型", market: "职业风", line: "直线型",
    keywords: [],
    silhouette: "合体的直线剪裁、腰必须收但不能过分紧、都市化、华贵、精致、高级的感觉",
    fabric: "丝、缎、天鹅绒、羊绒、精细羊毛、纯毛、细毛料、精纺呢、裘皮",
    pattern: "小而细腻的几何图案、小条纹、小格子、大牙格、千鸟纹、人字呢纹",
    detail: "合体的套装、小西装领、无领（领口不要太圆，一字形或略方）、配围巾或项链等装饰、双排扣上衣（不能太长）、直身收腰连衣裙加外衣、西装裙、一步短裙/长裙、方领/尖领衬衫、小V领、挺括有裤线的西裤、直筒裤、窄边装饰（夏奈尔风格）",
    occasion: "日常、职业、休闲、晚装",
    body: "",
    avoid: "土布、粗麻等粗糙的东西、怪异的、粗糙的、厚重的、过于女性化、孩子气的图案、太夸张",
  },
  /* ── 自然型（休闲风）── */
  zi_ran_f: {
    proLabel: "自然型", market: "休闲风", line: "直线型",
    keywords: [],
    silhouette: "直线剪裁、几何型造型、细节越简单越好、衣服可比身材大一号、领口不要严谨、大西装领、大V字领、两粒扣、方的/尖的翻领、拉链衫、腰不能收得过于曲线、直筒裤、宽腿裤、A字长裙、直筒/乡村吊带长裙、喇叭长裙、中长裙",
    fabric: "无光泽感的丝绸、缎类、棉、麻、粗毛线、混纺、晴纶、尼龙、布围巾、软棉绒布、灯芯绒、粗呢、粗毛料、人字呢、翻毛的、磨砂皮、鹿皮、鸵鸟皮、猪皮",
    pattern: "大格子、条纹、大宽条、豹纹、野兽皮纹、民族风情的、腊染、扎染、大印花、铜钱花纹、来自大自然的图纹（如叶子、山脉肌理等）",
    detail: "两粒扣直线领或V字领的西装、配西装短裙、尺寸可稍宽松、西装宜敞开扣子穿、西式套装配衬衣、领口结丝巾很漂亮、裤套装也合适、宽腿的麻料/细呢料长裤把衬衣束在裤腰里",
    occasion: "日常、职业、休闲、晚装",
    body: "",
    avoid: "过于精致、拘束、有光泽的面料、拘束的、古板的、前卫的、豪华的图案",
  },
  /* ── 戏剧型（大牌风）── */
  xi_ju_f: {
    proLabel: "戏剧型", market: "大牌风", line: "直线型",
    keywords: [],
    silhouette: "直线版型、细节处直线、曲线剪裁都适合、线条笔直、锋利的外套、紧身衣、皱褶很多的连衣裙、大枪驳头西装、大V字领、特大领、一粒扣的服装、可穿比型号大一号、大两号的、束腰、泡泡袖、荷叶袖、大方领、大蝴蝶结、带垫肩、高裙衩、宽腰带、宽腿裤、大喇叭裤、紧腿裤",
    fabric: "丝类、缎类、纱类、平绒、羊绒、棉制品、哔叽、毛料、呢料、羊皮、裘皮、鳄鱼皮、麻、厚呢、粗棉、灯芯绒、金/银丝织物、亮片织物、闪亮的、有金属感觉的、高科技感觉的、粗皮类、磨砂皮、粗毛线",
    pattern: "大胆、分明、对比强烈、几何图案、块面分割的、等距的、宽条纹的、大格子的、大绣花图案",
    detail: "大西装领、双排扣、大V字领、一粒扣、无扣的上装、裙套装、直线剪裁衬衣、男式衬衣、男式T恤、背带西裤套装、男装裤套装",
    occasion: "日常、职业、休闲、晚装",
    body: "",
    avoid: "小孩子气、小气、中庸的面料、小孩子气的、可爱的、小气的、中庸的、小家子气的图案",
  },
  /* ── 戏剧型（气场型男）── */
  xi_ju_m: {
    proLabel: "戏剧型", market: "气场型男", line: "",
    keywords: [],
    silhouette: "",
    fabric: "",
    pattern: "",
    detail: "",
    occasion: "",
    body: "",
    avoid: "",
  },
  /* ── 自然型（随性达人）── */
  zi_ran_m: {
    proLabel: "自然型", market: "随性达人", line: "",
    keywords: [],
    silhouette: "",
    fabric: "",
    pattern: "",
    detail: "",
    occasion: "",
    body: "",
    avoid: "",
  },
  /* ── 古典型（精英绅士）── */
  gu_dian_m: {
    proLabel: "古典型", market: "精英绅士", line: "",
    keywords: [],
    silhouette: "",
    fabric: "",
    pattern: "",
    detail: "",
    occasion: "",
    body: "",
    avoid: "",
  },
  /* ── 浪漫型（优雅先生）── */
  lang_man_m: {
    proLabel: "浪漫型", market: "优雅先生", line: "",
    keywords: [],
    silhouette: "",
    fabric: "",
    pattern: "",
    detail: "",
    occasion: "",
    body: "",
    avoid: "",
  },
  /* ── 时尚型（潮流先锋）── */
  shi_shang_m: {
    proLabel: "时尚型", market: "潮流先锋", line: "",
    keywords: [],
    silhouette: "",
    fabric: "",
    pattern: "",
    detail: "",
    occasion: "",
    body: "",
    avoid: "",
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
  colorPrinciple: string;
  testColors: string;
  suitableAccessories: string;
  idealColors: string[];
  classicHexColors: string[];
  description: string;
  categoryGroup: string;
  matrixPosition: string;
};



export const COLOR_SEASON_DETAILS: Record<string, ColorSeasonDetail> = {
  light_warm: {
    tone: '暖', brightness: '高明度', saturation: '高艳度',
    bestColors: ["奶油色", "桃色", "浅苔绿", "珊瑚粉", "亮鲑肉色", "天青蓝", "正黄"], avoidColors: ["深棕", "墨绿", "纯黑"],
    bestFabrics: ["雪纺", "真丝", "细棉", "蕾丝"], bestPatterns: ["小碎花", "圆点", "细条纹"],
    matchingStyles: ["少女型", "优雅型"],
    colorPrinciple: '遵循"浅、亮、暖"的原则',
    testColors: '桃色 + 浅苔绿',
    suitableAccessories: 'K金为主，透明晶莹宝石',
    idealColors: ["奶油色", "桃色", "浅苔绿", "珊瑚粉", "亮鲑肉色", "天青蓝", "正黄"],
    classicHexColors: ["#FFF8DC", "#FFB6C1", "#98FB98", "#FF7F7F", "#FA8072", "#87CEEB", "#FFD700"],
    description: '浅暖型：明度高、艳度高、暖调，适合明亮温暖的浅色调',
    categoryGroup: '浅色型',
    matrixPosition: '浅（明度高）+ 亮（艳度高）',
  },
  light_cool: {
    tone: '冷', brightness: '高明度', saturation: '低艳度',
    bestColors: ["铃兰色", "雾粉", "海绿", "水晶紫", "玫瑰红", "冰紫", "薰衣草紫"], avoidColors: ["正红", "亮橙", "鲜绿"],
    bestFabrics: ["雪纺", "薄纱", "柔软棉"], bestPatterns: ["水彩风", "渐变", "淡雅印花"],
    matchingStyles: ["优雅型", "少年型"],
    colorPrinciple: '遵循"浅、柔、冷"的原则',
    testColors: '雾粉 + 海绿',
    suitableAccessories: '磨砂哑光白金，浅色K金，淡雅宝石',
    idealColors: ["铃兰色", "雾粉", "海绿", "水晶紫", "玫瑰红", "冰紫", "薰衣草紫"],
    classicHexColors: ["#E8E0F0", "#FFB6C1", "#66CDAA", "#DDA0DD", "#FF1493", "#E6E6FA", "#9B59B6"],
    description: '浅冷型：明度高、艳度低、冷调，适合明亮清冷的柔和色调',
    categoryGroup: '浅色型',
    matrixPosition: '浅（明度高）+ 柔（艳度低）',
  },
  deep_warm: {
    tone: '暖', brightness: '低明度', saturation: '低艳度',
    bestColors: ["驼色", "咖啡棕", "橄榄绿", "南瓜色", "铁绣红", "金棕", "鲑肉色"], avoidColors: ["浅粉", "天蓝", "鹅黄"],
    bestFabrics: ["羊绒", "丝绒", "粗花呢"], bestPatterns: ["大格纹", "动物纹", "深色花纹"],
    matchingStyles: ["戏剧型", "浪漫型"],
    colorPrinciple: '遵循"深、柔、暖"的原则',
    testColors: '鲑肉色 + 橄榄绿',
    suitableAccessories: '浓重的黄金类饰品',
    idealColors: ["驼色", "咖啡棕", "橄榄绿", "南瓜色", "铁绣红", "金棕", "鲑肉色"],
    classicHexColors: ["#8B7355", "#6B4226", "#556B2F", "#FF7518", "#B7410E", "#B8860B", "#FA8072"],
    description: '深暖型：明度低、艳度低、暖调，适合深沉温暖的柔和色调',
    categoryGroup: '深色型',
    matrixPosition: '深（明度低）+ 柔（艳度低）',
  },
  deep_cool: {
    tone: '冷', brightness: '低明度', saturation: '高艳度',
    bestColors: ["深凫色", "梅紫", "倒挂金钟紫", "正绿", "青椒绿", "樱桃色", "粉蓝"], avoidColors: ["浅黄", "暖橙", "焦糖"],
    bestFabrics: ["精纺羊毛", "缎面", "亮面皮革"], bestPatterns: ["暗纹", "提花", "低调奢华"],
    matchingStyles: ["古典型", "浪漫型"],
    colorPrinciple: '遵循"深、亮、冷"的原则',
    testColors: '倒挂金钟紫 + 深凫色',
    suitableAccessories: '白金类饰品，色泽浓郁的宝石',
    idealColors: ["深凫色", "梅紫", "倒挂金钟紫", "正绿", "青椒绿", "樱桃色", "粉蓝"],
    classicHexColors: ["#003153", "#9370DB", "#C154C1", "#008000", "#4CAF50", "#DE3163", "#ADD8E6"],
    description: '深冷型：明度低、艳度高、冷调，适合深沉冷艳的鲜亮色调',
    categoryGroup: '深色型',
    matrixPosition: '深（明度低）+ 亮（艳度高）',
  },
  warm_bright: {
    tone: '暖', brightness: '高明度', saturation: '高艳度',
    bestColors: ["浅桃色", "浅苔绿", "珊瑚色", "亮鲑肉色", "天青蓝", "琥珀色", "鲜黄"], avoidColors: ["灰蓝", "灰紫", "冷灰"],
    bestFabrics: ["棉质", "亚麻", "丝棉"], bestPatterns: ["花卉", "几何", "波普"],
    matchingStyles: ["少女型", "时尚型"],
    colorPrinciple: '遵循"暖、浅、亮"的原则',
    testColors: '浅桃色 + 浅苔绿',
    suitableAccessories: '黄金类，琥珀黄玉，松石，浅色珍珠',
    idealColors: ["浅桃色", "浅苔绿", "珊瑚色", "亮鲑肉色", "天青蓝", "琥珀色", "鲜黄"],
    classicHexColors: ["#FFDAB9", "#98FB98", "#FF7F50", "#FA8072", "#87CEEB", "#FFBF00", "#FFD700"],
    description: '暖亮型：明度高、艳度高、暖调，适合温暖鲜亮的色调',
    categoryGroup: '暖色型',
    matrixPosition: '浅（明度高）+ 亮（艳度高）',
  },
  warm_soft: {
    tone: '暖', brightness: '低明度', saturation: '低艳度',
    bestColors: ["南瓜色", "橄榄绿", "苔绿", "铁绣红", "金棕", "鲑肉粉", "咖啡棕"], avoidColors: ["纯白", "宝蓝", "电光蓝"],
    bestFabrics: ["棉麻", "灯芯绒", "羊毛"], bestPatterns: ["格纹", "民族风", "大地色系"],
    matchingStyles: ["自然型", "优雅型"],
    colorPrinciple: '遵循"暖、柔、深"的原则',
    testColors: '南瓜色 + 橄榄绿',
    suitableAccessories: '黄金、琥珀、玛瑙、黄玉、绿松石',
    idealColors: ["南瓜色", "橄榄绿", "苔绿", "铁绣红", "金棕", "鲑肉粉", "咖啡棕"],
    classicHexColors: ["#FF7518", "#556B2F", "#6B8E23", "#B7410E", "#B8860B", "#FFA07A", "#6B4226"],
    description: '暖柔型：明度低、艳度低、暖调，适合温暖柔和的深色调',
    categoryGroup: '暖色型',
    matrixPosition: '深（明度低）+ 柔（艳度低）',
  },
  cool_bright: {
    tone: '冷', brightness: '低明度', saturation: '高艳度',
    bestColors: ["木莓红", "梅紫", "倒挂金钟紫", "正绿", "青椒绿", "长春花蓝", "樱桃色"], avoidColors: ["焦糖", "暖橙", "芥末黄"],
    bestFabrics: ["皮革", "真丝", "缎面"], bestPatterns: ["极简", "撞色", "条纹"],
    matchingStyles: ["古典型", "戏剧型"],
    colorPrinciple: '遵循"冷、深、亮"的原则',
    testColors: '倒挂金钟紫 + 梅紫',
    suitableAccessories: '有光泽感的白金，回避黄金',
    idealColors: ["木莓红", "梅紫", "倒挂金钟紫", "正绿", "青椒绿", "长春花蓝", "樱桃色"],
    classicHexColors: ["#E30B5C", "#9370DB", "#C154C1", "#008000", "#4CAF50", "#CCCCFF", "#DE3163"],
    description: '冷亮型：明度低、艳度高、冷调，适合冷艳鲜亮的深色调',
    categoryGroup: '冷色型',
    matrixPosition: '深（明度低）+ 亮（艳度高）',
  },
  cool_soft: {
    tone: '冷', brightness: '高明度', saturation: '低艳度',
    bestColors: ["薰衣草紫", "水晶紫", "雾粉", "铃兰色", "海绿", "玫瑰红", "兰花紫"], avoidColors: ["橙红", "芥末黄", "焦糖"],
    bestFabrics: ["棉麻混纺", "柔软针织", "磨毛面料"], bestPatterns: ["抽象", "水墨风", "素色"],
    matchingStyles: ["自然型", "古典型"],
    colorPrinciple: '遵循"冷、浅、柔"的原则',
    testColors: '薰衣草紫 + 水晶紫',
    suitableAccessories: '哑光磨砂白金，柔和宝石',
    idealColors: ["薰衣草紫", "水晶紫", "雾粉", "铃兰色", "海绿", "玫瑰红", "兰花紫"],
    classicHexColors: ["#9B59B6", "#DDA0DD", "#FFB6C1", "#E8E0F0", "#66CDAA", "#FF1493", "#DA70D6"],
    description: '冷柔型：明度高、艳度低、冷调，适合冷峻柔和的浅色调',
    categoryGroup: '冷色型',
    matrixPosition: '浅（明度高）+ 柔（艳度低）',
  },
  clear_warm: {
    tone: '暖', brightness: '高明度', saturation: '高艳度',
    bestColors: ["亮鲑肉色", "鲜黄", "珊瑚粉", "西瓜红", "天青蓝", "柠檬黄", "亮粉"], avoidColors: ["卡其", "灰粉", "雾霾蓝"],
    bestFabrics: ["丝光棉", "亮面材质", "精细针织"], bestPatterns: ["大花", "撞色", "色块"],
    matchingStyles: ["戏剧型", "时尚型"],
    colorPrinciple: '遵循"亮、浅、暖"的原则',
    testColors: '亮鲑肉色 + 鲜黄',
    suitableAccessories: '抛光黄金，光泽好的宝石',
    idealColors: ["亮鲑肉色", "鲜黄", "珊瑚粉", "西瓜红", "天青蓝", "柠檬黄", "亮粉"],
    classicHexColors: ["#FA8072", "#FFD700", "#FF7F7F", "#FC6C85", "#87CEEB", "#FFF44F", "#FF69B4"],
    description: '净暖型：明度高、艳度高、暖调，适合纯净温暖的鲜亮色调',
    categoryGroup: '净色型',
    matrixPosition: '浅（明度高）+ 亮（艳度高）',
  },
  clear_cool: {
    tone: '冷', brightness: '低明度', saturation: '高艳度',
    bestColors: ["樱桃色", "深凫色", "鲜红", "正绿", "倒挂金钟紫", "粉蓝", "纯白"], avoidColors: ["卡其", "驼色", "米色"],
    bestFabrics: ["真丝缎面", "皮革", "金属感面料"], bestPatterns: ["色块", "几何", "高对比"],
    matchingStyles: ["戏剧型", "时尚型"],
    colorPrinciple: '遵循"亮、深、冷"的原则',
    testColors: '樱桃色 + 深凫色',
    suitableAccessories: '黄金或铂金珠宝',
    idealColors: ["樱桃色", "深凫色", "鲜红", "正绿", "倒挂金钟紫", "粉蓝", "纯白"],
    classicHexColors: ["#DE3163", "#003153", "#FF0000", "#008000", "#C154C1", "#ADD8E6", "#FFFFFF"],
    description: '净冷型：明度低、艳度高、冷调，适合纯净冷艳的深色调',
    categoryGroup: '净色型',
    matrixPosition: '深（明度低）+ 亮（艳度高）',
  },
  soft_warm: {
    tone: '暖', brightness: '低明度', saturation: '低艳度',
    bestColors: ["桃色", "橄榄绿", "苔绿", "铁绣红", "鲑肉粉", "金棕", "可可色", "贝壳粉"], avoidColors: ["亮粉", "鲜绿", "天蓝"],
    bestFabrics: ["粗针织", "丝绒", "皮革"], bestPatterns: ["粗花呢", "编织纹", "深色格纹"],
    matchingStyles: ["自然型", "古典型"],
    colorPrinciple: '遵循"柔、深、暖"的原则',
    testColors: '桃色 + 橄榄绿',
    suitableAccessories: '磨砂哑光黄金，琥珀，玛瑙，暖珍珠',
    idealColors: ["桃色", "橄榄绿", "苔绿", "铁绣红", "鲑肉粉", "金棕", "可可色", "贝壳粉"],
    classicHexColors: ["#FFB6C1", "#556B2F", "#6B8E23", "#B7410E", "#FFA07A", "#B8860B", "#6B4226", "#F4A460"],
    description: '柔暖型：明度低、艳度低、暖调，适合灰暖柔和的深色调',
    categoryGroup: '柔色型',
    matrixPosition: '深（明度低）+ 柔（艳度低）',
  },
  soft_cool: {
    tone: '冷', brightness: '高明度', saturation: '低艳度',
    bestColors: ["兰花紫", "海绿", "水晶紫", "雾粉", "可可色", "玫瑰棕", "铃兰色", "冰灰"], avoidColors: ["大红", "金黄", "草绿"],
    bestFabrics: ["精纺羊毛", "真丝", "棉混纺"], bestPatterns: ["暗纹", "提花", "素色"],
    matchingStyles: ["古典型", "优雅型"],
    colorPrinciple: '遵循"冷、浅、柔"的原则',
    testColors: '兰花紫 + 海绿',
    suitableAccessories: '哑光磨砂白金，柔和宝石',
    idealColors: ["兰花紫", "海绿", "水晶紫", "雾粉", "可可色", "玫瑰棕", "铃兰色", "冰灰"],
    classicHexColors: ["#DA70D6", "#66CDAA", "#DDA0DD", "#FFB6C1", "#6B4226", "#BC8F8F", "#E8E0F0", "#C0C0C0"],
    description: '柔冷型：明度高、艳度低、冷调，适合灰冷柔和的浅色调',
    categoryGroup: '柔色型',
    matrixPosition: '浅（明度高）+ 柔（艳度低）',
  },
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

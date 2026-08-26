// 八大风格 · 真人试穿测试 配置
// 8 件风格测试衣（实物）的元数据 + 图片路径。
// 路径规则：
//   - 以 / 开头：使用网站自身 CDN（public/tryon-garments/），最稳定
//   - 以桶内路径开头：回退到 Supabase blocks-images 公开桶
// 本目录图片均为挂拍干净单品图，已按风格命名。

export interface StyleGarment {
  id: string;
  name: string;          // 风格名（与女士问卷 results.name 一致，用于预排序）
  storagePath: string;   // blocks-images 桶内路径
  short: string;         // 一句话定位
  desc: string;          // 风格说明
  keywords: string[];    // 关键词标签
  order: number;         // 默认展示顺序
}

export const STYLE_GARMENTS: StyleGarment[] = [
  {
    id: "shaonian",
    name: "少年型",
    // 实物：藏蓝镂空刺绣衬衫（直线硬朗，扣子全扣）
    storagePath: "/tryon-garments/shaonian.png",
    short: "帅气利落 · 中性直线",
    desc: "直线条、帅气、利落、偏中性。适合衬衫、西装、直筒裤等硬朗廓形。",
    keywords: ["帅气", "直线", "中性", "利落", "少年感"],
    order: 1,
  },
  {
    id: "shishang",
    name: "时尚型",
    // 实物：黑白细格纹撞白领西装（设计感撞色廓形）
    storagePath: "/tryon-garments/shishang.png",
    short: "个性潮流 · 设计感",
    desc: "个性、潮流、前卫、有设计感。适合廓形感、解构、撞色等时髦单品。",
    keywords: ["个性", "潮流", "设计感", "酷感"],
    order: 2,
  },
  {
    id: "gudian",
    name: "古典型",
    // 实物：黑色珠饰边短款外套（闭合、精致、上品严谨）
    storagePath: "/tryon-garments/gudian.png",
    short: "端庄精致 · 上品严谨",
    desc: "端庄、严谨、精致、上品。适合套装、直身裙、质感面料等职业优雅款。",
    keywords: ["端庄", "精致", "严谨", "职业"],
    order: 3,
  },
  {
    id: "ziran",
    name: "自然型",
    // 实物：卡其色竖条纹西装外套（休闲潇洒）
    storagePath: "/tryon-garments/ziran.png",
    short: "潇洒随意 · 亲切舒适",
    desc: "潇洒、随意、亲切、无束缚。适合棉麻、针织、休闲廓形等舒适单品。",
    keywords: ["自然", "随意", "亲切", "舒适"],
    order: 4,
  },
  {
    id: "xiju",
    name: "戏剧型",
    // 实物：深蓝色双排扣西装外套（大气强气场）
    storagePath: "/tryon-garments/xiju.png",
    short: "大气夸张 · 强气场",
    desc: "夸张、大气、醒目、强气场。适合长款、大廓形、强对比的醒目标款。",
    keywords: ["大气", "夸张", "醒目", "气场"],
    order: 5,
  },
  {
    id: "shaonv",
    name: "少女型",
    // 实物：白色波点娃娃领蝴蝶结上衣（甜美圆润）
    storagePath: "/tryon-garments/shaonv.png",
    short: "甜美圆润 · 活泼可爱",
    desc: "甜美、圆润、可爱、活泼。适合荷叶边、泡泡袖、柔和印花等少女款。",
    keywords: ["甜美", "可爱", "圆润", "活泼"],
    order: 6,
  },
  {
    id: "youya",
    name: "优雅型",
    // 实物：黑白玫瑰印花收腰西装（温柔柔美）
    storagePath: "/tryon-garments/youya.png",
    short: "温柔柔美 · 女人味",
    desc: "温柔、柔美、精致、女人味。适合垂坠面料、收腰连衣裙等柔美款。",
    keywords: ["优雅", "柔美", "温婉", "女人味"],
    order: 7,
  },
  {
    id: "langman",
    name: "浪漫型",
    // 实物：浅蓝波点荷叶边 V 领上衣（华丽妩媚曲线）
    storagePath: "/tryon-garments/langman.png",
    short: "华丽妩媚 · 曲线性感",
    desc: "华丽、性感、妩媚、重曲线。适合曲线廓形、蕾丝、绸缎等妩媚款。",
    keywords: ["华丽", "妩媚", "曲线", "性感"],
    order: 8,
  },
];

// 按问卷预测风格预排序：把命中的风格排到最前
export function sortByPredicted(
  garments: StyleGarment[],
  predictedName: string | null
): StyleGarment[] {
  if (!predictedName) return [...garments].sort((a, b) => a.order - b.order);
  const hit = garments.find((g) => g.name === predictedName);
  if (!hit) return [...garments].sort((a, b) => a.order - b.order);
  const rest = garments.filter((g) => g.name !== predictedName);
  return [hit, ...rest.sort((a, b) => a.order - b.order)];
}

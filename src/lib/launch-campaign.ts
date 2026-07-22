// 专场「秋款上新企划」长流程活动模块
// 配置存于 Supabase page_blocks 表（type = "launch_campaign"）
// 后台可编辑：/admin/blocks
// 渲染位置：miniprogram-native/pages/home/index.wxml 的 <template name="blk"> launch_campaign 分支

export type LaunchCouponTier = {
  amount: number;      // 满减金额（元）
  threshold: number;   // 门槛金额（元）
};

export type LaunchLiveStream = {
  brand: string;       // 品牌名
  time: string;        // 时间段文本（如 "16:00-18:00"）
  avatar: string;      // 主播头像 URL
  link?: string;       // 直播间链接（可选）
};

export type LaunchBrand = {
  name: string;             // 品牌名
  slogan: string;           // 标语（如 "质感纱感TOP"）
  highlight?: string;       // 副标（如 "韩系针织·开衫"）
  images: string[];         // 商品图（4-5 张）
  link?: string;            // 跳转链接（可选）
};

export type LaunchTrendBrand = {
  name: string;             // 品牌名
  slogan: string;           // 标语
  image: string;            // 单张图
  link?: string;
};

export type LaunchNewProduct = {
  image: string;            // 商品图
  title: string;            // 商品标题
  price: string;            // 价格文本
  badge?: string;           // 角标（如 "新人福利" "今日新款"）
  link?: string;            // 商品详情
};

export type LaunchCampaignContent = {
  // 1. 手账 hero
  dateText: string;              // 日期徽章（如 "7月23日 WED"）
  topTag: string;                // 顶部小标签（如 "华南 · 骆芷蝶智选"）
  title: string;                 // 大标题
  subtitle: string;              // 副标题
  heroImages: string[];          // 模特图（3 张）

  // 2. 促销条
  promoStrip: {
    items: string[];             // 3 项促销文案
  };

  // 3. #大牌满减#
  couponSection: {
    title: string;               // 区块标题（如 "#大牌满减"）
    subtitle: string;            // 时间范围说明
    endTime: string;             // 倒计时截止 ISO 时间
    tiers: LaunchCouponTier[];   // 6 档满减
  };

  // 4. LIVE 直播
  liveSection: {
    title: string;               // 区块标题
    subtitle: string;            // 副标题
    streams: LaunchLiveStream[]; // 直播场次（通常 2）
  };

  // 5. 秋款抢先看 · 6 品牌矩阵
  brandSection: {
    title: string;
    brands: LaunchBrand[];       // 6 个品牌
  };

  // 6. 趋势好货 · 3 列网格
  trendSection: {
    title: string;
    brands: LaunchTrendBrand[];  // 6 个品牌
  };

  // 7. 今日新款
  newSection: {
    tabs: string[];              // 分类 Tab
    categories: string[];        // 类目
    products: LaunchNewProduct[];// 商品列表
  };
};

export const DEFAULT_LAUNCH_CAMPAIGN: LaunchCampaignContent = {
  dateText: "7月23日 WED",
  topTag: "华南 · 骆芷蝶智选",
  title: "骆芷蝶·智选｜秋款大上新企划",
  subtitle: "全国市场秋上新",
  heroImages: ["", "", ""],
  promoStrip: {
    items: ["上新100+", "满减省¥320", "现货速发"],
  },
  couponSection: {
    title: "#大牌满减",
    subtitle: "仅限今日 7月22日 20:00 - 7月25日 20:00",
    endTime: "2026-07-25T20:00:00+08:00",
    tiers: [
      { amount: 5, threshold: 199 },
      { amount: 20, threshold: 499 },
      { amount: 50, threshold: 999 },
      { amount: 120, threshold: 1299 },
      { amount: 180, threshold: 2999 },
      { amount: 320, threshold: 6999 },
    ],
  },
  liveSection: {
    title: "LIVE · 秋款首发 版型看得见",
    subtitle: "直播跑现券",
    streams: [
      { brand: "元照", time: "16:00-18:00", avatar: "" },
      { brand: "T.G", time: "19:00-21:00", avatar: "" },
    ],
  },
  brandSection: {
    title: "秋款抢先看 · 好货一杆拿",
    brands: [
      { name: "KAPOK", slogan: "质感纱感TOP", highlight: "韩系针织·开衫", images: ["", "", "", ""] },
      { name: "元照", slogan: "刚需款TOP", highlight: "辣妹·打底衫", images: ["", "", "", ""] },
      { name: "T.G", slogan: "韩系简约风", highlight: "宽松落肩·衬衫", images: ["", "", "", ""] },
      { name: "SMX", slogan: "高端定制面料", highlight: "高阶羊绒·打底", images: ["", "", "", ""] },
      { name: "Have·U", slogan: "大幂狂范档口", highlight: "连帽娃娃·外套", images: ["", "", "", ""] },
      { name: "THE WANG岛屿", slogan: "极简老钱风", highlight: "高领针织·打底", images: ["", "", "", ""] },
    ],
  },
  trendSection: {
    title: "秋款新秋抢先看 · 趋势好货一杆拿",
    brands: [
      { name: "UP ONE(LARSO)", slogan: "韩系通勤穿搭", image: "" },
      { name: "ZONA大左廓形", slogan: "随性七分直筒", image: "" },
      { name: "叁目SANMU", slogan: "绵柔回弹速干", image: "" },
      { name: "Flowless", slogan: "简素高级穿搭成本", image: "" },
      { name: "阿左", slogan: "日系简约穿搭", image: "" },
      { name: "ACME", slogan: "韩系素色机车棒球", image: "" },
    ],
  },
  newSection: {
    tabs: ["现货速发", "看订阅档口", "销量", "批发价", "筛选"],
    categories: ["衬衫", "长袖T", "针织衫", "套装", "牛仔褂", "短外套", "休闲裤"],
    products: [],
  },
};

/**
 * 从 page_blocks.content 解析出 LaunchCampaignContent，缺失字段用默认值补齐
 */
export function parseLaunchCampaign(input: any): LaunchCampaignContent {
  const c = input || {};
  const d = DEFAULT_LAUNCH_CAMPAIGN;
  return {
    dateText: c.dateText || d.dateText,
    topTag: c.topTag || d.topTag,
    title: c.title || d.title,
    subtitle: c.subtitle || d.subtitle,
    heroImages: Array.isArray(c.heroImages) ? c.heroImages : d.heroImages,
    promoStrip: {
      items: c.promoStrip?.items || d.promoStrip.items,
    },
    couponSection: {
      title: c.couponSection?.title || d.couponSection.title,
      subtitle: c.couponSection?.subtitle || d.couponSection.subtitle,
      endTime: c.couponSection?.endTime || d.couponSection.endTime,
      tiers: Array.isArray(c.couponSection?.tiers) ? c.couponSection.tiers : d.couponSection.tiers,
    },
    liveSection: {
      title: c.liveSection?.title || d.liveSection.title,
      subtitle: c.liveSection?.subtitle || d.liveSection.subtitle,
      streams: Array.isArray(c.liveSection?.streams) ? c.liveSection.streams : d.liveSection.streams,
    },
    brandSection: {
      title: c.brandSection?.title || d.brandSection.title,
      brands: Array.isArray(c.brandSection?.brands) ? c.brandSection.brands : d.brandSection.brands,
    },
    trendSection: {
      title: c.trendSection?.title || d.trendSection.title,
      brands: Array.isArray(c.trendSection?.brands) ? c.trendSection.brands : d.trendSection.brands,
    },
    newSection: {
      tabs: c.newSection?.tabs || d.newSection.tabs,
      categories: c.newSection?.categories || d.newSection.categories,
      products: Array.isArray(c.newSection?.products) ? c.newSection.products : d.newSection.products,
    },
  };
}

export type FilterOption = { label: string; value: string } | string;

export type FilterSection = {
  title: string;
  key: string;
  multiple?: boolean;
  type?: "tags" | "price";
  options?: FilterOption[];
};

export type QuickFilter = {
  key: string;
  label: string;
  type?: "toggle" | "popup";
  options?: FilterOption[];
};

export type CategoryFilterConfig = {
  sorts?: { key: string; label: string }[];
  quickFilters?: QuickFilter[];
  subCategories?: string[];
  filterPanel?: {
    sections?: FilterSection[];
  };
};

export type Config = Record<string, CategoryFilterConfig>;

export function sanitize(input: any): Config {
  const out: Config = {};
  if (input && typeof input === "object") {
    for (const cat of Object.keys(input)) {
      const c = input[cat];
      if (!c || typeof c !== "object") continue;
      const cfg: CategoryFilterConfig = {};
      if (Array.isArray(c.sorts)) cfg.sorts = c.sorts.filter((s: any) => s && s.key && s.label);
      if (Array.isArray(c.quickFilters)) cfg.quickFilters = c.quickFilters.filter((q: any) => q && q.key && q.label);
      if (Array.isArray(c.subCategories)) cfg.subCategories = c.subCategories.filter((s: any) => typeof s === "string");
      if (c.filterPanel && typeof c.filterPanel === "object") {
        cfg.filterPanel = {};
        if (Array.isArray(c.filterPanel.sections)) {
          cfg.filterPanel.sections = c.filterPanel.sections
            .filter((s: any) => s && s.title && s.key)
            .map((s: any) => ({
              title: String(s.title),
              key: String(s.key),
              multiple: !!s.multiple,
              type: s.type === "price" ? "price" : "tags",
              options: Array.isArray(s.options) ? s.options : undefined,
            }));
        }
      }
      out[cat] = cfg;
    }
  }
  return Object.keys(out).length > 0 ? out : DEFAULT_CATEGORY_CONFIG;
}

export const DEFAULT_CATEGORY_CONFIG: Config = {
  休闲裤: {
    sorts: [
      { key: "default", label: "综合" },
      { key: "sales", label: "销量" },
      { key: "newest", label: "上新" },
      { key: "price_asc", label: "批发价" },
    ],
    quickFilters: [
      { key: "subscribed_stall", label: "订阅的档口", type: "toggle" },
      { key: "is_special", label: "特价", type: "toggle" },
      { key: "in_stock", label: "现货", type: "toggle" },
      { key: "source_brand", label: "源头厂牌", type: "toggle" },
      { key: "bulk_price", label: "批量采购价", type: "toggle" },
      {
        key: "sizes",
        label: "尺码",
        type: "popup",
        options: ["M", "L", "S", "XL", "XS", "5即XXL", "1即S", "2即M", "3即L", "4即XL", "6即XXXL", "均码"],
      },
      {
        key: "fabrics",
        label: "面料",
        type: "popup",
        options: ["TPU", "丝光棉", "丝绵", "丝麻", "亚克力", "亚麻", "亮丝", "人丝", "人棉", "仿醋酸", "再生纤维", "冰丝棉", "冰麻", "包芯纱", "匹马棉", "卫衣料", "塑料", "天丝", "天丝棉", "天丝棉麻", "天丝麻", "天蚕丝", "太空棉", "尼龙", "弹性复合纤维", "提花布", "木浆纤维", "梭织", "棉弹牛仔", "棉料", "棉纶", "棉麻", "氨纶", "汉麻", "洗水棉", "涤棉", "涤纶", "涤麻", "牛仔", "牛奶棉", "真丝", "空气层", "粗纺", "粘纤", "精梳棉", "粘胶", "纱线", "纤维", "羊毛", "聚氨酯", "聚酯纤维", "聚酰胺", "腈纶", "苎麻", "莫代尔", "莱赛尔", "裸氨", "西装料", "醋酯纤维", "醋酸", "铜氨", "铜氨丝", "锦棉", "锦纶", "长绒棉", "高弹锦纶", "高捻棉", "麻料", "黏胶"],
      },
    ],
    subCategories: ["麻料", "天丝", "直筒", "阔腿", "屁帘", "灯笼裤"],
    filterPanel: {
      sections: [
        { title: "近期上新", key: "recent", options: ["今日上新", "近3日上新", "近7日上新"] },
        { title: "热卖活动", key: "hot_activity", options: ["7日爆款", "档口爆款", "今日特价", "限量补贴"] },
        { title: "服务", key: "service", options: ["24H发货", "慢必赔", "批量采购价", "搭配推荐", "实拍视频", "秒杀", "满减", "红包"] },
        { title: "价格区间", key: "price_range", type: "price" },
        { title: "色系", key: "color_family", multiple: true, options: ["花色系", "其他", "白色系", "黑色系", "灰色系", "红色系", "橙色系", "黄色系", "绿色系", "蓝色系", "紫色系", "棕色系", "金属色系", "拼色"] },
        { title: "季节", key: "season", multiple: true, options: ["春", "夏", "秋", "冬"] },
        { title: "裤长", key: "裤长", options: ["短裤", "五分裤", "七分裤", "八分裤", "九分裤", "长裤", "拖地裤"] },
        { title: "裤型", key: "裤型", options: ["其他", "小脚裤", "屁帘裤", "弯刀裤", "松紧裤", "气球裤", "烟管裤", "直筒裤", "紧身裤", "萝卜裤", "运动裤", "香蕉裤", "阔腿裤", "微喇裤", "哈伦裤", "喇叭裤"] },
        { title: "营销标签", key: "营销标签", multiple: true, options: ["度假风/出游穿搭", "老钱风/静奢", "活力多巴胺", "都市职场风"] },
        { title: "腰型", key: "腰型", options: ["无腰线", "低腰", "中腰", "高腰"] },
        { title: "加绒情况", key: "加绒情况", options: ["不加绒", "薄绒", "厚绒"] },
        { title: "图案", key: "图案", multiple: true, options: ["卡通", "条纹", "纯色", "字母", "动物纹", "波点", "拼色", "格纹", "佩斯利纹", "植物", "扎染", "图案", "线条", "碎花", "爱心", "标语", "星空", "花朵", "民族风图案"] },
        { title: "工艺", key: "工艺", multiple: true, options: ["无", "烫钻", "钉珠/片", "印花", "口袋", "印染", "毛边", "提花", "水洗", "打揽", "撞色线迹", "木耳边", "抽褶", "磨损破洞", "绗缝", "打结", "系带", "蕾丝拼接", "粗针(粗线)", "细针(细线)", "贴花/章", "镂空", "绣花", "压褶", "亮丝", "拼接/补丁", "编织/织带", "花边", "抽绳", "假两件"] },
      ],
    },
  },
  女鞋: {
    sorts: [
      { key: "default", label: "综合" },
      { key: "sales", label: "销量" },
      { key: "newest", label: "上新" },
      { key: "price_asc", label: "批发价" },
    ],
    quickFilters: [
      { key: "subscribed_stall", label: "订阅的档口", type: "toggle" },
      { key: "is_special", label: "特价", type: "toggle" },
      { key: "in_stock", label: "现货", type: "toggle" },
      { key: "source_brand", label: "源头厂牌", type: "toggle" },
      { key: "bulk_price", label: "批量采购价", type: "toggle" },
      { key: "sizes", label: "鞋码", type: "popup", options: ["35", "36", "37", "38", "39", "40", "41", "均码"] },
      { key: "fabrics", label: "材质", type: "popup", options: ["真皮", "PU", "帆布", "网面", "漆皮", "绒面", "牛仔布", "编织", "TPU", "橡胶"] },
    ],
    subCategories: ["单鞋", "凉鞋", "运动鞋", "靴子", "拖鞋", "乐福鞋", "玛丽珍"],
    filterPanel: {
      sections: [
        { title: "近期上新", key: "recent", options: ["今日上新", "近3日上新", "近7日上新"] },
        { title: "热卖活动", key: "hot_activity", options: ["7日爆款", "档口爆款", "今日特价", "限量补贴"] },
        { title: "服务", key: "service", options: ["24H发货", "慢必赔", "批量采购价", "搭配推荐", "实拍视频", "秒杀", "满减", "红包"] },
        { title: "价格区间", key: "price_range", type: "price" },
        { title: "色系", key: "color_family", multiple: true, options: ["花色系", "其他", "白色系", "黑色系", "灰色系", "红色系", "橙色系", "黄色系", "绿色系", "蓝色系", "紫色系", "棕色系", "金属色系", "拼色"] },
        { title: "季节", key: "season", multiple: true, options: ["春", "夏", "秋", "冬"] },
        { title: "鞋型", key: "鞋型", options: ["单鞋", "凉鞋", "运动鞋", "短靴", "长靴", "拖鞋", "乐福鞋", "玛丽珍", "德训鞋", "老爹鞋"] },
        { title: "跟高", key: "跟高", options: ["平跟", "低跟", "中跟", "高跟"] },
        { title: "鞋头", key: "鞋头", options: ["圆头", "尖头", "方头", "鱼嘴", "露趾"] },
      ],
    },
  },
  饰品: {
    sorts: [
      { key: "default", label: "综合" },
      { key: "sales", label: "销量" },
      { key: "newest", label: "上新" },
      { key: "price_asc", label: "批发价" },
    ],
    quickFilters: [
      { key: "subscribed_stall", label: "订阅的档口", type: "toggle" },
      { key: "is_special", label: "特价", type: "toggle" },
      { key: "in_stock", label: "现货", type: "toggle" },
      { key: "source_brand", label: "源头厂牌", type: "toggle" },
      { key: "bulk_price", label: "批量采购价", type: "toggle" },
      { key: "fabrics", label: "材质", type: "popup", options: ["925银", "合金", "铜", "钛钢", "珍珠", "天然石", "水晶", "亚克力", "树脂", "布艺", "皮革", "木质"] },
    ],
    subCategories: ["耳环", "项链", "手链", "戒指", "发饰", "帽子", "围巾", "包包挂件"],
    filterPanel: {
      sections: [
        { title: "近期上新", key: "recent", options: ["今日上新", "近3日上新", "近7日上新"] },
        { title: "热卖活动", key: "hot_activity", options: ["7日爆款", "档口爆款", "今日特价", "限量补贴"] },
        { title: "服务", key: "service", options: ["24H发货", "慢必赔", "批量采购价", "搭配推荐", "实拍视频", "秒杀", "满减", "红包"] },
        { title: "价格区间", key: "price_range", type: "price" },
        { title: "色系", key: "color_family", multiple: true, options: ["花色系", "其他", "白色系", "黑色系", "灰色系", "红色系", "橙色系", "黄色系", "绿色系", "蓝色系", "紫色系", "棕色系", "金属色系", "拼色"] },
        { title: "风格", key: "风格", multiple: true, options: ["韩系", "欧美", "复古", "简约", "甜酷", "法式", "民族风", "Y2K"] },
        { title: "材质", key: "材质", multiple: true, options: ["925银", "合金", "铜", "钛钢", "珍珠", "天然石", "水晶", "亚克力", "树脂", "布艺", "皮革", "木质"] },
      ],
    },
  },
  居家内衣: {
    sorts: [
      { key: "default", label: "综合" },
      { key: "sales", label: "销量" },
      { key: "newest", label: "上新" },
      { key: "price_asc", label: "批发价" },
    ],
    quickFilters: [
      { key: "subscribed_stall", label: "订阅的档口", type: "toggle" },
      { key: "is_special", label: "特价", type: "toggle" },
      { key: "in_stock", label: "现货", type: "toggle" },
      { key: "source_brand", label: "源头厂牌", type: "toggle" },
      { key: "bulk_price", label: "批量采购价", type: "toggle" },
      { key: "sizes", label: "尺码", type: "popup", options: ["S", "M", "L", "XL", "XXL", "70A", "70B", "75A", "75B", "80A", "80B", "85B", "均码"] },
      { key: "fabrics", label: "面料", type: "popup", options: ["棉", "莫代尔", "冰丝", "蕾丝", "真丝", "网纱", "锦纶", "氨纶", "竹纤维"] },
    ],
    subCategories: ["文胸", "内裤", "睡衣", "美背", "塑身", "抹胸", "保暖内衣"],
    filterPanel: {
      sections: [
        { title: "近期上新", key: "recent", options: ["今日上新", "近3日上新", "近7日上新"] },
        { title: "热卖活动", key: "hot_activity", options: ["7日爆款", "档口爆款", "今日特价", "限量补贴"] },
        { title: "服务", key: "service", options: ["24H发货", "慢必赔", "批量采购价", "搭配推荐", "实拍视频", "秒杀", "满减", "红包"] },
        { title: "价格区间", key: "price_range", type: "price" },
        { title: "色系", key: "color_family", multiple: true, options: ["花色系", "其他", "白色系", "黑色系", "灰色系", "红色系", "橙色系", "黄色系", "绿色系", "蓝色系", "紫色系", "棕色系", "金属色系", "拼色"] },
        { title: "季节", key: "season", multiple: true, options: ["春", "夏", "秋", "冬"] },
        { title: "杯型", key: "杯型", options: ["薄杯", "厚杯", "无钢圈", "有钢圈", "三角杯", "全罩杯"] },
        { title: "面料", key: "面料", multiple: true, options: ["棉", "莫代尔", "冰丝", "蕾丝", "真丝", "网纱", "锦纶", "氨纶", "竹纤维"] },
      ],
    },
  },
};

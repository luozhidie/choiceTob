// 商品分类层级（市场 → 风情 → 风格 → 品类 → 明细）
// 分面模型：每一层是一组可选值，商品在每层选一个值，逐层归类。
// 层级值作为 params 的 key(market/vibe/style) 写入商品，复用已有 params->>k 过滤能力，零数据库迁移。
// 配置真源：Storage 桶 app-config/category-tree.json（公共读 / 管理员写），本文件为兜底默认。

export type TreeLevel = {
  key: string;
  label: string;
  // 普通层：直接的值列表
  values?: string[];
  // 风格层：按性别分组（女士/男士）
  genders?: { 女: string[]; 男: string[] };
  // 明细层：按品类给出可选项
  valuesByParent?: Record<string, string[]>;
};

export type CategoryTreeConfig = {
  levels: TreeLevel[];
  // 落地页「热门推荐 / 专题」等精选叶子（可选，前端 landing 用）
  featured?: string[];
};

export const LEVEL_KEYS = ["market", "vibe", "style", "category", "subcategory"] as const;
export type LevelKey = (typeof LEVEL_KEYS)[number];

export function sanitize(input: any): CategoryTreeConfig {
  const out: CategoryTreeConfig = { levels: [] };
  if (!input || typeof input !== "object") return DEFAULT_CATEGORY_TREE;
  if (Array.isArray(input.levels)) {
    out.levels = input.levels
      .filter((l: any) => l && l.key && l.label)
      .map((l: any) => {
        const lv: TreeLevel = { key: String(l.key), label: String(l.label) };
        if (l.genders && typeof l.genders === "object") {
          lv.genders = {
            女: Array.isArray(l.genders.女) ? l.genders.女.map(String).filter(Boolean) : [],
            男: Array.isArray(l.genders.男) ? l.genders.男.map(String).filter(Boolean) : [],
          };
        } else if (Array.isArray(l.values)) {
          lv.values = l.values.map(String).filter(Boolean);
        }
        if (l.valuesByParent && typeof l.valuesByParent === "object") {
          lv.valuesByParent = {};
          for (const k of Object.keys(l.valuesByParent)) {
            if (Array.isArray(l.valuesByParent[k])) {
              lv.valuesByParent[k] = l.valuesByParent[k].map(String).filter(Boolean);
            }
          }
        }
        return lv;
      });
  }
  if (Array.isArray(input.featured)) out.featured = input.featured.map(String).filter(Boolean);
  // 至少保证 5 个层级骨架存在，缺失的用默认补齐
  const have = new Set(out.levels.map((l) => l.key));
  for (const def of DEFAULT_CATEGORY_TREE.levels) {
    if (!have.has(def.key)) out.levels.push(def);
  }
  if (!out.levels.length) return DEFAULT_CATEGORY_TREE;
  return out;
}

/* ── 取数辅助 ── */
export function getLevel(cfg: CategoryTreeConfig, key: string): TreeLevel | undefined {
  return cfg.levels.find((l) => l.key === key);
}
export function getLevelValues(cfg: CategoryTreeConfig, key: string): string[] {
  const lv = getLevel(cfg, key);
  if (!lv) return [];
  if (lv.genders) return [...lv.genders.女, ...lv.genders.男];
  if (lv.values) return lv.values;
  return [];
}
export function getStyleValues(cfg: CategoryTreeConfig, gender: "女" | "男"): string[] {
  const lv = getLevel(cfg, "style");
  if (lv?.genders?.[gender]) return lv.genders[gender];
  return [];
}
export function getSubcategoryValues(cfg: CategoryTreeConfig, category: string): string[] {
  const lv = getLevel(cfg, "subcategory");
  if (lv?.valuesByParent?.[category]) return lv.valuesByParent[category];
  return [];
}

/* ── 默认种子：来自小程序 buyer 现有 MAIN_CATEGORIES + CATEGORY_TREE ── */
export const DEFAULT_CATEGORY_TREE: CategoryTreeConfig = {
  levels: [
    {
      key: "market",
      label: "市场",
      values: ["广州十三行", "广州沙河", "杭州市场", "濮院市场", "深圳南油"],
    },
    {
      key: "vibe",
      label: "风情",
      values: [
        "休闲简约", "清新简约", "通勤简约", "小女人", "基础百搭", "淑女", "法式复古",
        "网红辣妹", "街头潮流", "纯欲", "大牌简约", "美式复古", "高街", "田园浪漫",
        "日系简约", "学院", "中性休闲", "甜酷",
      ],
    },
    {
      key: "style",
      label: "风格",
      genders: {
        女: [
          "少女型", "优雅型", "浪漫型", "少年型", "时尚型", "古典型", "自然型", "戏剧型",
          "少女偏少年", "少女偏时尚", "少女偏古典", "少女偏自然", "少女偏戏剧", "少女偏浪漫", "少女偏优雅",
          "优雅偏少年", "优雅偏时尚", "优雅偏古典", "优雅偏自然", "优雅偏戏剧", "优雅偏浪漫", "优雅偏少女",
          "浪漫偏少年", "浪漫偏时尚", "浪漫偏古典", "浪漫偏自然", "浪漫偏戏剧", "浪漫偏优雅", "浪漫偏少女",
          "少年偏少女", "少年偏优雅", "少年偏浪漫", "少年偏时尚", "少年偏古典", "少年偏自然", "少年偏戏剧",
          "时尚偏少女", "时尚偏优雅", "时尚偏浪漫", "时尚偏少年", "时尚偏古典", "时尚偏自然", "时尚偏戏剧",
          "古典偏少女", "古典偏优雅", "古典偏浪漫", "古典偏少年", "古典偏时尚", "古典偏自然", "古典偏戏剧",
          "自然偏少女", "自然偏优雅", "自然偏浪漫", "自然偏少年", "自然偏时尚", "自然偏古典", "自然偏戏剧",
          "戏剧偏少女", "戏剧偏优雅", "戏剧偏浪漫", "戏剧偏少年", "戏剧偏时尚", "戏剧偏古典", "戏剧偏自然",
        ],
        男: [
          "时尚型", "浪漫型", "古典型", "自然型", "戏剧型",
          "时尚偏浪漫", "时尚偏古典", "时尚偏自然", "时尚偏戏剧",
          "浪漫偏时尚", "浪漫偏古典", "浪漫偏自然", "浪漫偏戏剧",
          "古典偏时尚", "古典偏自然", "古典偏浪漫", "古典偏戏剧",
          "自然偏浪漫", "自然偏时尚", "自然偏古典", "自然偏戏剧",
          "戏剧偏时尚", "戏剧偏古典", "戏剧偏自然", "戏剧偏浪漫",
        ],
      },
    },
    {
      key: "category",
      label: "品类",
      values: [
        "上装", "下装", "裙装", "套装", "女鞋", "饰品", "女包",
        "童装", "男装", "居家内衣", "店铺耗材",
      ],
    },
    {
      key: "subcategory",
      label: "明细",
      valuesByParent: {
        上装: ["小衫", "衬衫", "防晒衫", "短袖T恤", "针织开衫", "长袖T恤", "短外套", "背心", "风衣", "牛仔外套", "针织衫"],
        下装: ["牛仔裤", "休闲裤", "休闲短裤", "牛仔短裤", "西裤", "工装裤", "裙裤", "背带裤", "皮裤", "卫衣裤", "打底裤"],
        裙装: ["半身裙", "连衣裙", "牛仔裙", "背带裙"],
        套装: ["套装"],
        女鞋: ["勃肯鞋", "休闲鞋", "低平跟单鞋", "半拖鞋", "德训鞋", "老爹鞋", "低平跟凉鞋", "中跟单鞋", "休闲凉鞋", "乐福鞋", "中跟凉鞋", "短靴", "高跟凉鞋", "小白鞋"],
        饰品: ["袜子", "披肩", "帽子", "丝巾", "围巾", "头饰", "短项链", "手链", "长项链", "耳钉", "戒指", "耳环", "腰带/腰封", "手机配饰", "手表"],
        女包: ["单肩包", "手提包", "斜挎包", "帆布包", "双肩包"],
        童装: ["上装", "下装", "套装", "休闲裤", "牛仔裤", "连衣裙", "长袖T恤", "短外套", "休闲短裤", "卫衣", "衬衫", "睡衣套装", "童鞋", "童配饰"],
        男装: ["男鞋", "短袖T恤", "休闲裤", "休闲短裤", "牛仔裤", "衬衫", "POLO衫", "短外套", "内裤", "夹克", "睡衣套装", "背心", "卫衣"],
        居家内衣: ["美背内衣", "内裤", "文胸", "睡衣套装", "内衣套装", "睡裙", "抹胸", "睡衣", "塑型内衣"],
        店铺耗材: ["购物袋", "店铺搭售", "陈列道具"],
      },
    },
  ],
  featured: [
    "休闲裤", "牛仔裤", "套装", "小衫", "连衣裙", "半身裙", "背心/吊带",
    "短袖T恤", "针织衫", "衬衫", "童装", "男装",
    "大码女装", "新中式", "小香风", "小个子", "梨形",
  ],
};

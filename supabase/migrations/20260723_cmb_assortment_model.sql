-- ============================================================
-- 20260723 CMB 十二色彩季型 × 买手组货 融合模型
-- 设计核心：
--   A 层 买手市场层（大方向）：assortment_plans 已有 season/品类架构/价格带/波段，
--       本迁移补「市场判断叙述」+「目标色彩季型/风格」，把买手的买货方向用 CMB 维度框住。
--   B 层 CMB 个人层（精细化到人）：12 色彩季型 + 个人风格标签，作为商品与组货包的维度字段。
--   融合：用户风格测试 → 季型+风格 → 组货方案按 target 匹配、商品按 CMB 标签筛 → 测→诊断→组货→转化。
-- 幂等：可重复执行（IF NOT EXISTS / ADD COLUMN IF NOT EXISTS）。
-- 请在 Supabase SQL Editor 执行（接在既有迁移之后）。
-- ============================================================

-- ============================================================
-- 1) 12 色彩季型（CMB Color Seasons）参考表
-- ============================================================
CREATE TABLE IF NOT EXISTS color_seasons (
  code TEXT PRIMARY KEY,                      -- spring-light / winter-deep ...
  name_zh TEXT NOT NULL,
  name_en TEXT,
  season_family TEXT NOT NULL,               -- 春 / 夏 / 秋 / 冬
  undertone TEXT NOT NULL,                   -- 冷 / 暖 / 中性
  chroma TEXT NOT NULL,                      -- 净(高彩度) / 柔(低彩度) / 浅(高明度) / 深(低明度)
  palette JSONB NOT NULL DEFAULT '[]',       -- 适合的代表色 hex 数组
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

COMMENT ON TABLE color_seasons IS 'CMB 十二色彩季型：把买手的宏观组货精细化到个人肤色/色调';

INSERT INTO color_seasons (code, name_zh, name_en, season_family, undertone, chroma, palette, description, sort_order) VALUES
  ('spring-light','浅春型','Light Spring','春','暖','浅','["#F7D9C4","#F4C89B","#A8D5BA","#FCE38A"]','明亮轻柔的暖调，适合浅淡清新的颜色',1),
  ('spring-warm','暖春型','Warm Spring','春','暖','净','["#E9A23B","#E85D75","#7CB342","#FFB997"]','鲜明温暖的暖调，适合金黄珊瑚等饱和暖色',2),
  ('spring-clear','净春型','Clear Spring','春','暖','净','["#00A6A6","#FF6F61","#FFD23F","#2EC4B6"]','清澈明亮的暖调，适合高对比的干净色',3),
  ('summer-light','浅夏型','Light Summer','夏','冷','浅','["#C9D6DF","#E8C5D0","#B8C0D8","#F2E9E4"]','柔和的冷调浅色，适合雾霾蓝粉',4),
  ('summer-cool','冷夏型','Cool Summer','夏','冷','柔','["#8E9FC0","#B0839B","#7C93B3","#C2B2C4"]','冷调中低彩度，适合蓝灰玫紫',5),
  ('summer-soft','柔夏型','Soft Summer','夏','冷','柔','["#A7B5B8","#C9B7B0","#9DAAB0","#D7C7C0"]','低对比的雾感冷调，适合灰调莫兰迪',6),
  ('autumn-soft','柔秋型','Soft Autumn','秋','暖','柔','["#C2A878","#A8846C","#9CAE84","#D9C2A6"]','低彩度暖调，适合驼色燕麦大地色',7),
  ('autumn-warm','暖秋型','Warm Autumn','秋','暖','深','["#B5651D","#C97B3F","#8A6D3B","#A0522D"]','浓郁温暖，适合金黄焦糖赭石',8),
  ('autumn-deep','深秋型','Deep Autumn','秋','暖','深','["#7B3F00","#8B5A2B","#5C4033","#A0522D"]','深浓暖调，适合巧克力深棕',9),
  ('winter-clear','净冬型','Clear Winter','冬','冷','净','["#1B1B3A","#E63946","#00B4D8","#FFFFFF"]','高对比冷调，适合纯黑白正红',10),
  ('winter-cool','冷冬型','Cool Winter','冬','冷','净','["#2D3142","#5C6BC0","#B5179E","#48BFE3"]','冷艳高彩度，适合冰蓝玫红',11),
  ('winter-deep','深冬型','Deep Winter','冬','冷','深','["#0B132B","#3A0CA3","#7209B7","#1C1C1C"]','深邃冷调，适合宝石深紫黑',12)
ON CONFLICT (code) DO UPDATE SET
  name_zh = EXCLUDED.name_zh,
  name_en = EXCLUDED.name_en,
  season_family = EXCLUDED.season_family,
  undertone = EXCLUDED.undertone,
  chroma = EXCLUDED.chroma,
  palette = EXCLUDED.palette,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 2) 个人穿衣风格标签（Style Tags）
-- ============================================================
CREATE TABLE IF NOT EXISTS style_tags (
  code TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0
);

COMMENT ON TABLE style_tags IS '个人穿衣风格维度：与色彩季型配合，把组货/商品精细化到人';

INSERT INTO style_tags (code, name_zh, description, sort_order) VALUES
  ('minimal','简约极简','干净利落、少装饰、强调质感与廓形',1),
  ('french','法式优雅','慵懒精致、微复古、注重氛围感',2),
  ('office','通勤职场','得体专业、结构感强、易搭配',3),
  ('retro','复古','年代感元素、印花质感、怀旧调性',4),
  ('street','街头潮酷','宽松廓形、运动元素、强标识感',5),
  ('sporty','运动休闲','舒适功能、混搭运动风',6),
  ('romantic','浪漫女人味','柔美曲线、荷叶边、甜暖调',7),
  ('natural','自然森系','天然材质、松弛廓形、低饱和',8),
  ('dramatic','戏剧个性','强对比、夸张廓形、舞台感',9),
  ('guofeng','国风新中式','中式元素、改良廓形、文化感',10)
ON CONFLICT (code) DO UPDATE SET
  name_zh = EXCLUDED.name_zh,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ============================================================
-- 3) 商品打 CMB 标签（B 层落到 SKU）
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_season_codes TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS style_tag_codes TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN products.color_season_codes IS '适合的色彩季型（多选，对应 color_seasons.code）';
COMMENT ON COLUMN products.style_tag_codes IS '适合的个人风格（多选，对应 style_tags.code）';

CREATE INDEX IF NOT EXISTS idx_products_color_seasons ON products USING GIN (color_season_codes);
CREATE INDEX IF NOT EXISTS idx_products_style_tags ON products USING GIN (style_tag_codes);

-- ============================================================
-- 4) 组货方案叠加「买手市场判断」+「CMB 目标维度」（A 层框到个人）
-- ============================================================
ALTER TABLE assortment_plans ADD COLUMN IF NOT EXISTS market_direction JSONB;
-- 结构示例：{ trend_theme, price_architecture_note, supply_note, target_customer }
COMMENT ON COLUMN assortment_plans.market_direction IS '买手市场判断叙述（大方向）：趋势主题/价格架构逻辑/供应链/目标客群';

ALTER TABLE assortment_plans ADD COLUMN IF NOT EXISTS target_color_seasons TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE assortment_plans ADD COLUMN IF NOT EXISTS target_style_tags TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN assortment_plans.target_color_seasons IS '该组货方案服务的目标色彩季型（精细化到人）';
COMMENT ON COLUMN assortment_plans.target_style_tags IS '该组货方案服务的目标个人风格';

CREATE INDEX IF NOT EXISTS idx_assortment_target_seasons ON assortment_plans USING GIN (target_color_seasons);
CREATE INDEX IF NOT EXISTS idx_assortment_target_styles ON assortment_plans USING GIN (target_style_tags);

-- ============================================================
-- 5) 融合推荐函数：买手大方向(组货) × 个人 CMB 维度
--    给定用户的色彩季型 + 风格，返回匹配度最高的商品（精细化到人）
--    色彩季型匹配权重 2，风格匹配权重 1
-- ============================================================
CREATE OR REPLACE FUNCTION recommend_products_by_cmb(p_seasons TEXT[], p_styles TEXT[])
RETURNS TABLE (
  id UUID,
  name TEXT,
  title TEXT,
  image_url TEXT,
  match_score INT
) AS $$
  SELECT
    p.id,
    p.name,
    p.title,
    p.image_url,
    (
      (CASE WHEN p.color_season_codes && p_seasons THEN 2 ELSE 0 END)
      + (CASE WHEN p.style_tag_codes && p_styles THEN 1 ELSE 0 END)
    ) AS match_score
  FROM products p
  WHERE p.is_published = true
    AND (
      p.color_season_codes && p_seasons
      OR p.style_tag_codes && p_styles
    )
  ORDER BY match_score DESC, p.created_at DESC
  LIMIT 60;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION recommend_products_by_cmb(TEXT[], TEXT[]) IS 'CMB 融合推荐：买手组货方向 × 个人色彩季型/风格，输出匹配商品';

-- ============================================================
-- 6) 行级安全：色彩季型/风格标签公开读（供前台风格测试与推荐使用）
-- ============================================================
ALTER TABLE color_seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读色彩季型" ON color_seasons;
CREATE POLICY "公开读色彩季型" ON color_seasons FOR SELECT USING (true);

ALTER TABLE style_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读风格标签" ON style_tags;
CREATE POLICY "公开读风格标签" ON style_tags FOR SELECT USING (true);

-- ============================================================
-- 20260723 色彩季型 × 买手组货 融合模型
-- 设计核心：
--   A 层 买手市场层（大方向）：assortment_plans 已有 season/品类架构/价格带/波段，
--       本迁移补「市场判断叙述」+「目标色彩季型/风格」，把买手的买货方向用色彩季型维度框住。
--   B 层 个人层（精细化到人）：12 色彩季型 + 个人风格标签，作为商品与组货包的维度字段。
--   融合：用户风格测试 → 季型+风格 → 组货方案按 target 匹配、商品按标签筛 → 测→诊断→组货→转化。
-- 色彩季型采用本系统叫法（浅暖型/浅冷型/深暖型/深冷型/净暖型/净冷型/柔暖型/柔冷型/暖亮型/暖柔型/冷亮型/冷柔型）。
-- 幂等：可重复执行（DROP+CREATE / ADD COLUMN IF NOT EXISTS）。
-- 请在 Supabase SQL Editor 执行（接在既有迁移之后）。
-- ============================================================

-- ============================================================
-- 1) 12 色彩季型（本系统叫法）
--    meta 字段灵活存放该季型的三个属性（如 浅/亮/暖），不硬拆列
-- ============================================================
DROP TABLE IF EXISTS color_seasons;
CREATE TABLE color_seasons (
  code TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  meta JSONB,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO color_seasons (code, name_zh, meta, sort_order) VALUES
('light-warm','浅暖型','{"attributes":["浅","亮","暖"]}',1),
('light-cool','浅冷型','{"attributes":["浅","柔","冷"]}',2),
('deep-warm','深暖型','{"attributes":["深","柔","暖"]}',3),
('deep-cool','深冷型','{"attributes":["深","冷","净"]}',4),
('clear-warm','净暖型','{"attributes":["亮","浅","暖"]}',5),
('clear-cool','净冷型','{"attributes":["亮","深","冷"]}',6),
('soft-warm','柔暖型','{"attributes":["柔","深","暖"]}',7),
('soft-cool','柔冷型','{"attributes":["柔","浅","冷"]}',8),
('warm-bright','暖亮型','{"attributes":["暖","浅","亮"]}',9),
('warm-soft','暖柔型','{"attributes":["暖","柔","深"]}',10),
('cool-bright','冷亮型','{"attributes":["冷","深","亮"]}',11),
('cool-soft','冷柔型','{"attributes":["冷","浅","柔"]}',12);

-- ============================================================
-- 2) 个人穿衣风格标签
--    gender: women / men / unisex
--    TODO: 请用本系统的「女士八大风格」+「男士五大风格」替换下方 INSERT
-- ============================================================
DROP TABLE IF EXISTS style_tags;
CREATE TABLE style_tags (
  code TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  gender TEXT,
  sort_order INTEGER DEFAULT 0
);

-- 临时占位：女士 8 大 + 男士 5 大风格名字确认后，替换为准确名称
INSERT INTO style_tags (code, name_zh, gender, sort_order) VALUES
('women-1','女士风格1-待替换','women',1),
('women-2','女士风格2-待替换','women',2),
('women-3','女士风格3-待替换','women',3),
('women-4','女士风格4-待替换','women',4),
('women-5','女士风格5-待替换','women',5),
('women-6','女士风格6-待替换','women',6),
('women-7','女士风格7-待替换','women',7),
('women-8','女士风格8-待替换','women',8),
('men-1','男士风格1-待替换','men',9),
('men-2','男士风格2-待替换','men',10),
('men-3','男士风格3-待替换','men',11),
('men-4','男士风格4-待替换','men',12),
('men-5','男士风格5-待替换','men',13);

-- ============================================================
-- 3) 商品打色彩季型/风格标签（B 层落到 SKU）
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_season_codes TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS style_tag_codes TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_products_color_seasons ON products USING GIN (color_season_codes);
CREATE INDEX IF NOT EXISTS idx_products_style_tags ON products USING GIN (style_tag_codes);

-- ============================================================
-- 4) 组货方案叠加「买手市场判断」+「目标色彩季型/风格」（A 层框到个人）
-- ============================================================
ALTER TABLE assortment_plans ADD COLUMN IF NOT EXISTS market_direction JSONB;
-- 结构示例：{ trend_theme, price_architecture_note, supply_note, target_customer }

ALTER TABLE assortment_plans ADD COLUMN IF NOT EXISTS target_color_seasons TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE assortment_plans ADD COLUMN IF NOT EXISTS target_style_tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_assortment_target_seasons ON assortment_plans USING GIN (target_color_seasons);
CREATE INDEX IF NOT EXISTS idx_assortment_target_styles ON assortment_plans USING GIN (target_style_tags);

-- ============================================================
-- 5) 融合推荐函数：买手大方向(组货) × 个人色彩季型/风格
--    色彩季型匹配权重 2，风格匹配权重 1
-- ============================================================
CREATE OR REPLACE FUNCTION recommend_products_by_season(p_seasons TEXT[], p_styles TEXT[])
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

-- ============================================================
-- 6) 行级安全：色彩季型/风格标签公开读（供前台风格测试与推荐使用）
-- ============================================================
ALTER TABLE color_seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pub_color_seasons" ON color_seasons;
CREATE POLICY "pub_color_seasons" ON color_seasons FOR SELECT USING (true);

ALTER TABLE style_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pub_style_tags" ON style_tags;
CREATE POLICY "pub_style_tags" ON style_tags FOR SELECT USING (true);

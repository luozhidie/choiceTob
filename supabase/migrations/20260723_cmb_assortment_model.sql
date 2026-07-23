-- ============================================================
-- 20260723 色彩季型 × 买手组货 融合模型
-- 设计核心：
--   A 层 买手市场层（大方向）：assortment_plans 已有 season/品类架构/价格带/波段，
--       本迁移补「市场判断叙述」+「目标色彩季型/风格」，把买手的买货方向用色彩季型维度框住。
--   B 层 个人层（精细化到人）：本系统 12 色彩季型 + 个人风格标签，作为商品与组货包的维度字段。
--   融合：用户风格测试 → 季型+风格 → 组货方案按 target 匹配、商品按标签筛 → 测→诊断→组货→转化。
-- 色彩季型采用本系统叫法（浅暖/浅冷/深暖/深冷/净暖/净冷/静暖/静冷/暖亮/暖油/油暖/油冷），不含其他体系术语。
-- 幂等：可重复执行（DROP+CARATE / ADD COLUMN IF NOT EXISTS）。
-- 请在 Supabase SQL Editor 执行（接在既有迁移之后）。
-- ============================================================

-- ============================================================
-- 1) 12 色彩季型（本系统叫法）
-- ============================================================
DROP TABLE IF EXISTS color_seasons;
CREATE TABLE color_seasons (
  code TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  undertone TEXT,          -- 暖 / 冷
  depth TEXT,              -- 浅 / 深 / 净 / 静 / 亮 / 油
  sort_order INTEGER DEFAULT 0
);

INSERT INTO color_seasons (code, name_zh, undertone, depth, sort_order) VALUES
('light-warm','浅暖型','暖','浅',1),
('light-cool','浅冷型','冷','浅',2),
('deep-warm','深暖型','暖','深',3),
('deep-cool','深冷型','冷','深',4),
('clear-warm','净暖型','暖','净',5),
('clear-cool','净冷型','冷','净',6),
('soft-warm','静暖型','暖','静',7),
('soft-cool','静冷型','冷','静',8),
('warm-bright','暖亮型','暖','亮',9),
('warm-oil','暖油型','暖','油',10),
('oil-warm','油暖型','暖','油',11),
('oil-cool','油冷型','冷','油',12);

-- ============================================================
-- 2) 个人穿衣风格标签
-- ============================================================
DROP TABLE IF EXISTS style_tags;
CREATE TABLE style_tags (
  code TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO style_tags (code, name_zh, sort_order) VALUES
('minimal','简约极简',1),
('french','法式优雅',2),
('office','通勤职场',3),
('retro','复古',4),
('street','街头潮酷',5),
('sporty','运动休闲',6),
('romantic','浪漫女人味',7),
('natural','自然森系',8),
('dramatic','戏剧个性',9),
('guofeng','国风新中式',10);

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
--    给定用户的色彩季型 + 风格，返回匹配度最高的商品（精细化到人）
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

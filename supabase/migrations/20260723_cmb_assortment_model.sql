-- ============================================================
-- 20260723 色彩季型 × 买手组货 融合模型
-- 设计核心：
--   A 层 买手市场层（大方向）：assortment_plans 已有 season/品类架构/价格带/波段，
--       本迁移补「市场判断叙述」+「目标色彩季型/风格」，把买手的买货方向用色彩季型维度框住。
--   B 层 个人层（精细化到人）：
--       - 12 色彩季型（本系统叫法：浅暖型/浅冷型/深暖型/深冷型/净暖型/净冷型/柔暖型/柔冷型/暖亮型/暖柔型/冷亮型/冷柔型）
--       - 个人风格：女士 8 主 + 56 偏；男士 5 主 + 20 偏（主风格→偏风格 层级，分性别，按版型+曲直）
--   融合：用户风格测试 → 季型 + 主风格(+偏风格) → 组货方案按 target 匹配、商品按标签筛 → 测→诊断→组货→转化。
-- 幂等：可重复执行（DROP+CREATE / ADD COLUMN IF NOT EXISTS）。请在 Supabase SQL Editor 执行。
-- ============================================================

-- ============================================================
-- 1) 12 色彩季型（本系统叫法，meta 存三个属性，不硬套列）
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
-- 2) 个人穿衣风格标签（女士 8 主 + 56 偏；男士 5 主 + 20 偏）
--    gender: women / men
--    type: 曲线型 / 直线型（女士）
--    frame: 小版型 / 中版型 / 大版型
--    is_main: true=主风格 false=偏风格
--    parent_code: 偏风格指向的主风格 code
--    direction: 曲偏直/曲偏曲/直偏曲/直偏直（女士偏风格；男士偏风格为 null）
-- ============================================================
DROP TABLE IF EXISTS style_tags;
CREATE TABLE style_tags (
  code TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  gender TEXT NOT NULL,
  type TEXT,
  frame TEXT,
  is_main BOOLEAN DEFAULT true,
  parent_code TEXT,
  direction TEXT,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO style_tags (code, name_zh, gender, type, frame, is_main, parent_code, direction, sort_order) VALUES
-- 女士 主风格
('girl','少女型','women','曲线型','小版型',true,null,null,1),
('elegant','优雅型','women','曲线型','小版型',true,null,null,2),
('romantic','浪漫型','women','曲线型','大版型',true,null,null,3),
('boyish','少年型','women','直线型','小版型',true,null,null,4),
('fashion','时尚型','women','直线型','小版型',true,null,null,5),
('classic','古典型','women','直线型','大版型',true,null,null,6),
('natural','自然型','women','直线型','大版型',true,null,null,7),
('dramatic','戏剧型','women','直线型','大版型',true,null,null,8),
-- 少女型 偏风格
('girl_qz_boyish','少女偏少年','women','曲线型','小版型',false,'girl','曲偏直',9),
('girl_qz_fashion','少女偏时尚','women','曲线型','小版型',false,'girl','曲偏直',10),
('girl_qz_classic','少女偏古典','women','曲线型','小版型',false,'girl','曲偏直',11),
('girl_qz_natural','少女偏自然','women','曲线型','小版型',false,'girl','曲偏直',12),
('girl_qz_dramatic','少女偏戏剧','women','曲线型','小版型',false,'girl','曲偏直',13),
('girl_qq_elegant','少女偏优雅','women','曲线型','小版型',false,'girl','曲偏曲',14),
('girl_qq_romantic','少女偏浪漫','women','曲线型','小版型',false,'girl','曲偏曲',15),
-- 优雅型 偏风格
('elegant_qz_boyish','优雅偏少年','women','曲线型','小版型',false,'elegant','曲偏直',16),
('elegant_qz_fashion','优雅偏时尚','women','曲线型','小版型',false,'elegant','曲偏直',17),
('elegant_qz_classic','优雅偏古典','women','曲线型','小版型',false,'elegant','曲偏直',18),
('elegant_qz_natural','优雅偏自然','women','曲线型','小版型',false,'elegant','曲偏直',19),
('elegant_qz_dramatic','优雅偏戏剧','women','曲线型','小版型',false,'elegant','曲偏直',20),
('elegant_qq_girl','优雅偏少女','women','曲线型','小版型',false,'elegant','曲偏曲',21),
('elegant_qq_romantic','优雅偏浪漫','women','曲线型','小版型',false,'elegant','曲偏曲',22),
-- 浪漫型 偏风格
('romantic_qz_boyish','浪漫偏少年','women','曲线型','大版型',false,'romantic','曲偏直',23),
('romantic_qz_fashion','浪漫偏时尚','women','曲线型','大版型',false,'romantic','曲偏直',24),
('romantic_qz_classic','浪漫偏古典','women','曲线型','大版型',false,'romantic','曲偏直',25),
('romantic_qz_natural','浪漫偏自然','women','曲线型','大版型',false,'romantic','曲偏直',26),
('romantic_qz_dramatic','浪漫偏戏剧','women','曲线型','大版型',false,'romantic','曲偏直',27),
('romantic_qq_girl','浪漫偏少女','women','曲线型','大版型',false,'romantic','曲偏曲',28),
('romantic_qq_elegant','浪漫偏优雅','women','曲线型','大版型',false,'romantic','曲偏曲',29),
-- 少年型 偏风格
('boyish_zq_girl','少年偏少女','women','直线型','小版型',false,'boyish','直偏曲',30),
('boyish_zq_elegant','少年偏优雅','women','直线型','小版型',false,'boyish','直偏曲',31),
('boyish_zq_romantic','少年偏浪漫','women','直线型','小版型',false,'boyish','直偏曲',32),
('boyish_zz_fashion','少年偏时尚','women','直线型','小版型',false,'boyish','直偏直',33),
('boyish_zz_classic','少年偏古典','women','直线型','小版型',false,'boyish','直偏直',34),
('boyish_zz_natural','少年偏自然','women','直线型','小版型',false,'boyish','直偏直',35),
('boyish_zz_dramatic','少年偏戏剧','women','直线型','小版型',false,'boyish','直偏直',36),
-- 时尚型 偏风格
('fashion_zq_girl','时尚偏少女','women','直线型','小版型',false,'fashion','直偏曲',37),
('fashion_zq_elegant','时尚偏优雅','women','直线型','小版型',false,'fashion','直偏曲',38),
('fashion_zq_romantic','时尚偏浪漫','women','直线型','小版型',false,'fashion','直偏曲',39),
('fashion_zz_boyish','时尚偏少年','women','直线型','小版型',false,'fashion','直偏直',40),
('fashion_zz_classic','时尚偏古典','women','直线型','小版型',false,'fashion','直偏直',41),
('fashion_zz_natural','时尚偏自然','women','直线型','小版型',false,'fashion','直偏直',42),
('fashion_zz_dramatic','时尚偏戏剧','women','直线型','小版型',false,'fashion','直偏直',43),
-- 古典型 偏风格
('classic_zq_girl','古典偏少女','women','直线型','大版型',false,'classic','直偏曲',44),
('classic_zq_elegant','古典偏优雅','women','直线型','大版型',false,'classic','直偏曲',45),
('classic_zq_romantic','古典偏浪漫','women','直线型','大版型',false,'classic','直偏曲',46),
('classic_zz_boyish','古典偏少年','women','直线型','大版型',false,'classic','直偏直',47),
('classic_zz_fashion','古典偏时尚','women','直线型','大版型',false,'classic','直偏直',48),
('classic_zz_natural','古典偏自然','women','直线型','大版型',false,'classic','直偏直',49),
('classic_zz_dramatic','古典偏戏剧','women','直线型','大版型',false,'classic','直偏直',50),
-- 自然型 偏风格
('natural_zq_girl','自然偏少女','women','直线型','大版型',false,'natural','直偏曲',51),
('natural_zq_elegant','自然偏优雅','women','直线型','大版型',false,'natural','直偏曲',52),
('natural_zq_romantic','自然偏浪漫','women','直线型','大版型',false,'natural','直偏曲',53),
('natural_zz_boyish','自然偏少年','women','直线型','大版型',false,'natural','直偏直',54),
('natural_zz_fashion','自然偏时尚','women','直线型','大版型',false,'natural','直偏直',55),
('natural_zz_classic','自然偏古典','women','直线型','大版型',false,'natural','直偏直',56),
('natural_zz_dramatic','自然偏戏剧','women','直线型','大版型',false,'natural','直偏直',57),
-- 戏剧型 偏风格
('dramatic_zq_girl','戏剧偏少女','women','直线型','大版型',false,'dramatic','直偏曲',58),
('dramatic_zq_elegant','戏剧偏优雅','women','直线型','大版型',false,'dramatic','直偏曲',59),
('dramatic_zq_romantic','戏剧偏浪漫','women','直线型','大版型',false,'dramatic','直偏曲',60),
('dramatic_zz_boyish','戏剧偏少年','women','直线型','大版型',false,'dramatic','直偏直',61),
('dramatic_zz_fashion','戏剧偏时尚','women','直线型','大版型',false,'dramatic','直偏直',62),
('dramatic_zz_classic','戏剧偏古典','women','直线型','大版型',false,'dramatic','直偏直',63),
('dramatic_zz_natural','戏剧偏自然','women','直线型','大版型',false,'dramatic','直偏直',64),
-- 男士 主风格
('dramatic_m','戏剧型','men',null,'大版型',true,null,null,65),
('natural_m','自然型','men',null,'大版型',true,null,null,66),
('classic_m','古典型','men',null,'中版型',true,null,null,67),
('romantic_m','浪漫型','men',null,'中版型',true,null,null,68),
('fashion_m','时尚型','men',null,'小版型',true,null,null,69),
-- 男士 偏风格
('dramatic_m_natural','戏剧偏自然','men',null,'大版型',false,'dramatic_m',null,70),
('dramatic_m_classic','戏剧偏古典','men',null,'大版型',false,'dramatic_m',null,71),
('dramatic_m_romantic','戏剧偏浪漫','men',null,'大版型',false,'dramatic_m',null,72),
('dramatic_m_fashion','戏剧偏时尚','men',null,'大版型',false,'dramatic_m',null,73),
('natural_m_dramatic','自然偏戏剧','men',null,'大版型',false,'natural_m',null,74),
('natural_m_classic','自然偏古典','men',null,'大版型',false,'natural_m',null,75),
('natural_m_romantic','自然偏浪漫','men',null,'大版型',false,'natural_m',null,76),
('natural_m_fashion','自然偏时尚','men',null,'大版型',false,'natural_m',null,77),
('classic_m_dramatic','古典偏戏剧','men',null,'中版型',false,'classic_m',null,78),
('classic_m_natural','古典偏自然','men',null,'中版型',false,'classic_m',null,79),
('classic_m_romantic','古典偏浪漫','men',null,'中版型',false,'classic_m',null,80),
('classic_m_fashion','古典偏时尚','men',null,'中版型',false,'classic_m',null,81),
('romantic_m_dramatic','浪漫偏戏剧','men',null,'中版型',false,'romantic_m',null,82),
('romantic_m_natural','浪漫偏自然','men',null,'中版型',false,'romantic_m',null,83),
('romantic_m_classic','浪漫偏古典','men',null,'中版型',false,'romantic_m',null,84),
('romantic_m_fashion','浪漫偏时尚','men',null,'中版型',false,'romantic_m',null,85),
('fashion_m_dramatic','时尚偏戏剧','men',null,'小版型',false,'fashion_m',null,86),
('fashion_m_natural','时尚偏自然','men',null,'小版型',false,'fashion_m',null,87),
('fashion_m_classic','时尚偏古典','men',null,'小版型',false,'fashion_m',null,88),
('fashion_m_romantic','时尚偏浪漫','men',null,'小版型',false,'fashion_m',null,89);

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
--    调用时 p_styles 可同时传入「主风格 code + 偏风格 code」，偏风格自动继承主风格匹配
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
    p.title,
    p.title,
    p.cover_image,
    (
      (CASE WHEN EXISTS (SELECT 1 FROM unnest(p.color_season_codes) AS x WHERE x = ANY(p_seasons)) THEN 2 ELSE 0 END)
      + (CASE WHEN EXISTS (SELECT 1 FROM unnest(p.style_tag_codes) AS y WHERE y = ANY(p_styles)) THEN 1 ELSE 0 END)
    ) AS match_score
  FROM products p
  WHERE p.is_published = true
    AND (
      EXISTS (SELECT 1 FROM unnest(p.color_season_codes) AS x WHERE x = ANY(p_seasons))
      OR EXISTS (SELECT 1 FROM unnest(p.style_tag_codes) AS y WHERE y = ANY(p_styles))
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

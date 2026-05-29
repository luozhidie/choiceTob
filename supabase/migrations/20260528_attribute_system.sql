-- ============================================================
-- 色彩智选 · 商品属性编码体系 & 自动搭配系统
-- 创建时间: 2026-05-28
-- ============================================================

-- ----------------------------------------------------------------
-- 1. 面料编码表 (attribute_fabrics)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attribute_fabrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,               -- F01, F02, ...
  style_type text NOT NULL,                -- 少女型/优雅型/浪漫型/少年型/时尚型/古典型/自然型/戏剧型
  suitable_fabrics text[],                 -- 适合的面料数组
  avoid_fabrics text[],                   -- 回避的面料数组
  description text,                        -- 补充说明
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE attribute_fabrics IS '面料编码表：每种风格类型适合/回避的面料清单';
COMMENT ON COLUMN attribute_fabrics.code IS '面料编码，如F01=少女型';
COMMENT ON COLUMN attribute_fabrics.style_type IS '风格类型：少女型/优雅型/浪漫型/少年型/时尚型/古典型/自然型/戏剧型';

-- ----------------------------------------------------------------
-- 2. 剪裁编码表 (attribute_cuts)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attribute_cuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,               -- B01, B02, ... (日常)  C01, C02,... (职业装)
  category text NOT NULL,                  -- 日常剪裁 / 职业装剪裁 / 休闲剪裁 / 晚装剪裁
  style_type text NOT NULL,                -- 少女型/优雅型/浪漫型/少年型/时尚型/古典型/自然型/戏剧型
  suitable_cuts text[],                   -- 适合的剪裁特点数组
  avoid_cuts text[],                     -- 回避的剪裁特点数组
  description text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE attribute_cuts IS '剪裁编码表：每种风格类型适合/回避的剪裁特点';
COMMENT ON COLUMN attribute_cuts.code IS '剪裁编码，如B01=少女型日常剪裁，C01=少女型职业装剪裁';

-- ----------------------------------------------------------------
-- 3. 图案编码表 (attribute_patterns)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attribute_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,               -- P01, P02, ...
  style_type text NOT NULL,                -- 少女型/优雅型/浪漫型/少年型/时尚型/古典型/自然型/戏剧型
  suitable_patterns text[],               -- 适合的图案数组
  avoid_patterns text[],                 -- 回避的图案数组
  description text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE attribute_patterns IS '图案编码表：每种风格类型适合/回避的图案';
COMMENT ON COLUMN attribute_patterns.code IS '图案编码，如P01=少女型图案';

-- ----------------------------------------------------------------
-- 4. 色彩季型表 (attribute_color_seasons)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attribute_color_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,               -- S01, S02, ...
  season_name_cn text NOT NULL,            -- 浅暖 / 浅冷 / 深暖 / 深冷 / 暖亮 / 暖柔 / 冷亮 / 冷柔 / 净冷 / 净暖 / 柔冷 / 柔暖
  season_name_en text,                     -- Light Warm / Light Cool / ...
  brightness text CHECK (brightness IN ('高','中','低')),  -- 明度高低
  saturation text CHECK (saturation IN ('高','中','低')),   -- 艳度深浅
  temperature text CHECK (temperature IN ('暖','冷','中性')), -- 冷暖调子
  classic_hex_colors text[],              -- 经典色标HEX数组
  description text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE attribute_color_seasons IS '色彩季型表：十二季型色彩体系，含明度/艳度/冷暖/经典色标';
COMMENT ON COLUMN attribute_color_seasons.code IS '色彩季型编码，如S01=浅暖';
COMMENT ON COLUMN attribute_color_seasons.classic_hex_colors IS '该季型的经典色标HEX值数组，用于颜色匹配';

-- ----------------------------------------------------------------
-- 5. 搭配原则规则表 (attribute_match_rules)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attribute_match_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,               -- R01, R02, ...
  rule_name_cn text NOT NULL,             -- 色调配色 / 近似配色 / 渐进配色 ...
  rule_name_en text,
  description text,                       -- 规则说明
  applicable_seasons text[],              -- 适用的色彩季型编码数组，如{S01,S02}
  applicable_styles text[],               -- 适用的风格类型数组，如{少女型,优雅型}
  rule_logic jsonb,                       -- 规则逻辑（结构化，供引擎使用）
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE attribute_match_rules IS '搭配原则规则表：定义色彩/风格搭配规则，供自动搭配引擎使用';
COMMENT ON COLUMN attribute_match_rules.rule_logic IS '规则逻辑JSON，如{type:"tone_match",fields:["brightness","saturation"]}';

-- ----------------------------------------------------------------
-- 6. 扩展 products 表（加属性编码字段）
-- ----------------------------------------------------------------
ALTER TABLE products ADD COLUMN IF NOT EXISTS fabric_code text[];          -- 面料编码数组，如{F01,F07}
ALTER TABLE products ADD COLUMN IF NOT EXISTS cut_code text[];             -- 剪裁编码数组，如{B01,C01}
ALTER TABLE products ADD COLUMN IF NOT EXISTS pattern_code text[];         -- 图案编码数组，如{P01}
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_hex text;              -- 商品主色HEX，如 #F5E6D3
ALTER TABLE products ADD COLUMN IF NOT EXISTS color_season_code text;      -- 自动匹配的色彩季型编码，如S01
ALTER TABLE products ADD COLUMN IF NOT EXISTS style_conclusion text;       -- 自动打的风格结论，如"少女型"
ALTER TABLE products ADD COLUMN IF NOT EXISTS match_tags jsonb;            -- 搭配标签JSON，如{styles:["少女型"],seasons:["S01"]}
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku text;                    -- SKU编码

COMMENT ON COLUMN products.fabric_code IS '面料编码数组，关联attribute_fabrics.code';
COMMENT ON COLUMN products.cut_code IS '剪裁编码数组，关联attribute_cuts.code';
COMMENT ON COLUMN products.pattern_code IS '图案编码数组，关联attribute_patterns.code';
COMMENT ON COLUMN products.color_hex IS '商品主色HEX值，用于自动匹配色彩季型';
COMMENT ON COLUMN products.color_season_code IS '自动匹配的色彩季型编码，关联attribute_color_seasons.code';
COMMENT ON COLUMN products.style_conclusion IS 'AI或人工打的风格结论';
COMMENT ON COLUMN products.match_tags IS '搭配标签，结构化数据供搭配引擎使用';

-- ----------------------------------------------------------------
-- 7. 搭配方案表 (outfit_matches) — 自动生成的搭配方案
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outfit_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  title text NOT NULL,                     -- 搭配方案标题
  description text,                        -- 搭配说明
  product_ids uuid[],                     -- 参与搭配的商品ID数组
  match_type text DEFAULT 'auto',         -- auto=自动生成 / manual=人工编辑
  style_tags text[],                     -- 风格标签，如{少女型,优雅型}
  season_tags text[],                    -- 色彩季型标签，如{S01,S02}
  occasion text,                         -- 场合：日常/职场/晚宴/休闲
  match_rule_code text,                  -- 使用的搭配原则编码，如R01
  ai_report jsonb,                      -- AI生成的搭配报告
  is_published boolean DEFAULT false,    -- 是否发布到每日搭配灵感
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE outfit_matches IS '搭配方案表：存储自动生成或人工编辑的搭配方案';
COMMENT ON COLUMN outfit_matches.product_ids IS '参与此搭配方案的商品ID数组';
COMMENT ON COLUMN outfit_matches.style_tags IS '此搭配适用的风格类型';
COMMENT ON COLUMN outfit_matches.season_tags IS '此搭配适用的色彩季型';

-- ----------------------------------------------------------------
-- 8. 每日搭配灵感推送记录 (inspiration_feeds)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspiration_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  outfit_match_id uuid REFERENCES outfit_matches(id) ON DELETE CASCADE,
  push_date date DEFAULT CURRENT_DATE,    -- 推送日期
  target_vip_ids uuid[],                 -- 推送目标VIP客户ID数组（按风格/季型匹配）
  view_count int DEFAULT 0,              -- 浏览次数
  click_count int DEFAULT 0,             -- 点击次数
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE inspiration_feeds IS '每日搭配灵感推送记录：记录每天推送给哪些VIP的搭配方案';

-- ----------------------------------------------------------------
-- 索引
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_color_season_code ON products(color_season_code);
CREATE INDEX IF NOT EXISTS idx_products_style_conclusion ON products(style_conclusion);
CREATE INDEX IF NOT EXISTS idx_outfit_matches_store_id ON outfit_matches(store_id);
CREATE INDEX IF NOT EXISTS idx_outfit_matches_is_published ON outfit_matches(is_published);
CREATE INDEX IF NOT EXISTS idx_inspiration_feeds_push_date ON inspiration_feeds(push_date);
CREATE INDEX IF NOT EXISTS idx_inspiration_feeds_store_id ON inspiration_feeds(store_id);

-- ----------------------------------------------------------------
-- RLS (Row Level Security)
-- ----------------------------------------------------------------
ALTER TABLE attribute_fabrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_cuts DISABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_patterns DISABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_color_seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_match_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_feeds DISABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- 刷新 PostgREST  schema cache
-- ----------------------------------------------------------------
SELECT pg_notify('pgrst', 'reload schema');

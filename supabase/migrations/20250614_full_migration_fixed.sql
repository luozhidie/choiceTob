-- ============================================================
-- 骆芷蝶智选 · 数据库迁移 SQL（修正版）
-- 请在 Supabase Dashboard > SQL Editor 中执行
-- ============================================================

-- 【1】trend_history 表：爆款历史数据
CREATE TABLE IF NOT EXISTS trend_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  platform TEXT,
  item_id TEXT,
  title TEXT,
  price INTEGER,
  sales_volume INTEGER DEFAULT 0,
  heat_score INTEGER,
  image_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trend_history_keyword ON trend_history(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_history_recorded ON trend_history(recorded_at DESC);


-- 【2】luxury_brands 表：奢品品牌库
CREATE TABLE IF NOT EXISTS luxury_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_key TEXT UNIQUE NOT NULL,
  brand_name_cn TEXT NOT NULL,
  brand_name_en TEXT NOT NULL,
  founded_year INTEGER,
  origin_country TEXT,
  brand_profile TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 【3】luxury_classics 表：经典款/品牌元素/走秀
CREATE TABLE IF NOT EXISTS luxury_classics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_key TEXT REFERENCES luxury_brands(brand_key) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_urls TEXT[],
  attributes JSONB,
  season TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- 【4】products 表扩展字段
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS fabric_codes TEXT[],
  ADD COLUMN IF NOT EXISTS cut_codes TEXT[],
  ADD COLUMN IF NOT EXISTS pattern_codes TEXT[],
  ADD COLUMN IF NOT EXISTS color_tags TEXT[];


-- 【5】buyer_products 表扩展字段
ALTER TABLE buyer_products
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS fabric_codes TEXT[],
  ADD COLUMN IF NOT EXISTS cut_codes TEXT[],
  ADD COLUMN IF NOT EXISTS pattern_codes TEXT[],
  ADD COLUMN IF NOT EXISTS color_tags TEXT[];


-- 【6】celebrity_products 表：明星同款持久化
CREATE TABLE IF NOT EXISTS celebrity_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_name TEXT NOT NULL,
  platform TEXT,
  item_id TEXT,
  title TEXT,
  price INTEGER,
  image_url TEXT,
  sale_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_celebrity_name ON celebrity_products(celebrity_name);
CREATE INDEX IF NOT EXISTS idx_celebrity_recorded ON celebrity_products(recorded_at DESC);


-- ============================================================
-- 奢品品牌种子数据（建表后执行）
-- ============================================================
INSERT INTO luxury_brands (brand_key, brand_name_cn, brand_name_en, founded_year, origin_country, brand_profile) VALUES
('chanel', '香奈儿', 'Chanel', 1910, '法国', '以简约优雅、斜纹软呢、珍珠元素著称，现代女性时尚的奠基者。经典元素：斜纹软呢外套、双色鞋、珍珠项链、山茶花、CC扣。'),
('dior', '迪奥', 'Dior', 1946, '法国', '新风貌（New Look）开创者，优雅奢华的代名词。经典元素：Bar Jacket 收腰外套、Oblique 老花、CD扣、藤格纹。'),
('ysl', '圣罗兰', 'Saint Laurent', 1961, '法国', '颠覆传统，倡导女性西装与中性风。经典元素：Le Smoking 吸烟装、Kate 手袋、YSL金扣、漆皮红唇。'),
('loewe', '罗意威', 'Loewe', 1846, '西班牙', '百年皮具世家，创意总监 Jonathan Anderson 注入艺术先锋感。经典元素：Puzzle 拼图包、Flamenco 软包、Anagram 字母扣、皮革编织。'),
('valentino', '华伦天奴', 'Valentino', 1960, '意大利', '以 Valentino Red 正红和仙女裙著称。经典元素：Valentino Red 正红礼服、Rockstud 铆钉、VLogo 扣、高定仙女裙。')
ON CONFLICT (brand_key) DO UPDATE SET
  brand_name_cn = EXCLUDED.brand_name_cn,
  brand_profile = EXCLUDED.brand_profile;


-- 香奈儿经典款
INSERT INTO luxury_classics (brand_key, item_type, title, description, attributes) VALUES
('chanel', 'classic_style', '斜纹软呢外套', 'Chanel 最具标志性的外套，源自1950s，永恒优雅。', '{"colors":["黑色","米色","白色"],"styles":["经典","优雅"]}'),
('chanel', 'classic_style', '255 手袋', '1955年推出的翻盖包，菱格纹 + 金属链。', '{"colors":["黑色","米色"],"styles":["经典"]}'),
('chanel', 'brand_element', '双色鞋', '米色鞋身 + 黑色鞋尖，拉长脚型，适配所有装束。', '{"colors":["米色","黑色"],"patterns":["纯色"]}'),
('chanel', 'brand_element', '山茶花元素', 'Coco Chanel 最爱的花朵，出现在服饰/包袋/首饰各处。', '{"colors":["白色","红色"],"patterns":["花卉"]}')
ON CONFLICT (brand_key, title) DO NOTHING;


-- 迪奥经典款
INSERT INTO luxury_classics (brand_key, item_type, title, description, attributes) VALUES
('dior', 'classic_style', 'Bar Jacket 收腰外套', '1947 新风貌（New Look）的核心单品，收腰 + 阔摆裙。', '{"colors":["米色","黑色"],"cuts":["收腰"]}'),
('dior', 'classic_style', 'Lady Dior 戴妃包', '1995 年赠予戴安娜王妃得名的菱格纹手提包。', '{"colors":["黑色","nude"],"patterns":["菱格"]}'),
('dior', 'brand_element', 'Oblique 老花帆布', 'Dior 标志性 monogram 图案，近年强势回归。', '{"patterns":["monogram"],"colors":["蓝色","白色"]}')
ON CONFLICT (brand_key, title) DO NOTHING;


-- 圣罗兰经典款
INSERT INTO luxury_classics (brand_key, item_type, title, description, attributes) VALUES
('ysl', 'classic_style', 'Le Smoking 吸烟装', '1966 年首推女性燕尾服，颠覆性别着装规范。', '{"colors":["黑色"],"styles":["中性","先锋"]}'),
('ysl', 'brand_element', 'YSL 金扣 LOGO', 'Cassandre 设计的黄金字母扣，出现在包袋/首饰/鞋履。', '{"colors":["金色","银色"],"patterns":["logo"]}')
ON CONFLICT (brand_key, title) DO NOTHING;


-- 罗意威经典款
INSERT INTO luxury_classics (brand_key, item_type, title, description, attributes) VALUES
('loewe', 'classic_style', 'Puzzle 拼图包', '可多角度背负，几何解构主义代表作。', '{"colors":["棕色","黑色","白色"],"styles":["解构","艺术"]}'),
('loewe', 'brand_element', 'Anagram 字母扣', 'Loewe 交织字母 L 标志，出现在皮具五金。', '{"patterns":["字母"],"colors":["金色"]}')
ON CONFLICT (brand_key, title) DO NOTHING;


-- 华伦天奴经典款
INSERT INTO luxury_classics (brand_key, item_type, title, description, attributes) VALUES
('valentino', 'classic_style', 'Valentino Red 正红礼服', '品牌标志性「Valentino Red」，高级定制礼服代表作。', '{"colors":["红色"],"styles":["优雅","高定"]}'),
('valentino', 'brand_element', 'Rockstud 铆钉', '金字塔形铆钉装饰，出现在鞋履/包袋/服饰。', '{"patterns":["铆钉"],"styles":["摇滚","奢华"]}')
ON CONFLICT (brand_key, title) DO NOTHING;

-- ============================================================
-- 骆芷蝶智选 · 数据库迁移（无外键版本，最稳妥）
-- 请在 Supabase Dashboard > SQL Editor 中 一次性执行
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


-- 【2】luxury_brands 表：奢品品牌库（不加外键引用）
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


-- 【3】luxury_classics 表：经典款（brand_key 只是普通字段，不设外键）
CREATE TABLE IF NOT EXISTS luxury_classics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_key TEXT NOT NULL,
  item_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_urls TEXT[],
  attributes JSONB,
  season TEXT,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_luxury_classics_brand ON luxury_classics(brand_key);


-- 【4】celebrity_products 表：明星同款持久化
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


-- ============================================================
-- 种子数据（建表成功后执行）
-- ============================================================

INSERT INTO luxury_brands (brand_key, brand_name_cn, brand_name_en, founded_year, origin_country, brand_profile) VALUES
('chanel', '香奈儿', 'Chanel', 1910, '法国', '以简约优雅、斜纹软呢、珍珠元素著称。'),
('dior', '迪奥', 'Dior', 1946, '法国', '新风貌开创者，优雅奢华的代名词。'),
('ysl', '圣罗兰', 'Saint Laurent', 1961, '法国', '颠覆传统，倡导女性西装与中性风。'),
('loewe', '罗意威', 'Loewe', 1846, '西班牙', '百年皮具世家，艺术先锋感。'),
('valentino', '华伦天奴', 'Valentino', 1960, '意大利', '以 Valentino Red 正红和仙女裙著称。')
ON CONFLICT (brand_key) DO NOTHING;

INSERT INTO luxury_classics (brand_key, item_type, title, description, attributes) VALUES
('chanel', 'classic_style', '斜纹软呢外套', 'Chanel 最具标志性的外套', '{"colors":["黑色","米色"],"styles":["经典"]}'),
('chanel', 'classic_style', '255 手袋', '1955年推出的翻盖包', '{"colors":["黑色","米色"]}'),
('chanel', 'brand_element', '双色鞋', '米色鞋身加黑色鞋尖', '{"colors":["米色","黑色"]}'),
('dior', 'classic_style', 'Bar Jacket 收腰外套', '1947 新风貌核心单品', '{"cuts":["收腰"]}'),
('dior', 'classic_style', 'Lady Dior 戴妃包', '戴安娜王妃得名的菱格纹包', '{"patterns":["菱格"]}'),
('ysl', 'classic_style', 'Le Smoking 吸烟装', '1966 年首推女性燕尾服', '{"colors":["black"],"styles":["neutral"]}')
ON CONFLICT DO NOTHING;

-- 奢品品牌库
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

-- 奢品经典款 / 品牌元素 / 走秀
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

-- ==========================================
-- 1. 补充 buyer_products 字段（供应商提交）
-- ==========================================
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS color_family text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS color_name text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS style_name text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS product_code text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS fabrics text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS seasons text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS occasions text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS fits text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS wholesale_price integer DEFAULT 0;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS weight text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS elasticity text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS thickness text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS lining text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_phone text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_wechat text;

-- ==========================================
-- 2. 创建 color_definitions 表（后台管理色彩选项）
-- ==========================================
CREATE TABLE IF NOT EXISTS color_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family text NOT NULL,
  family_label text NOT NULL,
  color_name text NOT NULL,
  color_hex text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_color_def_unique
  ON color_definitions(family, color_name);

-- RLS
ALTER TABLE color_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read color_definitions" ON color_definitions;
CREATE POLICY "Public read color_definitions"
  ON color_definitions FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access color_definitions" ON color_definitions;
CREATE POLICY "Admin full access color_definitions"
  ON color_definitions FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn');

-- 初始化数据：5大色系下的常用颜色
INSERT INTO color_definitions (family, family_label, color_name, color_hex, sort_order) VALUES
('warm', '暖色系', '大红', '#DC143C', 10),
('warm', '暖色系', '橘红', '#FF4500', 20),
('warm', '暖色系', '枚红', '#FF69B4', 30),
('warm', '暖色系', '橘色', '#FF8C00', 40),
('warm', '暖色系', '干姜橘', '#DB7C53', 50),
('warm', '暖色系', '番茄红', '#FF6347', 60),
('warm', '暖色系', '珊瑚红', '#FF7F50', 70),
('warm', '暖色系', '杏色', '#FFD4B1', 80),
('warm', '暖色系', '奶茶色', '#C8A28C', 90),
('cool', '冷色系', '雾霾蓝', '#B0C4DE', 10),
('cool', '冷色系', '宝蓝', '#4169E1', 20),
('cool', '冷色系', '湖水绿', '#48D1CC', 30),
('cool', '冷色系', '冰紫', '#B39DBC', 40),
('cool', '冷色系', '海军蓝', '#000080', 50),
('cool', '冷色系', '翠绿', '#28A745', 60),
('cool', '冷色系', '灰蓝', '#6A8CAD', 70),
('earth', '大地色系', '驼色', '#C19A6B', 10),
('earth', '大地色系', '卡其', '#C3B091', 20),
('earth', '大地色系', '咖啡色', '#6F4E37', 30),
('earth', '大地色系', '橄榄绿', '#808000', 40),
('earth', '大地色系', '牛油果绿', '#568203', 50),
('earth', '大地色系', '铁锈红', '#852D37', 60),
('deep', '深色系', '黑色', '#000000', 10),
('deep', '深色系', '深蓝', '#00008B', 20),
('deep', '深色系', '酒红', '#722F37', 30),
('deep', '深色系', '墨绿', '#1B4D3B', 40),
('deep', '深色系', '炭灰', '#403E3E', 50),
('neutral', '中性色系', '米白', '#F5F5DC', 10),
('neutral', '中性色系', '浅灰', '#D3D3D3', 20),
('neutral', '中性色系', '中灰', '#808080', 30),
('neutral', '中性色系', '炭灰', '#36454F', 40),
('neutral', '中性色系', '白色', '#FFFFFF', 50),
('neutral', '中性色系', '银灰', '#C0C0C0', 60)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. 创建 style_definitions 表（后台管理风格选项）
-- ==========================================
CREATE TABLE IF NOT EXISTS style_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_label text NOT NULL,
  style_name text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_style_def_unique
  ON style_definitions(group_label, style_name);

ALTER TABLE style_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read style_definitions" ON style_definitions;
CREATE POLICY "Public read style_definitions"
  ON style_definitions FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admin full access style_definitions" ON style_definitions;
CREATE POLICY "Admin full access style_definitions"
  ON style_definitions FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn');

-- 初始化数据
INSERT INTO style_definitions (group_label, style_name, sort_order) VALUES
('女士风格', '淑女风', 10),
('女士风格', '知性风', 20),
('女士风格', '名媛风', 30),
('女士风格', '中性风', 40),
('女士风格', '潮牌风', 50),
('女士风格', '职业风', 60),
('女士风格', '休闲风', 70),
('女士风格', '大牌风', 80),
('男士风格', '气场型男', 10),
('男士风格', '随性达人', 20),
('男士风格', '精英绅士', 30),
('男士风格', '优雅先生', 40),
('男士风格', '潮流先锋', 50)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. 创建 supplier-products storage bucket
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-products', 'supplier-products', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read supplier-products" ON storage.objects;
CREATE POLICY "Public read supplier-products"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'supplier-products');

DROP POLICY IF EXISTS "Allow upload supplier-products" ON storage.objects;
CREATE POLICY "Allow upload supplier-products"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'supplier-products');

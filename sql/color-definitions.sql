-- ==========================================
-- 色彩定义表（用户可自定义颜色名）
-- ==========================================
CREATE TABLE IF NOT EXISTS color_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family text NOT NULL,       -- 色系：warm/cool/earth/deep/neutral
  family_label text NOT NULL, -- 显示名：暖色系/冷色系...
  color_name text NOT NULL,   -- 具体颜色名：大红/橘红/枚红...
  color_hex text,              -- 色值（可选）
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 唯一约束：同一色系下颜色名不重复
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
-- 暖色系
('warm', '暖色系', '大红', '#DC143C', 10),
('warm', '暖色系', '橘红', '#FF4500', 20),
('warm', '暖色系', '枚红', '#FF69B4', 30),
('warm', '暖色系', '橘色', '#FF8C00', 40),
('warm', '暖色系', '干姜橘', '#DB7C53', 50),
('warm', '暖色系', '番茄红', '#FF6347', 60),
('warm', '暖色系', '珊瑚红', '#FF7F50', 70),
('warm', '暖色系', '杏色', '#FFD4B1', 80),
('warm', '暖色系', '奶茶色', '#C8A28C', 90),
-- 冷色系
('cool', '冷色系', '雾霾蓝', '#B0C4DE', 10),
('cool', '冷色系', '宝蓝', '#4169E1', 20),
('cool', '冷色系', '湖水绿', '#48D1CC', 30),
('cool', '冷色系', '冰紫', '#B0A1C7', 40),
('cool', '冷色系', '海军蓝', '#000080', 50),
('cool', '冷色系', '翠绿', '#28A745', 60),
('cool', '冷色系', '灰蓝', '#6A8CAD', 70),
-- 大地色系
('earth', '大地色系', '驼色', '#C19A6B', 10),
('earth', '大地色系', '卡其', '#C3B091', 20),
('earth', '大地色系', '咖啡色', '#6F4E37', 30),
('earth', '大地色系', '橄榄绿', '#808000', 40),
('earth', '大地色系', '牛油果绿', '#568203', 50),
('earth', '大地色系', '铁锈红', '#852D37', 60),
-- 深色系
('deep', '深色系', '黑色', '#000000', 10),
('deep', '深色系', '深蓝', '#00008B', 20),
('deep', '深色系', '酒红', '#722F37', 30),
('deep', '深色系', '墨绿', '#1B4D3B', 40),
('deep', '深色系', '炭灰', '#403E3E', 50),
-- 中性色系
('neutral', '中性色系', '米白', '#F5F5DC', 10),
('neutral', '中性色系', '浅灰', '#D3D3D3', 20),
('neutral', '中性色系', '中灰', '#808080', 30),
('neutral', '中性色系', '炭灰', '#36454F', 40),
('neutral', '中性色系', '白色', '#FFFFFF', 50),
('neutral', '中性色系', '银灰', '#C0C0C0', 60)
ON CONFLICT DO NOTHING;

-- ==========================================
-- 修改 buyer_products 表：color_season → color_family + color_name
-- ==========================================
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS color_family text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS color_name text;

-- 迁移旧数据：把 color_season 映射到 color_family
UPDATE buyer_products SET color_family = CASE
  WHEN color_season IN ('light_warm','warm_bright','clear_warm') THEN 'warm'
  WHEN color_season IN ('light_cool','soft_cool','cool_soft') THEN 'cool'
  WHEN color_season IN ('warm_soft','soft_warm','deep_warm') THEN 'earth'
  WHEN color_season IN ('clear_cool','deep_cool') THEN 'deep'
  WHEN color_season = 'cool_bright' THEN 'neutral'
  ELSE NULL END
WHERE color_family IS NULL;

-- 注意：旧 color_season 字段保留，暂不删除（兼容读取）

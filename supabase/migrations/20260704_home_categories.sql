-- 首页行业标签表（和商品品类 categories 分开）
CREATE TABLE IF NOT EXISTS home_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label VARCHAR(50) NOT NULL,
  icon TEXT DEFAULT '',
  link VARCHAR(200) DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 插入默认首页行业标签
INSERT INTO home_categories (label, sort_order) VALUES
('全部', 0),
('穿搭', 1),
('护肤', 2),
('彩妆', 3),
('养生', 4),
('食品', 5),
('家居', 6),
('文创', 7),
('艺术', 8);

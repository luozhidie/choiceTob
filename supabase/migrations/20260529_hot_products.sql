-- 爆款样衣商品表
CREATE TABLE IF NOT EXISTS hot_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  details TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER,
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  category TEXT,
  season TEXT,
  is_published BOOLEAN DEFAULT false,
  is_members_only BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 策略
ALTER TABLE hot_products ENABLE ROW LEVEL SECURITY;

-- 任何人可查看已发布的
CREATE POLICY "hot_products_select_all" ON hot_products
  FOR SELECT USING (is_published = true);

-- 管理员可全部操作（通过 service_role 绕过 RLS）

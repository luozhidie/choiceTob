-- 测款功能数据库表创建
-- 在 Supabase SQL Editor 中执行以下 SQL

-- 1. 测款任务表
CREATE TABLE IF NOT EXISTS product_test_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  test_duration INTEGER DEFAULT 7,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT DEFAULT 'active', -- active | completed | cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 测款商品表
CREATE TABLE IF NOT EXISTS product_test_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES product_test_campaigns(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_title TEXT,
  product_image TEXT,
  views INTEGER DEFAULT 0,        -- 曝光量
  clicks INTEGER DEFAULT 0,        -- 点击量
  cart_adds INTEGER DEFAULT 0,     -- 加购数
  inquiries INTEGER DEFAULT 0,     -- 询盘数
  orders INTEGER DEFAULT 0,        -- 下单数
  is_winner BOOLEAN DEFAULT FALSE, -- 是否胜出
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 关闭 RLS（管理员通过 cookie 登录，不走 Supabase Auth）
ALTER TABLE product_test_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_test_items DISABLE ROW LEVEL SECURITY;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_test_items_campaign ON product_test_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_test_campaigns_status ON product_test_campaigns(status);

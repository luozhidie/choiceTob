-- ============================================
-- Phase 6: 商品企划 + 陈列搭配 数据库迁移
-- ============================================

-- 1. planning_reports 增加新字段
ALTER TABLE planning_reports ADD COLUMN IF NOT EXISTS color_season TEXT;
ALTER TABLE planning_reports ADD COLUMN IF NOT EXISTS style_type TEXT;
ALTER TABLE planning_reports ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false;

-- 2. display_images 增加新字段
ALTER TABLE display_images ADD COLUMN IF NOT EXISTS color_season TEXT;
ALTER TABLE display_images ADD COLUMN IF NOT EXISTS style_type TEXT;
ALTER TABLE display_images ADD COLUMN IF NOT EXISTS scenario TEXT;
ALTER TABLE display_images ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. 创建企划订单表
CREATE TABLE IF NOT EXISTS planning_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  color_season TEXT,
  style_type TEXT,
  brand_name TEXT,
  target_age TEXT,
  price_range TEXT,
  notes TEXT,
  amount INTEGER NOT NULL DEFAULT 59800,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  result_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. planning_orders RLS
ALTER TABLE planning_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own planning orders"
  ON planning_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own planning orders"
  ON planning_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all planning orders"
  ON planning_orders FOR ALL
  USING (auth.jwt() ->> 'email' = 'luozhidie@live.cn');

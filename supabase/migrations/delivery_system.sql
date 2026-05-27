-- =====================================================
-- 交付辅助工具 + 爆款数据中心 数据库迁移
-- =====================================================

-- 1. delivery_plans 增加字段
ALTER TABLE delivery_plans ADD COLUMN IF NOT EXISTS delivery_link UUID DEFAULT gen_random_uuid();
ALTER TABLE delivery_plans ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'select';
ALTER TABLE delivery_plans ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 2. 交付物表 (每个订单可有多个交付文件)
CREATE TABLE IF NOT EXISTS delivery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES delivery_plans(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,        -- image/pdf/document/zip/link
  file_size BIGINT DEFAULT 0,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 交付状态日志
CREATE TABLE IF NOT EXISTS delivery_status_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES delivery_plans(id) ON DELETE CASCADE NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 爆款数据持久化表
CREATE TABLE IF NOT EXISTS trend_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT,
  category TEXT,
  price_range TEXT,
  colors TEXT[],
  style TEXT,
  heat_score INT DEFAULT 0,
  sales_volume TEXT,
  trend_type TEXT,       -- 全网爆款/潜在爆款/爆款微调款/设计师款/原创款
  source_url TEXT,
  image_url TEXT,
  keywords TEXT[],
  suggestion TEXT,
  saved BOOLEAN DEFAULT FALSE,
  search_keyword TEXT,   -- 搜索关键词
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS 策略
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_items ENABLE ROW LEVEL SECURITY;

-- 已认证用户完全管理权限
DO $$ BEGIN
  -- delivery_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_items' AND policyname = 'auth_manage_delivery_items') THEN
    CREATE POLICY "auth_manage_delivery_items" ON delivery_items FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- delivery_status_log
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'delivery_status_log' AND policyname = 'auth_manage_status_log') THEN
    CREATE POLICY "auth_manage_status_log" ON delivery_status_log FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- trend_items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trend_items' AND policyname = 'auth_manage_trend_items') THEN
    CREATE POLICY "auth_manage_trend_items" ON trend_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 6. 创建 Storage bucket (需在 Supabase Dashboard 手动创建 "deliveries" bucket)
-- 或通过 SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('deliveries', 'deliveries', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage 策略: 已认证用户可上传
-- CREATE POLICY "auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'deliveries' AND auth.role() = 'authenticated');
-- CREATE POLICY "public_read" ON storage.objects FOR SELECT USING (bucket_id = 'deliveries');

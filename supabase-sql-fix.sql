-- ======================================
-- 1. products 表添加字段
-- ======================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];

-- ======================================
-- 2. hot_picks 表添加字段
-- ======================================
ALTER TABLE hot_picks ADD COLUMN IF NOT EXISTS description TEXT;

-- ======================================
-- 3. 创建 products 存储桶
-- ======================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- ======================================
-- 4. products 存储桶 RLS 策略
-- ======================================
DROP POLICY IF EXISTS "products_upload" ON storage.objects;
DROP POLICY IF EXISTS "products_read" ON storage.objects;
DROP POLICY IF EXISTS "products_delete" ON storage.objects;

CREATE POLICY "products_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');

CREATE POLICY "products_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY "products_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'products');

-- ======================================
-- 5. 创建 daily-looks 存储桶
-- ======================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('daily-looks', 'daily-looks', true)
ON CONFLICT (id) DO NOTHING;

-- ======================================
-- 6. daily-looks 存储桶 RLS 策略
-- ======================================
DROP POLICY IF EXISTS "daily_looks_upload" ON storage.objects;
DROP POLICY IF EXISTS "daily_looks_read" ON storage.objects;
DROP POLICY IF EXISTS "daily_looks_delete" ON storage.objects;

CREATE POLICY "daily_looks_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'daily-looks');

CREATE POLICY "daily_looks_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'daily-looks');

CREATE POLICY "daily_looks_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'daily-looks');

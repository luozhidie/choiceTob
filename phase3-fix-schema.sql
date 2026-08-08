-- Phase3 修复：添加缺失列
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE products ADD COLUMN IF NOT EXISTS images text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 确保 RLS 策略存在
DROP POLICY IF EXISTS "Allow public read published courses" ON courses;
CREATE POLICY "Allow public read published courses"
  ON courses FOR SELECT TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Allow admin full access on courses" ON courses;
CREATE POLICY "Allow admin full access on courses"
  ON courses FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

DROP POLICY IF EXISTS "Allow public read published products" ON products;
CREATE POLICY "Allow public read published products"
  ON products FOR SELECT TO anon, authenticated
  USING (is_published = true);

DROP POLICY IF EXISTS "Allow admin full access on products" ON products;
CREATE POLICY "Allow admin full access on products"
  ON products FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

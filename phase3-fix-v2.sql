-- 先检查并修复 courses 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'is_published') THEN
    ALTER TABLE courses ADD COLUMN is_published boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'sort_order') THEN
    ALTER TABLE courses ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'video_url') THEN
    ALTER TABLE courses ADD COLUMN video_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'content') THEN
    ALTER TABLE courses ADD COLUMN content text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'updated_at') THEN
    ALTER TABLE courses ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;

-- 检查并修复 products 表
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_published') THEN
    ALTER TABLE products ADD COLUMN is_published boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'images') THEN
    ALTER TABLE products ADD COLUMN images text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'original_price') THEN
    ALTER TABLE products ADD COLUMN original_price integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags') THEN
    ALTER TABLE products ADD COLUMN tags text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sort_order') THEN
    ALTER TABLE products ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
END $$;

-- 重新创建策略
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

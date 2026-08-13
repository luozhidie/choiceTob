-- ==========================================
-- 设计师中心 & 买手中心 套餐表
-- ==========================================

-- 1. 设计师套餐表
DROP TABLE IF EXISTS designer_packages;

CREATE TABLE designer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  features text, -- 每行一项，用换行分隔
  price_individual integer NOT NULL DEFAULT 0,
  price_group integer NOT NULL DEFAULT 0,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE designer_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published designer_packages"
  ON designer_packages
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on designer_packages"
  ON designer_packages
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- 2. 买手套餐表
DROP TABLE IF EXISTS buyer_packages;

CREATE TABLE buyer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  features text, -- 每行一项，用换行分隔
  price_individual integer NOT NULL DEFAULT 0,
  price_group integer NOT NULL DEFAULT 0,
  image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE buyer_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published buyer_packages"
  ON buyer_packages
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on buyer_packages"
  ON buyer_packages
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- ==========================================
-- Storage Buckets 权限策略
-- 需要在 Supabase Dashboard → Storage 中手动创建以下 bucket（Public bucket）：
-- 1. designer-images
-- 2. buyer-center-images
-- ==========================================

-- designer-images bucket policies
DROP POLICY IF EXISTS "Allow authenticated uploads to designer-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from designer-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from designer-images" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to designer-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'designer-images');

CREATE POLICY "Allow authenticated deletes from designer-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'designer-images');

CREATE POLICY "Allow public reads from designer-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'designer-images');

-- buyer-center-images bucket policies
DROP POLICY IF EXISTS "Allow authenticated uploads to buyer-center-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from buyer-center-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from buyer-center-images" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to buyer-center-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'buyer-center-images');

CREATE POLICY "Allow authenticated deletes from buyer-center-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'buyer-center-images');

CREATE POLICY "Allow public reads from buyer-center-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'buyer-center-images');

-- 销售服务图片表
DROP TABLE IF EXISTS sales_images;

CREATE TABLE sales_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  label text,
  image_url text,
  section text NOT NULL DEFAULT 'service', -- service, scripts
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE sales_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published sales_images"
  ON sales_images
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on sales_images"
  ON sales_images
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- Storage policies for sales-images bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to sales-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from sales-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from sales-images" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to sales-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'sales-images');

CREATE POLICY "Allow authenticated deletes from sales-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'sales-images');

CREATE POLICY "Allow public reads from sales-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'sales-images');

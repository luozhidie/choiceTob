-- 供应商图片表
DROP TABLE IF EXISTS supplier_images;

CREATE TABLE supplier_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  label text,
  image_url text,
  section text NOT NULL DEFAULT 'cases', -- cases only for now
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE supplier_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published supplier_images"
  ON supplier_images
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on supplier_images"
  ON supplier_images
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- Storage policies for supplier-images bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to supplier-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from supplier-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from supplier-images" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to supplier-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'supplier-images');

CREATE POLICY "Allow authenticated deletes from supplier-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'supplier-images');

CREATE POLICY "Allow public reads from supplier-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'supplier-images');

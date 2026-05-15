-- 陈列搭配图片表（图片展示）
DROP TABLE IF EXISTS display_images;

CREATE TABLE display_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  label text,
  image_url text,
  section text NOT NULL DEFAULT 'styles', -- styles, scenarios, layouts
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE display_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published display_images"
  ON display_images
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on display_images"
  ON display_images
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- Storage policies for display-images bucket
DROP POLICY IF EXISTS "Allow authenticated uploads to display-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from display-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from display-images" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to display-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'display-images');

CREATE POLICY "Allow authenticated deletes from display-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'display-images');

CREATE POLICY "Allow public reads from display-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'display-images');

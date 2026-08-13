-- 爆款货盘表（图片展示）
DROP TABLE IF EXISTS hot_picks_images;

CREATE TABLE hot_picks_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  label text,
  image_url text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE hot_picks_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published hot_picks_images"
  ON hot_picks_images
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on hot_picks_images"
  ON hot_picks_images
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- Storage policies for hot-picks-images bucket
CREATE POLICY "Allow authenticated uploads to hot-picks-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hot-picks-images');

CREATE POLICY "Allow authenticated deletes from hot-picks-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'hot-picks-images');

CREATE POLICY "Allow public reads from hot-picks-images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'hot-picks-images');

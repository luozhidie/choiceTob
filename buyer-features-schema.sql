-- 平台选品功能表（图片卡片展示）
DROP TABLE IF EXISTS buyer_features;

CREATE TABLE buyer_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE buyer_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published buyer_features"
  ON buyer_features
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on buyer_features"
  ON buyer_features
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

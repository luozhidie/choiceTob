-- 买手选品步骤表（四步精准选品图片展示）
DROP TABLE IF EXISTS buyer_steps;

CREATE TABLE buyer_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number int NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  detail_content text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE buyer_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published buyer_steps"
  ON buyer_steps
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on buyer_steps"
  ON buyer_steps
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

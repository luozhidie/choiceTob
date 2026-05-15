-- 商品企划步骤表（企划全流程图片展示）
DROP TABLE IF EXISTS planning_steps;

CREATE TABLE planning_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number int NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text NOT NULL,
  image_url text,
  items text[],
  detail_content text,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE planning_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published planning_steps"
  ON planning_steps
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on planning_steps"
  ON planning_steps
  FOR ALL
  TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- ==========================================
-- Phase 3：课程 + 商品 + 订单完善
-- ==========================================

-- 3. 课程表
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image text,
  price integer NOT NULL, -- 分
  is_free boolean DEFAULT false,
  category text, -- 'cmb_color'色彩诊断 / 'styling'搭配 / 'wardrobe'衣橱 / 'image'形象
  level text DEFAULT 'beginner', -- 'beginner'入门 / 'intermediate'进阶 / 'advanced'高级
  duration_minutes integer,
  video_url text,
  content text, -- 课程详细介绍（富文本）
  is_published boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published courses"
  ON courses FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on courses"
  ON courses FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- 4. 商品表
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image text,
  images text[],
  price integer NOT NULL, -- 分
  original_price integer,
  category text, -- 'accessory'配饰 / 'clothing'服装 / 'tool'工具 / 'book'书籍
  tags text[],
  is_published boolean DEFAULT false,
  stock integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read published products"
  ON products FOR SELECT TO anon, authenticated
  USING (is_published = true);

CREATE POLICY "Allow admin full access on products"
  ON products FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- 骆芷蝶智选 - 教学中心/流行资讯/服装趋势 数据库建表 SQL
-- 在 Supabase SQL Editor 中执行此脚本

-- ==========================================
-- 1. 教学中心 - 课程表
-- ==========================================
CREATE TABLE IF NOT EXISTS courses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  video_url text,                -- B站/腾讯视频嵌入链接
  cover_url text,                -- 封面图 Storage URL
  price integer DEFAULT 0,          -- 0=会员免费, >0=单独购买价（分）
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public courses are visible" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access" ON courses FOR ALL USING (auth.email() IN (SELECT unnest(string_to_array(current_setting('app.admin_emails'), ',')));

-- ==========================================
-- 2. 流行资讯 - 文章表
-- ==========================================
CREATE TABLE IF NOT EXISTS articles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  excerpt text,
  content text,                  -- 富文本内容
  image_url text,
  tag text,                     -- 分类标签
  is_premium boolean DEFAULT false,  -- true=仅订阅可见
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published articles are visible" ON articles FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access" ON articles FOR ALL USING (auth.email() IN (SELECT unnest(string_to_array(current_setting('app.admin_emails'), ','))));

-- ==========================================
-- 3. 流行资讯 - 订阅计划表
-- ==========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,           -- '月费会员' / '年费会员'
  price integer NOT NULL,        -- 价格（分）：9800=¥98, 98000=¥980
  duration_days integer NOT NULL, -- 30 / 365
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 插入默认订阅计划
INSERT INTO subscription_plans (name, price, duration_days) VALUES
  ('月费会员', 9800, 30),
  ('年费会员', 98000, 365);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON subscription_plans FOR SELECT USING (is_active = true);

-- ==========================================
-- 4. 流行资讯 - 用户订阅记录表
-- ==========================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) NOT NULL,
  start_date date DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  status text DEFAULT 'active',     -- active / expired
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 5. 服装趋势 - 趋势报告表
-- ==========================================
CREATE TABLE IF NOT EXISTS fashion_trends (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  category text NOT NULL,        -- '色彩趋势' / '面料趋势' / '款式趋势' / '灵感图册'
  title text NOT NULL,
  content text,
  images text[],                -- 多张图片URL数组
  date date DEFAULT CURRENT_DATE,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE fashion_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published trends visible" ON fashion_trends FOR SELECT USING (is_published = true);
CREATE POLICY "Admin full access" ON fashion_trends FOR ALL USING (auth.email() IN (SELECT unnest(string_to_array(current_setting('app.admin_emails'), ','))));

-- ==========================================
-- 6. 创建 Storage Buckets（在 Supabase Dashboard → Storage 中手动创建）
-- ==========================================
-- 需要在 Supabase Dashboard → Storage 中手动创建以下 bucket（public = true）：
-- 1. course-covers     （课程封面图）
-- 2. magazine-images   （流行资讯文章图片）
-- 3. trend-images     （服装趋势图片）

-- ==========================================
-- 完成提示
-- ==========================================
-- ✅ 共创建 5 张表 + 2 条默认订阅计划
-- ⚡ 请手动在 Supabase Dashboard → Storage 创建 3 个 bucket
-- ⚡ 请在 Supabase Dashboard → Settings → Database → enable "app.admin_emails" 变量
--    或把 RLS policy 中的 admin check 改为你的管理员邮箱

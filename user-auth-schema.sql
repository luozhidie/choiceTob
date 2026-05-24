-- ============================================================
-- 用户认证与会员系统 Schema
-- 扩展 Supabase Auth，存储用户额外信息与会员状态
-- ============================================================

-- 1. profiles 表：扩展 auth.users 的用户信息
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  full_name TEXT,
  company_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),

  -- 会员类型：none=无, view_price=查看价格会员, deposit_discount=充值货款折扣会员
  membership_type TEXT NOT NULL DEFAULT 'none' CHECK (membership_type IN ('none', 'view_price', 'deposit_discount')),
  membership_expires_at TIMESTAMPTZ,

  -- 充值货款会员专用字段
  deposit_amount INTEGER DEFAULT 0,          -- 预存货款金额（分）
  deposit_discount_rate DECIMAL(3,2) DEFAULT 1.00, -- 折扣率 0.26 = 2.6折
  deposit_return_rate DECIMAL(3,2) DEFAULT 0,  -- 退货率

  -- 查看价格会员专用字段
  view_price_package_id TEXT,                  -- 购买的套餐ID

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建触发器：用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能查看和修改自己的 profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 匿名用户不能访问 profiles
CREATE POLICY "Anon cannot access profiles"
  ON profiles FOR ALL
  TO anon
  USING (false);

-- 管理员可以查看所有 profiles（通过 service_role 绕过 RLS）

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON profiles(membership_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 5. 更新已有用户的 profile（如果有的话）
INSERT INTO profiles (id, email, role)
SELECT id, email, 'admin'
FROM auth.users
WHERE email IN (
  SELECT string_to_table(current_setting('app.admin_emails', true), ',')
)
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- 6. 课程购买记录表（用于付费课程解锁）
CREATE TABLE IF NOT EXISTS course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  price INTEGER NOT NULL,           -- 实际支付价格（分）
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'refunded')),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON course_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases"
  ON course_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. 商品企划需求收集表
CREATE TABLE IF NOT EXISTS planning_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  store_type TEXT NOT NULL,         -- 店铺类型
  store_scale TEXT NOT NULL,        -- 店铺体量
  style_preference TEXT NOT NULL,   -- 风格偏好
  season TEXT,                      -- 季节
  budget_range TEXT,                -- 预算区间
  contact TEXT,                     -- 联系方式
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'completed')),
  paid_amount INTEGER DEFAULT 0,    -- 已支付金额（分）
  report_url TEXT,                  -- 生成的报告链接
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE planning_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON planning_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own requests"
  ON planning_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anon can insert requests"
  ON planning_requests FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

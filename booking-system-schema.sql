-- =====================================================
-- 预约陪购系统 Schema
-- 在 Supabase SQL Editor 中执行（一次性）
-- =====================================================

-- 1. 形象顾问
CREATE TABLE IF NOT EXISTS consultants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  title text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. 顾问排期（每天一个时段数组）
CREATE TABLE IF NOT EXISTS booking_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid NOT NULL REFERENCES consultants(id) ON DELETE CASCADE,
  date date NOT NULL,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consultant_id, date)
);

-- 3. 陪购设置（单条记录）
CREATE TABLE IF NOT EXISTS booking_settings (
  id int PRIMARY KEY DEFAULT 1,
  location text NOT NULL DEFAULT '泉州·鲤城服装批发市场',
  price_per_hour numeric NOT NULL DEFAULT 200,
  service_fee numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT '¥',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. 营销方案
CREATE TABLE IF NOT EXISTS marketing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. 预约订单
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_id uuid REFERENCES consultants(id) ON DELETE SET NULL,
  consultant_name text,
  user_name text NOT NULL,
  phone text NOT NULL,
  date date NOT NULL,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  location text,
  price_per_hour numeric NOT NULL DEFAULT 200,
  service_fee numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  coupon text,
  note text,
  status text NOT NULL DEFAULT '待确认',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_booking_schedules_consultant ON booking_schedules(consultant_id);
CREATE INDEX IF NOT EXISTS idx_booking_schedules_date ON booking_schedules(date);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultants_active ON consultants(is_active);

-- 启用 RLS
ALTER TABLE consultants ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 公开读策略（小程序通过 service_role API 访问，这里作为兜底允许 anon 读）
DROP POLICY IF EXISTS "consultants_public_read" ON consultants;
CREATE POLICY "consultants_public_read" ON consultants FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "booking_schedules_public_read" ON booking_schedules;
CREATE POLICY "booking_schedules_public_read" ON booking_schedules FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "booking_settings_public_read" ON booking_settings;
CREATE POLICY "booking_settings_public_read" ON booking_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "marketing_plans_public_read" ON marketing_plans;
CREATE POLICY "marketing_plans_public_read" ON marketing_plans FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "bookings_admin_all" ON bookings;
CREATE POLICY "bookings_admin_all" ON bookings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 初始化设置单行
INSERT INTO booking_settings (id, location, price_per_hour, service_fee)
VALUES (1, '泉州·鲤城服装批发市场', 200, 0)
ON CONFLICT (id) DO NOTHING;

-- 初始化两条示例顾问（管理员可在后台删除/修改）
INSERT INTO consultants (name, title, description, sort_order)
VALUES
  ('洛薇', 'V5 搭配师', '专注职场通勤与高级感秋冬穿搭，擅长根据身材与肤色选款。', 1),
  ('Amy', '资深陪购顾问', '熟悉南油一手货源，帮你用批发价拿到专柜品质。', 2)
ON CONFLICT DO NOTHING;

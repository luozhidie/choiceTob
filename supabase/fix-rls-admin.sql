-- 修复 RLS：允许管理员（role=admin）访问所有表
-- 在 Supabase SQL Editor 里运行此文件

-- 1. 确保 profiles 表有 role 字段，且你的账号是 admin
UPDATE profiles SET role = 'admin' WHERE email = 'luozhidie@live.cn';

-- 2. 为每个核心表创建 admin 策略（如果还没有）
-- leads 表
DROP POLICY IF EXISTS "Admins can do anything" ON leads;
CREATE POLICY "Admins can do anything" ON leads FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- vip_customers 表
DROP POLICY IF EXISTS "Admins can do anything" ON vip_customers;
CREATE POLICY "Admins can do anything" ON vip_customers FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- orders 表
DROP POLICY IF EXISTS "Admins can do anything" ON orders;
CREATE POLICY "Admins can do anything" ON orders FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- delivery_plans 表
DROP POLICY IF EXISTS "Admins can do anything" ON delivery_plans;
CREATE POLICY "Admins can do anything" ON delivery_plans FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- courses 表
DROP POLICY IF EXISTS "Admins can do anything" ON courses;
CREATE POLICY "Admins can do anything" ON courses FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- products 表
DROP POLICY IF EXISTS "Admins can do anything" ON products;
CREATE POLICY "Admins can do anything" ON products FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- inventory 表
DROP POLICY IF EXISTS "Admins can do anything" ON inventory;
CREATE POLICY "Admins can do anything" ON inventory FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- test_codes 表
DROP POLICY IF EXISTS "Admins can do anything" ON test_codes;
CREATE POLICY "Admins can do anything" ON test_codes FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- style_test_results 表
DROP POLICY IF EXISTS "Admins can do anything" ON style_test_results;
CREATE POLICY "Admins can do anything" ON style_test_results FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- 确保 RLS 已开启（如果还没开）
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_test_results ENABLE ROW LEVEL SECURITY;

-- 完成提示
SELECT 'RLS admin 策略已创建完成' AS result;

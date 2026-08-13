-- ================================================================
-- 安全加固 Migration：修复 RLS 策略 + 加审批流程字段
-- 日期：2026-06-13
-- ================================================================

-- ── 1. profiles 表：加 role + approval_status + approved_by + approved_at ──
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'pending' CHECK (role IN ('pending', 'user', 'admin', 'owner'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- 注释
COMMENT ON COLUMN profiles.role IS '用户角色：pending(待审批)=user(普通用户)=admin(管理员)=owner(超级管理员)';
COMMENT ON COLUMN profiles.approval_status IS '审批状态：pending(待审批)=approved(已批准)=rejected(已拒绝)';
COMMENT ON COLUMN profiles.approved_by IS '批准人用户ID';
COMMENT ON COLUMN profiles.approved_at IS '批准时间';
COMMENT ON COLUMN profiles.rejected_reason IS '拒绝原因';

-- ── 2. 创建审批申请表（可选，也可用 profiles 表记录）──
-- 用 profiles 表即可，不需要额外表

-- ── 3. 修复 RLS 策略：所有业务表收紧为 store_id 隔离或 admin 角色 ──

-- 先删除旧的过于宽松的策略
DROP POLICY IF EXISTS "Allow authenticated users" ON product_structure_plan;
DROP POLICY IF EXISTS "Allow authenticated users" ON product_matrix_plan;
DROP POLICY IF EXISTS "Allow authenticated users" ON purchase_order_items;
DROP POLICY IF EXISTS "Allow authenticated users" ON wave_plan;
DROP POLICY IF EXISTS "Allow authenticated users" ON vip_service_logs;
DROP POLICY IF EXISTS "Allow authenticated users" ON product_evaluation;
DROP POLICY IF EXISTS "Allow authenticated users" ON weekly_sales_analysis;
DROP POLICY IF EXISTS "Allow authenticated users" ON inventory;
DROP POLICY IF EXISTS "Allow authenticated users" ON purchase_orders;
DROP POLICY IF EXISTS "Allow authenticated users" ON salon_events;
DROP POLICY IF EXISTS "Allow authenticated users" ON content_calendar;
DROP POLICY IF EXISTS "Allow authenticated users" ON project_tracker;
DROP POLICY IF EXISTS "Allow authenticated users" ON budget_tracker;

-- ── 新策略：用户只能访问自己 store 的数据 ──

-- product_structure_plan：store_id 隔离
CREATE POLICY IF NOT EXISTS "Users can access own store product_structure_plan" 
  ON product_structure_plan FOR ALL 
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- product_matrix_plan
CREATE POLICY IF NOT EXISTS "Users can access own store product_matrix_plan" 
  ON product_matrix_plan FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- purchase_order_items
CREATE POLICY IF NOT EXISTS "Users can access own store purchase_order_items" 
  ON purchase_order_items FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- wave_plan
CREATE POLICY IF NOT EXISTS "Users can access own store wave_plan" 
  ON wave_plan FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- vip_service_logs
CREATE POLICY IF NOT EXISTS "Users can access own store vip_service_logs" 
  ON vip_service_logs FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- product_evaluation
CREATE POLICY IF NOT EXISTS "Users can access own store product_evaluation" 
  ON product_evaluation FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- weekly_sales_analysis
CREATE POLICY IF NOT EXISTS "Users can access own store weekly_sales_analysis" 
  ON weekly_sales_analysis FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- inventory
CREATE POLICY IF NOT EXISTS "Users can access own store inventory" 
  ON inventory FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- purchase_orders
CREATE POLICY IF NOT EXISTS "Users can access own store purchase_orders" 
  ON purchase_orders FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- salon_events
CREATE POLICY IF NOT EXISTS "Users can access own store salon_events" 
  ON salon_events FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- content_calendar
CREATE POLICY IF NOT EXISTS "Users can access own store content_calendar" 
  ON content_calendar FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- project_tracker
CREATE POLICY IF NOT EXISTS "Users can access own store project_tracker" 
  ON project_tracker FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- budget_tracker
CREATE POLICY IF NOT EXISTS "Users can access own store budget_tracker" 
  ON budget_tracker FOR ALL 
  USING (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  )
  WITH CHECK (
    store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner')
  );

-- ── 4. profiles 表 RLS：用户只能看自己的 profile，admin/owner 可以看所有 ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON profiles;

CREATE POLICY IF NOT EXISTS "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner'));

CREATE POLICY IF NOT EXISTS "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 允许 service role（后台服务）完全访问 profiles
CREATE POLICY IF NOT EXISTS "Service role full access on profiles" 
  ON profiles FOR ALL 
  USING (auth.role() = 'service_role');

-- ── 5. stores 表 RLS：用户只能访问自己的 store ──
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access own stores" ON stores;

CREATE POLICY IF NOT EXISTS "Users can access own stores" 
  ON stores FOR ALL 
  USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner'))
  WITH CHECK (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner'));

-- ── 6. 初始化：将 ADMIN_EMAILS 中的用户设为 owner ──
-- （需要在 Supabase SQL Editor 中手动执行，或取消注释下方）
-- UPDATE profiles 
-- SET role = 'owner', approval_status = 'approved'
-- WHERE email IN ('admin@example.com')  -- 替换为实际的 owner 邮箱
--   AND role IS DISTINCT FROM 'owner';

-- ── 7. 创建审批日志表（记录所有审批操作）──
CREATE TABLE IF NOT EXISTS approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Only admin/owner can view approval_logs" 
  ON approval_logs FOR SELECT 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner'));
CREATE POLICY IF NOT EXISTS "Only admin/owner can insert approval_logs" 
  ON approval_logs FOR INSERT 
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'owner'));

COMMENT ON TABLE approval_logs IS '管理员审批操作日志';

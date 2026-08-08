-- ================================================================
-- 安全加固 v5：审批流程字段 + 基于角色的 RLS（无 store 隔离）
-- 日期：2026-06-13
-- 说明：stores 表没有 user_id 列，故采用 role-based RLS
--       只有 admin/owner 角色的已批准用户可访问业务数据
-- 执行方式：在 Supabase SQL Editor 中一次性执行
-- ================================================================

-- ── 1. profiles 表：加审批字段 ──

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'pending' CHECK (role IN ('pending', 'user', 'admin', 'owner'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

COMMENT ON COLUMN profiles.role IS '用户角色：pending=user=admin=owner';
COMMENT ON COLUMN profiles.approval_status IS '审批状态：pending=approved=rejected';

-- ── 2. 删除旧的宽松策略 ──

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

DROP POLICY IF EXISTS "Admins can manage marketing actions" ON rfm_marketing_actions;
DROP POLICY IF EXISTS "Users can view stores" ON stores;
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
DROP POLICY IF EXISTS "Users can view vip_customers" ON vip_customers;
DROP POLICY IF EXISTS "Users can manage vip_customers" ON vip_customers;
DROP POLICY IF EXISTS "Users can view inventory" ON inventory;
DROP POLICY IF EXISTS "Users can manage inventory" ON inventory;
DROP POLICY IF EXISTS "Users can view purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can manage purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can manage orders" ON orders;
DROP POLICY IF EXISTS "Users can view purchase_intents" ON purchase_intents;
DROP POLICY IF EXISTS "Users can manage purchase_intents" ON purchase_intents;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON profiles;
DROP POLICY IF EXISTS "Users can access own stores" ON stores;

-- ── 3. 新建基于角色的 RLS 策略 ──
-- 核心逻辑：(SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner')

CREATE POLICY "own_product_structure_plan" ON product_structure_plan FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_product_matrix_plan" ON product_matrix_plan FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_purchase_order_items" ON purchase_order_items FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_wave_plan" ON wave_plan FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_vip_service_logs" ON vip_service_logs FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_product_evaluation" ON product_evaluation FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_weekly_sales_analysis" ON weekly_sales_analysis FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_inventory" ON inventory FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_purchase_orders" ON purchase_orders FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_salon_events" ON salon_events FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_content_calendar" ON content_calendar FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_project_tracker" ON project_tracker FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "own_budget_tracker" ON budget_tracker FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));

CREATE POLICY "admins_manage_rfm" ON rfm_marketing_actions FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "admins_manage_stores" ON stores FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "admins_manage_vip_customers" ON vip_customers FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "admins_manage_orders" ON orders FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "admins_manage_purchase_intents" ON purchase_intents FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));

-- ── 4. profiles RLS ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_own_profile" ON profiles FOR SELECT USING (id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "service_role_profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');

-- ── 5. stores RLS ──
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_access_stores" ON stores FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));

-- ── 6. 审批日志表 ──
CREATE TABLE IF NOT EXISTS approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view_approval_logs" ON approval_logs FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));
CREATE POLICY "insert_approval_logs" ON approval_logs FOR INSERT WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','owner'));

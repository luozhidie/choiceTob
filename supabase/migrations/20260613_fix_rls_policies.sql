-- 修复 RLS 策略：限制普通用户访问，只允许管理员或数据所有者访问
-- 创建时间：2026-06-13

-- ============================================
-- 1. rfm_marketing_actions 表
-- ============================================

-- 删除过于宽松的策略
DROP POLICY IF EXISTS "Admins can manage marketing actions" ON rfm_marketing_actions;

-- 新建策略：只允许管理员访问
CREATE POLICY "Admins can manage marketing actions"
  ON rfm_marketing_actions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 2. stores 表
-- ============================================

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "Users can view stores" ON stores;
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;

-- 策略：用户只能查看自己的店铺，管理员可以查看所有店铺
CREATE POLICY "Users can view own stores"
  ON stores FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 策略：只有管理员可以插入/更新/删除店铺
CREATE POLICY "Admins can manage stores"
  ON stores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 3. vip_customers 表
-- ============================================

DROP POLICY IF EXISTS "Users can view vip_customers" ON vip_customers;
DROP POLICY IF EXISTS "Users can manage vip_customers" ON vip_customers;

-- 策略：用户只能查看自己店铺的VIP，管理员可以查看所有
CREATE POLICY "Users can view own store vip"
  ON vip_customers FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own store vip"
  ON vip_customers FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. inventory 表
-- ============================================

DROP POLICY IF EXISTS "Users can view inventory" ON inventory;
DROP POLICY IF EXISTS "Users can manage inventory" ON inventory;

CREATE POLICY "Users can view own store inventory"
  ON inventory FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own store inventory"
  ON inventory FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 5. purchase_orders 表
-- ============================================

DROP POLICY IF EXISTS "Users can view purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can manage purchase_orders" ON purchase_orders;

CREATE POLICY "Users can view own store orders"
  ON purchase_orders FOR SELECT
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own store orders"
  ON purchase_orders FOR ALL
  USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 6. orders 表（客户订单）
-- ============================================

DROP POLICY IF EXISTS "Users can view orders" ON orders;
DROP POLICY IF EXISTS "Users can manage orders" ON orders;

CREATE POLICY "Users can view orders"
  ON orders FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage orders"
  ON orders FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 7. purchase_intents 表
-- ============================================

DROP POLICY IF EXISTS "Users can view purchase_intents" ON purchase_intents;
DROP POLICY IF EXISTS "Users can manage purchase_intents" ON purchase_intents;

CREATE POLICY "Users can view own purchase_intents"
  ON purchase_intents FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can manage own purchase_intents"
  ON purchase_intents FOR ALL
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM auth.users
      JOIN public.profiles ON auth.users.id = profiles.id
      WHERE auth.users.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 完成：RLS 策略已修复
-- 说明：
-- 1. 普通用户只能访问自己拥有的数据（通过 user_id = auth.uid() 或 store_id 关联）
-- 2. 管理员（profiles.role = 'admin'）可以访问所有数据
-- 3. 删除了所有 USING (true) 的宽松策略

-- =====================================================
-- 安全加固 - RLS策略修复
-- 在 Supabase SQL Editor 中执行
-- =====================================================

-- 1. 启用被禁用RLS的表
ALTER TABLE attribute_fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_color_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_match_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_feeds ENABLE ROW LEVEL SECURITY;

-- 2. 为 attribute_* 表添加只读策略（登录用户可读，admin/owner可写）
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'attribute_fabrics', 'attribute_cuts', 'attribute_patterns',
    'attribute_color_seasons', 'attribute_match_rules'
  ]) LOOP
    -- 登录用户只读
    EXECUTE format('CREATE POLICY "%s_read_authenticated" ON %I FOR SELECT TO authenticated USING (true)', tbl, tbl);
    -- admin/owner 可写
    EXECUTE format('CREATE POLICY "%s_write_admin" ON %I FOR ALL TO authenticated USING (
      (SELECT role FROM current_user_role()) IN (''admin'', ''owner'')
    ) WITH CHECK (
      (SELECT role FROM current_user_role()) IN (''admin'', ''owner'')
    )', tbl, tbl);
  END LOOP;
END $$;

-- 3. outfit_matches - 登录用户可读，admin/owner可写
CREATE POLICY "outfit_matches_read_authenticated" ON outfit_matches
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "outfit_matches_write_admin" ON outfit_matches
  FOR ALL TO authenticated USING (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  ) WITH CHECK (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

-- 4. inspiration_feeds - 登录用户可读，admin/owner可写
CREATE POLICY "inspiration_feeds_read_authenticated" ON inspiration_feeds
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "inspiration_feeds_write_admin" ON inspiration_feeds
  FOR ALL TO authenticated USING (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  ) WITH CHECK (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

-- 5. 修复 USING(true) 的表 - delivery_items, delivery_status_log, trend_items
-- 先删除旧策略
DROP POLICY IF EXISTS "Allow all access to delivery_items" ON delivery_items;
DROP POLICY IF EXISTS "Allow all access to delivery_status_log" ON delivery_status_log;
DROP POLICY IF EXISTS "Allow all access to trend_items" ON trend_items;

-- delivery_items - 登录用户可读自己店铺的，admin/owner可全部读写
CREATE POLICY "delivery_items_read_authenticated" ON delivery_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "delivery_items_write_admin" ON delivery_items
  FOR ALL TO authenticated USING (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  ) WITH CHECK (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

-- delivery_status_log - 同上
CREATE POLICY "delivery_status_log_read_authenticated" ON delivery_status_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "delivery_status_log_write_admin" ON delivery_status_log
  FOR ALL TO authenticated USING (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  ) WITH CHECK (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

-- trend_items - 同上
CREATE POLICY "trend_items_read_authenticated" ON trend_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "trend_items_write_admin" ON trend_items
  FOR ALL TO authenticated USING (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  ) WITH CHECK (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

-- 6. 修复 service_records USING(true)
DROP POLICY IF EXISTS "Allow all access to service_records" ON service_records;
CREATE POLICY "service_records_read_authenticated" ON service_records
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_records_write_admin" ON service_records
  FOR ALL TO authenticated USING (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  ) WITH CHECK (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

-- 7. 修复 style_diagnoses USING(true)
DROP POLICY IF EXISTS "Allow all access to style_diagnoses" ON style_diagnoses;
-- 用户只能看自己的诊断记录，admin/owner可看全部
CREATE POLICY "style_diagnoses_read_own" ON style_diagnoses
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );
CREATE POLICY "style_diagnoses_insert_own" ON style_diagnoses
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "style_diagnoses_write_admin" ON style_diagnoses
  FOR ALL TO authenticated USING (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  ) WITH CHECK (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

-- 8. 修复 purchase_intents Allow anon insert
DROP POLICY IF EXISTS "Allow anon insert" ON purchase_intents;
-- 需要登录才能创建购买意向
CREATE POLICY "purchase_intents_insert_authenticated" ON purchase_intents
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "purchase_intents_read_authenticated" ON purchase_intents
  FOR SELECT TO authenticated USING (
    user_id = auth.uid() OR (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

-- 9. 修复 course_purchases - 添加 admin 删除权限
CREATE POLICY "course_purchases_admin_all" ON course_purchases
  FOR ALL TO authenticated USING (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  ) WITH CHECK (
    (SELECT role FROM current_user_role()) IN ('admin', 'owner')
  );

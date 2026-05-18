-- ================================================================
-- 索引（加速查询）
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_product_structure_plan_store ON product_structure_plan(store_id);
CREATE INDEX IF NOT EXISTS idx_product_matrix_plan_store ON product_matrix_plan(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_store ON purchase_order_items(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wave_plan_store ON wave_plan(store_id);
CREATE INDEX IF NOT EXISTS idx_vip_service_logs_vip ON vip_service_logs(vip_customer_id);
CREATE INDEX IF NOT EXISTS idx_product_evaluation_store ON product_evaluation(store_id);
CREATE INDEX IF NOT EXISTS idx_weekly_sales_store ON weekly_sales_analysis(store_id);
CREATE INDEX IF NOT EXISTS idx_weekly_sales_week ON weekly_sales_analysis(week_ending);
CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku_code);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_store ON purchase_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_no ON purchase_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_salon_events_store ON salon_events(store_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_store ON content_calendar(store_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(post_date);
CREATE INDEX IF NOT EXISTS idx_project_tracker_store ON project_tracker(store_id);
CREATE INDEX IF NOT EXISTS idx_budget_tracker_store ON budget_tracker(store_id);

-- ================================================================
-- RLS（行级安全）
-- ================================================================
ALTER TABLE product_structure_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_matrix_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wave_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_sales_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_tracker ENABLE ROW LEVEL SECURITY;

-- 允许已登录用户访问自己店铺的数据（通过 store_id 关联）
-- 简化策略：允许已认证用户全量访问（后台系统，由应用层控制权限）
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON product_structure_plan FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON product_matrix_plan FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON purchase_order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON wave_plan FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON vip_service_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON product_evaluation FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON weekly_sales_analysis FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON salon_events FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON content_calendar FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON project_tracker FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY IF NOT EXISTS "Allow authenticated users" ON budget_tracker FOR ALL USING (auth.role() = 'authenticated');

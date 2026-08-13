-- 店铺经营目标字段
-- 企业预算、业绩目标、营利目标 — 所有业务模块（企划/买手/营销/销售/货盘）的约束条件

-- 添加 business_goals JSONB 字段
-- 结构示例：
-- {
--   "annual_budget": 500000,          -- 年度采购预算(元)
--   "quarterly_budget": 125000,       -- 季度采购预算(元)
--   "annual_revenue_target": 2000000, -- 年度业绩目标(元)
--   "quarterly_revenue_target": 500000, -- 季度业绩目标(元)
--   "gross_margin_target": 0.45,      -- 毛利率目标(如45%)
--   "net_margin_target": 0.15,        -- 净利率目标(如15%)
--   "sell_through_target": 0.85,      -- 售罄率目标(如85%)
--   "inventory_turnover_days": 45,    -- 库存周转天数目标
--   "attachment_rate_target": 1.8,    -- 连带率目标
--   "new_vip_target": 50,             -- 新增VIP目标数
--   "repurchase_rate_target": 0.6     -- 复购率目标
-- }

ALTER TABLE stores ADD COLUMN IF NOT EXISTS business_goals JSONB DEFAULT '{}';

-- 营销活动表增强（增加数据驱动字段）
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS season VARCHAR(20);
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50); -- VIP召回/新品推广/清仓促销/节日营销/会员日
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '{}'; -- 目标客群画像
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(12,2) DEFAULT 0; -- 活动预算
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS expected_revenue NUMERIC(12,2) DEFAULT 0; -- 预期营收
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS expected_roi NUMERIC(5,2) DEFAULT 0; -- 预期ROI
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '{}'; -- 方案依据数据源
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ai_report JSONB DEFAULT '{}'; -- AI生成的完整方案

-- 销售服务表增强
ALTER TABLE sales_services ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE sales_services ADD COLUMN IF NOT EXISTS service_category VARCHAR(50); -- 话术培训/服务套餐/诊断工具/销售流程/VIP服务
ALTER TABLE sales_services ADD COLUMN IF NOT EXISTS season VARCHAR(20);
ALTER TABLE sales_services ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '{}';
ALTER TABLE sales_services ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '{}';
ALTER TABLE sales_services ADD COLUMN IF NOT EXISTS ai_report JSONB DEFAULT '{}';

-- 索引
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_store ON marketing_campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_sales_services_store ON sales_services(store_id);
CREATE INDEX IF NOT EXISTS idx_sales_services_category ON sales_services(service_category);

COMMENT ON COLUMN stores.business_goals IS '店铺经营目标：年度/季度预算、业绩目标、营利目标、售罄率等KPI';

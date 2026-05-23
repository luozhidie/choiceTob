-- 店铺画像字段扩展
-- 客户类型、服务套餐、需求分析等ToB业务核心字段

-- 添加店铺画像字段
ALTER TABLE stores ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50); -- 新手型/转型型/扩张型/升级型
ALTER TABLE stores ADD COLUMN IF NOT EXISTS opening_date DATE;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS team_size INTEGER;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS monthly_sales INTEGER; -- 月销售额
ALTER TABLE stores ADD COLUMN IF NOT EXISTS average_order_value INTEGER; -- 客单价
ALTER TABLE stores ADD COLUMN IF NOT EXISTS main_customer_group TEXT; -- 主要客户群体
ALTER TABLE stores ADD COLUMN IF NOT EXISTS current_brands TEXT[] DEFAULT '{}'; -- 现有品牌
ALTER TABLE stores ADD COLUMN IF NOT EXISTS best_selling_categories TEXT[] DEFAULT '{}'; -- 畅销品类
ALTER TABLE stores ADD COLUMN IF NOT EXISTS pain_points TEXT[] DEFAULT '{}'; -- 痛点
ALTER TABLE stores ADD COLUMN IF NOT EXISTS needs_priority TEXT[] DEFAULT '{}'; -- 需求优先级
ALTER TABLE stores ADD COLUMN IF NOT EXISTS service_package VARCHAR(10); -- A/B/C套餐
ALTER TABLE stores ADD COLUMN IF NOT EXISTS package_amount INTEGER; -- 合同金额
ALTER TABLE stores ADD COLUMN IF NOT EXISTS competitors TEXT[] DEFAULT '{}'; -- 竞品
ALTER TABLE stores ADD COLUMN IF NOT EXISTS differentiation TEXT; -- 差异化优势
ALTER TABLE stores ADD COLUMN IF NOT EXISTS decision_timeline VARCHAR(100); -- 决策时间线
ALTER TABLE stores ADD COLUMN IF NOT EXISTS budget_range VARCHAR(100); -- 预算范围
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address TEXT; -- 详细地址

-- 创建服务记录表（周/月/季报告）
CREATE TABLE IF NOT EXISTS service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- weekly/monthly/quarterly
    report_date DATE NOT NULL,
    title VARCHAR(200),
    content TEXT,
    metrics JSONB DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 添加RLS策略
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access" ON service_records
    FOR ALL USING (true) WITH CHECK (true);

-- 更新状态枚举（如果不存在则添加）
-- 注意：如果status列已有约束，可能需要手动修改
COMMENT ON COLUMN stores.status IS '店铺状态: potential潜在客户, consulting咨询中, contracted已签约, executing服务中, completed服务完成, churned已流失';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_stores_customer_type ON stores(customer_type);
CREATE INDEX IF NOT EXISTS idx_stores_service_package ON stores(service_package);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_service_records_store_id ON service_records(store_id);
CREATE INDEX IF NOT EXISTS idx_service_records_type ON service_records(type);

-- 更新触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_records_updated_at ON service_records;
CREATE TRIGGER update_service_records_updated_at
    BEFORE UPDATE ON service_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE service_records IS '店铺服务记录表，存储周/月/季服务报告';
COMMENT ON COLUMN stores.customer_type IS '客户类型: newbie新手型, transform转型型, expand扩张型, upgrade升级型';
COMMENT ON COLUMN stores.service_package IS '服务套餐: A基础服务包, B标准服务包, C尊享服务包';

-- 完整修正版：创建函数 + 触发器 + RFM 字段
-- 如果某些字段已存在，会自动跳过（IF NOT EXISTS）

-- 1. 先创建/更新函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建触发器（先删除旧的，再创建新的）
DROP TRIGGER IF EXISTS payment_orders_updated_at ON payment_orders;

CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. RFM 字段（如果前面已执行成功，会自动跳过；如果失败，这里补上）
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS r_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS f_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS m_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS rfm_total NUMERIC(4,2);
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS rfm_level TEXT;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS is_high_value BOOLEAN DEFAULT false;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS is_churn_risk BOOLEAN DEFAULT false;

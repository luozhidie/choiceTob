-- ================================================================
-- 骆芷蝶智选 - 执行此 SQL 完成支付系统 + RFM 字段迁移
-- 步骤：
-- 1. 复制全部内容
-- 2. 打开 Supabase SQL Editor: https://supabase.com/dashboard/project/fxeknwkmytzedkhplozn/sql
-- 3. 粘贴此文件内容
-- 4. 点击 "RUN"
-- ================================================================

-- 1. 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  user_phone TEXT,
  order_no TEXT UNIQUE NOT NULL DEFAULT 'PO' || to_char(NOW(), 'YYYYMMDDHH24MISS') || '_' || substr(md5(random()::text), 1, 8),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY',
  subject TEXT NOT NULL,
  body TEXT,
  payment_method TEXT NOT NULL DEFAULT 'wxpay',
  product_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  refund_at TIMESTAMP WITH TIME ZONE,
  third_party_order_no TEXT,
  third_party_prepay_id TEXT,
  notify_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payment_orders ENABLE ROW LEVEL SECURTY;
CREATE POLIY "Users can view own payment orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLIY "Users can insert own payment orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. 支付配置表
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel TEXT UNIQUE NOT NULL,
  app_id TEXT NOT NULL,
  mch_id TEXT,
  api_key TEXT,
  cert_serial_no TEXT,
  cert_private_key TEXT,
  alipay_public_key TEXT,
  app_cert_content TEXT,
  notify_url TEXT,
  return_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payment_config ENABLE ROW LEVEL SECURTY;
CREATE POLIY "Only admins can access payment config" ON payment_config FOR ALL USING (false);

-- 3. 支付回调日志表
CREATE TABLE IF NOT EXISTS payment_notify_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_no TEXT,
  channel TEXT,
  notify_data JSONB,
  verified BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payment_notify_logs ENABLE ROW LEVEL SECURTY;
CREATE POLIY "Admins can view notify logs" ON payment_notify_logs FOR ALL USING (false);

-- 4. 刷新 updated_at 函数（支付表）
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. VIP 客户表增加 RFM 字段
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS r_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS f_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS m_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS rfm_total NUMERIC(4,2);
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS rfm_level TEXT;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS is_high_value BOOLEAN DEFAULT false;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS is_churn_risk BOOLEAN DEFAULT false;

-- 6. 创建 RFM 计算函数（直接在数据库里计算，更高效）
CREATE OR REPLACE FUNCTION calculate_rfm_for_store(p_store_id UUID)
RETURNS TABLE (
  customer_id UUID,
  r_score INT,
  f_score INT,
  m_score INT,
  rfm_total NUMERIC,
  rfm_level TEXT,
  segment TEXT,
  is_high_value BOOLEAN,
  is_churn_risk BOOLEAN
) AS $$
DECLARE
  v_now TIMESTAMP := NOW();
  v_30d_ago TIMESTAMP := v_now - INTERVAL '30 days';
  v_90d_ago TIMESTAMP := v_now - INTERVAL '90 days';
  v_180d_ago TIMESTAMP := v_now - INTERVAL '180 days';
  v_365d_ago TIMESTAMP := v_now - INTERVAL '365 days';
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    CASE
      WHEN c.last_purchase_date IS NULL THEN 1
      WHEN c.last_purchase_date >= v_30d_ago THEN 4
      WHEN c.last_purchase_date >= v_90d_ago THEN 3
      WHEN c.last_purchase_date >= v_180d_ago THEN 2
      ELSE 1
    END AS r_score,
    CASE
      WHEN COALESCE(c.total_purchase_count, 0) >= 20 THEN 4
      WHEN COALESCE(c.total_purchase_count, 0) >= 10 THEN 3
      WHEN COALESCE(c.total_purchase_count, 0) >= 5 THEN 2
      ELSE 1
    END AS f_score,
    CASE
      WHEN COALESCE(c.total_purchase_amount, 0) >= 10000 THEN 4
      WHEN COALESCE(c.total_purchase_amount, 0) >= 5000 THEN 3
      WHEN COALESCE(c.total_purchase_amount, 0) >= 2000 THEN 2
      ELSE 1
    END AS m_score,
    0.0 AS rfm_total,
    '' AS rfm_level,
    '' AS segment,
    false AS is_high_value,
    false AS is_churn_risk
  FROM vip_customers c
  WHERE (p_store_id IS NULL OR c.store_id = p_store_id);
END;
$$ LANGUAGE plpgsql;

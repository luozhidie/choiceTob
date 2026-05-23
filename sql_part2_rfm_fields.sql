-- 第二段：RFM 字段 + 完成通知（粘贴后点 RUN）
-- 3. VIP 客户表 增加 RFM 字段
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS r_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS f_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS m_score INTEGER;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS rfm_total NUMERIC(4,2);
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS rfm_level TEXT;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS is_high_value BOOLEAN DEFAULT false;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS is_churn_risk BOOLEAN DEFAULT false;

-- 4. 支付回调日志表
CREATE TABLE IF NOT EXISTS payment_notify_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_no TEXT, channel TEXT, notify_data JSONB,
  verified BOOLEAN DEFAULT false, error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE payment_notify_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view notify logs" ON payment_notify_logs FOR ALL USING (false);

-- 5. RFM 计算函数（可选，后续 API 也能算）
-- 已包含在 /api/members/rfm-calculate 中，这里只通知：已完成
SELECT 'RFM 字段已添加，payment_orders+payment_config+payment_notify_logs 已创建，请去前端测试支付流程' AS result;

-- =====================================================
-- 修复 membership_orders 表 - 添加缺失列
-- 在 Supabase SQL Editor 中执行
-- =====================================================

-- 1. 添加 order_no 列（微信支付订单号，用于回调时查找）
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS order_no TEXT;

-- 2. 添加 paid_at 列（支付完成时间）
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 3. 添加 transaction_id 列（微信支付交易号）
ALTER TABLE membership_orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;

-- 4. 添加 index
CREATE INDEX IF NOT EXISTS idx_membership_orders_order_no ON membership_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_membership_orders_user_id ON membership_orders(user_id);

-- 确认表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'membership_orders' 
ORDER BY ordinal_position;

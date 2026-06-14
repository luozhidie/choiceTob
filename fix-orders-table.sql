-- =====================================================
-- 修复 orders 表 - 添加缺失列
-- 在 Supabase SQL Editor 中执行
-- =====================================================

-- 1. 添加 user_id 列（关联下单用户）
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. 添加 payment_platform 列（wechat / alipay / offline）
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_platform TEXT;

-- 3. 添加 transaction_id 列（第三方支付交易号，替代 payment_trade_no 的语义）
-- 注意：表中已有 payment_trade_no，这里加 transaction_id 作为补充，或者直接用 payment_trade_no
-- 为兼容代码，我们直接用 payment_trade_no 存 transaction_id，不需要新列

-- 4. 可选：添加 index 加速查询
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_platform ON orders(payment_platform);

-- 确认表结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

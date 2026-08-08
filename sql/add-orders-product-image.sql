-- =====================================================
-- 为 orders 表补充 product_image 列（订单列表/详情展示商品图）
-- 在 Supabase SQL Editor 中执行一次即可（幂等，可重复执行）
-- =====================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_image TEXT;

-- 确认列已存在
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'product_image';

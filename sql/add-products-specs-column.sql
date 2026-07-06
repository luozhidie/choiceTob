-- 为 products 表增加「商品参数」字段（存储抓取到的规格/材质/尺码等）
-- 用途：一键导入时自动写入参数，后台「商品参数」区展示
-- 在 Supabase SQL Editor 中执行本脚本

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS specs jsonb;  -- 商品参数数组，如 ["材质:棉","尺码:M/L/XL"]

COMMENT ON COLUMN products.specs IS '商品参数数组（JSON），一键导入时自动抓取写入，如["材质:棉","尺码:M/L/XL"]';

-- 校验（可选，确认列已存在）
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'products' AND column_name = 'specs';

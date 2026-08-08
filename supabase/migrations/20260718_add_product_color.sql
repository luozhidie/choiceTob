-- 为 products 表增加颜色字段（与现有 sizes 字段一致，逗号分隔多个颜色）
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;
COMMENT ON COLUMN products.color IS '商品颜色，多个颜色用逗号分隔，如 白色,黑色,米色';

-- 20260716 商品参数落地 + 待处理图片元数据
-- 说明：商品表单此前已有 material/sizes/origin/care_instructions/weight/brand 输入框，
--       但 products 表缺列且提交逻辑未带上，导致参数无法落库。这里补齐。

-- 1) 商品参数列（brand 已存在，其余为新增）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS material TEXT,
  ADD COLUMN IF NOT EXISTS sizes TEXT,
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS care_instructions TEXT,
  ADD COLUMN IF NOT EXISTS weight TEXT;

-- 2) 待处理图片携带商品元数据
--    product_meta 结构示例：
--    { title, price(分), original_price(分), description, specs[], platform, source_url, group_key }
ALTER TABLE scraped_images
  ADD COLUMN IF NOT EXISTS product_meta JSONB;

CREATE INDEX IF NOT EXISTS idx_scraped_images_meta ON scraped_images USING gin (product_meta);

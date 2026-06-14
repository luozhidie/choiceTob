-- 为 products 和 buyer_products 表扩展属性字段
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS fabric_codes TEXT[],
  ADD COLUMN IF NOT EXISTS cut_codes TEXT[],
  ADD COLUMN IF NOT EXISTS pattern_codes TEXT[],
  ADD COLUMN IF NOT EXISTS color_tags TEXT[];

ALTER TABLE buyer_products
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS fabric_codes TEXT[],
  ADD COLUMN IF NOT EXISTS cut_codes TEXT[],
  ADD COLUMN IF NOT EXISTS pattern_codes TEXT[],
  ADD COLUMN IF NOT EXISTS color_tags TEXT[];

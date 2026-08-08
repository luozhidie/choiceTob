-- 为买手选品表添加供货价字段（VIP可见）
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS cost_price INTEGER;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier TEXT;

COMMENT ON COLUMN buyer_products.cost_price IS '供货价（分），仅VIP会员可见';
COMMENT ON COLUMN buyer_products.supplier IS '供应商名称';

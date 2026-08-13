-- 2026-07-17: 商品表增加批量采购价（≥5件价）字段
ALTER TABLE products ADD COLUMN IF NOT EXISTS bulk_price INTEGER;

-- 给已有数据一个默认的批量价：批发价的 95%（后续可在后台单独维护）
UPDATE products 
SET bulk_price = CASE 
  WHEN wholesale_price > 0 THEN ROUND(wholesale_price * 0.95)
  WHEN price > 0 THEN ROUND(price * 0.95)
  ELSE 0
END
WHERE bulk_price IS NULL;

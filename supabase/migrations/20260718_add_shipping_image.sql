-- 商品发货解释图片（2026-07-18）
-- 后台上传发货解释图片，小程序点击发货行进入解释页展示该图

ALTER TABLE products ADD COLUMN IF NOT EXISTS ship_image TEXT;

COMMENT ON COLUMN products.ship_image IS '发货解释图片 URL（后台上传，小程序发货解释页展示）';

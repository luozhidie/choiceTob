-- 商品发货信息字段（2026-07-18）
-- 说明：
--   ship_from      TEXT    —— 发货地（自由文本，可含备选，如「广州（杭州/深圳）」），后台可编辑
--   ship_est_days  INT     —— 预计发货天数，展示时由系统自动往后推日期；预售约 7 天
--   ship_text      TEXT    —— 发货说明/备注（如面料短缺、未发可取消）
-- 价格仍按「分」存储；发货相关均为文本/天数，无需单位换算。

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ship_from TEXT,
  ADD COLUMN IF NOT EXISTS ship_est_days INTEGER,
  ADD COLUMN IF NOT EXISTS ship_text TEXT;

-- 便于按发货地筛选（可选）
CREATE INDEX IF NOT EXISTS idx_products_ship_from ON products (ship_from)
  WHERE ship_from IS NOT NULL;

COMMENT ON COLUMN products.ship_from IS '发货地（自由文本，可含备选，后台可编辑）';
COMMENT ON COLUMN products.ship_est_days IS '预计发货天数，展示时系统自动往后推日期；预售约 7 天';
COMMENT ON COLUMN products.ship_text IS '发货说明/备注（如面料短缺、未发可取消）';

-- ============================================================
-- 心愿单（需求聚合）功能迁移
-- 用途：无价格的供货商图片先上架为「心愿单模式」商品，
--       用户点击「加入心愿单」表达需求；后台按心愿数排序，
--       量够后再去供货商开价。
-- ============================================================

-- 1) products 增加心愿单模式开关
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS wishlist_mode boolean NOT NULL DEFAULT false;

-- 2) 心愿单明细表：用户 ↔ 商品 多对多
CREATE TABLE IF NOT EXISTS product_wishes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 同一用户对同一商品只需一条
CREATE UNIQUE INDEX IF NOT EXISTS product_wishes_uniq
  ON product_wishes (product_id, user_id);

-- 后台按商品聚合心愿数时加速
CREATE INDEX IF NOT EXISTS product_wishes_product_id_idx
  ON product_wishes (product_id);

-- 按用户查自己的心愿单时加速
CREATE INDEX IF NOT EXISTS product_wishes_user_id_idx
  ON product_wishes (user_id);

-- 3) 行级安全：用户只能看/增/删自己的心愿；后台用 service_role 绕过
ALTER TABLE product_wishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wishes_select_own" ON product_wishes;
CREATE POLICY "wishes_select_own" ON product_wishes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishes_insert_own" ON product_wishes;
CREATE POLICY "wishes_insert_own" ON product_wishes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wishes_delete_own" ON product_wishes;
CREATE POLICY "wishes_delete_own" ON product_wishes
  FOR DELETE USING (auth.uid() = user_id);

-- 4) 便捷视图：每个商品的心愿数（后台 service_role 直接查，无需逐行权限）
CREATE OR REPLACE VIEW product_wish_counts AS
SELECT product_id, count(*)::int AS wish_count
FROM product_wishes
GROUP BY product_id;

-- ============================================================
-- 认证店主信息录入：stores 表补 owner_id 字段
-- 让小程序提交的店铺归属到提交用户，便于后续个性化推荐/服务
-- ============================================================

-- 新增 owner_id 字段，关联到认证店主
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores(owner_id);

-- RLS：用户仅可查看/编辑自己提交的店铺（管理员页用 service_role 不受影响）
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner manage own store" ON stores;
CREATE POLICY "Owner manage own store"
  ON stores FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

COMMENT ON COLUMN stores.owner_id IS '认证店主用户ID（小程序提交归属）';

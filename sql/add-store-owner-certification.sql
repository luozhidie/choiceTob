-- ============================================================
-- 认证店主（store owner certification）Schema
-- 目的：新增免费「认证店主」链路，与付费价格会员并存；
--       认证收集的数据同步到 store_owner_certifications 用于后端店铺管理数据积累。
-- ============================================================

-- 1) profiles 表追加认证字段
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS store_owner_certified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS certified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS certified_style TEXT,             -- 常拿风格
  ADD COLUMN IF NOT EXISTS certified_monthly_sales INTEGER;  -- 上月销售额（分）

COMMENT ON COLUMN profiles.store_owner_certified IS '是否通过认证店主（免费看批发价）';
COMMENT ON COLUMN profiles.certified_style       IS '认证时填写的常拿风格';
COMMENT ON COLUMN profiles.certified_monthly_sales IS '认证时填写的上月销售额（分）';

-- 2) 认证店铺数据积累表（后端店铺管理 / 数据分析用）
CREATE TABLE IF NOT EXISTS store_owner_certifications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_passed    BOOLEAN NOT NULL DEFAULT FALSE,
  style          TEXT,                 -- 常拿风格
  monthly_sales  INTEGER,              -- 上月销售额（分）
  region         TEXT,                 -- 店铺所在城市/地区（可选）
  certified_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soc_user      ON store_owner_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_soc_certified ON store_owner_certifications(certified_at DESC);

ALTER TABLE store_owner_certifications ENABLE ROW LEVEL SECURITY;

-- 用户仅可写自己的
DROP POLICY IF EXISTS "Users insert own cert" ON store_owner_certifications;
CREATE POLICY "Users insert own cert"
  ON store_owner_certifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 用户仅可查看自己的
DROP POLICY IF EXISTS "Users view own cert" ON store_owner_certifications;
CREATE POLICY "Users view own cert"
  ON store_owner_certifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

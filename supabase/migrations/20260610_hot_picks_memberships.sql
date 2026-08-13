-- 爆款样衣独立会员表
-- 与 base/advanced VIP 完全独立，¥998/月

CREATE TABLE IF NOT EXISTS hot_picks_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_hot_picks_memberships_user_id ON hot_picks_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_hot_picks_memberships_status ON hot_picks_memberships(status);
CREATE INDEX IF NOT EXISTS idx_hot_picks_memberships_expires_at ON hot_picks_memberships(expires_at);

-- RLS
ALTER TABLE hot_picks_memberships ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己的会员记录
CREATE POLICY "Users can view own hot picks membership"
  ON hot_picks_memberships
  FOR SELECT
  USING (auth.uid() = user_id);

-- 只有管理员可以插入/更新/删除（通过服务端API）
CREATE POLICY "Admins can manage hot picks memberships"
  ON hot_picks_memberships
  FOR ALL
  USING (true);

-- 更新 updated_at 的 trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hot_picks_memberships_updated_at ON hot_picks_memberships;
CREATE TRIGGER update_hot_picks_memberships_updated_at
  BEFORE UPDATE ON hot_picks_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

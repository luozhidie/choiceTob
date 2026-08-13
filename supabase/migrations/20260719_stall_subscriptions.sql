-- ============================================================
-- 20260719 档口订阅服务端持久化
-- 用途：替换/补充原来纯本地的 subscribed_stalls，
--       按微信 openid 关联，跨手机保留订阅状态
-- 请在 Supabase SQL Editor 执行（接在 20260718_peer_stalls 之后）
-- ============================================================

CREATE TABLE IF NOT EXISTS stall_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid TEXT NOT NULL,                -- 微信 openid（wx.login 获取，稳定且跨手机）
  stall_id UUID NOT NULL REFERENCES peer_stalls(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (openid, stall_id)            -- 同一用户对同一档口只订阅一次
);

COMMENT ON TABLE stall_subscriptions IS '用户对档口的订阅（服务端持久化，跨手机保留）';
COMMENT ON COLUMN stall_subscriptions.openid IS '微信 openid（app.getOpenid() 获取）';

CREATE INDEX IF NOT EXISTS idx_stall_subscriptions_openid ON stall_subscriptions(openid);
CREATE INDEX IF NOT EXISTS idx_stall_subscriptions_stall ON stall_subscriptions(stall_id);

-- 行级安全：写操作走 service_role 后台 API；读仅用于本人查询（openid 由客户端传入）
ALTER TABLE stall_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读取订阅" ON stall_subscriptions;
CREATE POLICY "公开读取订阅" ON stall_subscriptions
  FOR SELECT USING (true);

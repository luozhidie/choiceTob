-- 扩展 profiles 表，支持微信小程序登录
-- 执行方式：在 Supabase SQL Editor 里运行

-- 1. 添加微信相关字段
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wx_openid TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS wx_unionid TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. 给 wx_openid 加索引（加速查询）
CREATE INDEX IF NOT EXISTS idx_profiles_wx_openid ON profiles(wx_openid);

-- 3. 允许 wx_openid 为 NULL（老用户没有）
-- 不需要 NOT NULL 约束，因为邮箱注册的用户没有 openid

-- 4. 验证
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('wx_openid', 'wx_unionid', 'avatar_url');

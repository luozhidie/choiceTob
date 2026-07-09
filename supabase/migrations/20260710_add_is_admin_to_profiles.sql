-- 为 profiles 表增加管理员标识字段，用于控制小程序「一键导入」等管理功能的显示与权限
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 可选：为已知管理员邮箱设置管理员权限（请确认该邮箱在 profiles 表中存在）
-- UPDATE profiles SET is_admin = true WHERE email = 'luozhidie@live.cn';

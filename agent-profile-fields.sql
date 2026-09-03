-- ============================================================
-- 权益中心代理人资料扩展
-- 新增 nickname / agent_store_name / wechat / bio
-- avatar_url 与 phone 已存在，无需新增
-- 执行环境：Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agent_store_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wechat TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 旧用户兼容：昵称默认回填真实姓名，避免权益中心空白
UPDATE public.profiles
SET nickname = full_name
WHERE (nickname IS NULL OR nickname = '') AND full_name IS NOT NULL AND full_name <> '';

-- 便于后台按昵称/店铺名检索（小表可选）
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_agent_store_name ON public.profiles(agent_store_name);

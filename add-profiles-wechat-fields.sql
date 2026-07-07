-- ================================================================
-- 补充 profiles 表缺失的微信登录/认证相关字段
-- 在 Supabase SQL Editor 中执行
-- ================================================================

-- 微信小程序相关
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wechat_openid TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wechat_unionid TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON public.profiles(wechat_openid) WHERE wechat_openid IS NOT NULL;

-- 认证店主相关
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_owner_certified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certified_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certified_style TEXT;

-- 月销售额（认证时填写）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certified_monthly_sales INTEGER DEFAULT 0;

-- 登录时间记录
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- 头像
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 验证 profiles 字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND schema_name = 'public'
AND column_name IN ('wechat_openid','wechat_unionid','store_owner_certified','certified_at','certified_style','certified_monthly_sales','last_login_at','avatar_url')
ORDER BY ordinal_position;

-- ================================================================
-- 店主认证记录表（phone-login / certify 接口都会写入）
-- 如果表不存在则创建
-- ================================================================
CREATE TABLE IF NOT EXISTS public.store_owner_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_passed BOOLEAN DEFAULT false,
  style TEXT,
  monthly_sales INTEGER,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_user ON public.store_owner_certifications(user_id);

-- 验证
SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename='store_owner_certifications';

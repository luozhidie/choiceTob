-- ============================================================
-- 骆芷蝶智选 · 一次性执行 SQL（2026-08-14）
-- 在 Supabase Dashboard → SQL Editor 整段粘贴执行一次即可
-- 包含：① 代理充值建表  ② 试衣套餐规范化  ③ 形象管理服务表
-- ============================================================

-- ============================================================
-- ① 代理/预存货款充值体系（修复充值不到账）
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wechat_openid TEXT,
  ADD COLUMN IF NOT EXISTS wx_openid TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON public.profiles(wechat_openid) WHERE wechat_openid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_wx_openid ON public.profiles(wx_openid) WHERE wx_openid IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.agent_recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE,
  openid TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL,
  product_title TEXT,
  amount INTEGER NOT NULL,
  deposit_amount INTEGER NOT NULL,
  discount_rate DECIMAL(3,2) DEFAULT 1.00,
  return_rate DECIMAL(3,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  paid_at TIMESTAMPTZ,
  transaction_id TEXT,
  platform TEXT DEFAULT 'mini',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_recharges_order_no ON public.agent_recharges(order_no);
CREATE INDEX IF NOT EXISTS idx_agent_recharges_openid ON public.agent_recharges(openid);
CREATE INDEX IF NOT EXISTS idx_agent_recharges_status ON public.agent_recharges(status);
ALTER TABLE public.agent_recharges ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='agent_recharges' AND policyname='Service role can manage agent recharges') THEN
    CREATE POLICY "Service role can manage agent recharges" ON public.agent_recharges FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deposit_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_discount_rate DECIMAL(3,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS deposit_return_rate DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'none' CHECK (membership_type IN ('none', 'view_price', 'deposit_discount'));

-- ============================================================
-- ② 虚拟试衣套餐规格规范化（新规格：首单9.9/10次、月卡99/120次、季卡199/280次、年卡699/1000次）
-- ============================================================
UPDATE public.tryon_entitlements
SET
  normal_left = CASE type WHEN 'first' THEN 10 WHEN 'month' THEN 120 WHEN 'quarter' THEN 280 WHEN 'year' THEN 1000 ELSE normal_left END,
  pro_left = 0,
  tries_left = CASE type WHEN 'first' THEN 10 WHEN 'month' THEN 120 WHEN 'quarter' THEN 280 WHEN 'year' THEN 1000 ELSE tries_left END,
  updated_at = now()
WHERE type IN ('first','month','quarter','year');

-- 【可选】旧类型(normal_month/pro_month/pro_year)映射到新规格，确认后再取消注释执行
-- UPDATE public.tryon_entitlements
-- SET type = CASE type WHEN 'normal_month' THEN 'month' WHEN 'pro_month' THEN 'quarter' WHEN 'pro_year' THEN 'year' ELSE type END,
--     normal_left = CASE type WHEN 'normal_month' THEN 120 WHEN 'pro_month' THEN 280 WHEN 'pro_year' THEN 1000 ELSE normal_left END,
--     pro_left = 0,
--     tries_left = CASE type WHEN 'normal_month' THEN 120 WHEN 'pro_month' THEN 280 WHEN 'pro_year' THEN 1000 ELSE tries_left END,
--     updated_at = now()
-- WHERE type IN ('normal_month','pro_month','pro_year');

-- ============================================================
-- ③ 形象管理服务（toC）MVP
-- ============================================================

-- 3.1 用户形象档案（色彩季型 / 风格 / 身材 / 尺码 / 场合）
CREATE TABLE IF NOT EXISTS public.style_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  openid TEXT,
  season_type TEXT,                       -- 12 色彩季型代码，如 'light_spring'
  season_name TEXT,                       -- 中文名，如 '浅春型'
  style_tags TEXT[],                       -- 风格标签，如 {'natural','elegant'}
  body_type TEXT,                          -- 身材特点描述
  height INT,
  weight INT,
  sizes JSONB DEFAULT '{}'::jsonb,         -- 尺码 {top:'M',bottom:'L',shoe:38}
  occasions TEXT[],                        -- 场合偏好 {'work','date','travel','social'}
  full_body_photo TEXT,                    -- 全身照 URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_style_profiles_openid ON public.style_profiles(openid);
CREATE INDEX IF NOT EXISTS idx_style_profiles_user ON public.style_profiles(user_id);
ALTER TABLE public.style_profiles ADD CONSTRAINT IF NOT EXISTS uni_style_profiles_openid UNIQUE (openid);
ALTER TABLE public.style_profiles ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='style_profiles' AND policyname='Service role can manage style_profiles') THEN
    CREATE POLICY "Service role can manage style_profiles" ON public.style_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3.2 我的衣橱（用户上传的自己的衣服 / 配饰 / 鞋 / 包）
CREATE TABLE IF NOT EXISTS public.user_closet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  openid TEXT,
  image_url TEXT NOT NULL,
  category TEXT,                           -- top / bottom / shoes / bag / accessory
  color TEXT,                              -- 主色
  style_tags TEXT[],
  season_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_closet_openid ON public.user_closet(openid);
CREATE INDEX IF NOT EXISTS idx_user_closet_user ON public.user_closet(user_id);
ALTER TABLE public.user_closet ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_closet' AND policyname='Service role can manage user_closet') THEN
    CREATE POLICY "Service role can manage user_closet" ON public.user_closet FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

SELECT 'all migrations applied (agent_recharge + tryon specs + style_profiles + user_closet)' AS result;

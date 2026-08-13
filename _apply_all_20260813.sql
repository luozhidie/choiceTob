-- ============================================================
-- 2026-08-13 一次性执行：代理充值建表 + 试衣套餐规范化
-- 在 Supabase Dashboard → SQL Editor 粘贴整段执行即可
-- ============================================================

-- ========== A. 代理/预存货款充值体系（必需，修复充值不到账） ==========

-- 1. 确保 profiles 表有微信 openid 字段（phone-login / wechat-login 两种体系并存）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS wechat_openid TEXT,
  ADD COLUMN IF NOT EXISTS wx_openid TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_wechat_openid ON public.profiles(wechat_openid) WHERE wechat_openid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_wx_openid ON public.profiles(wx_openid) WHERE wx_openid IS NOT NULL;

-- 2. 代理充值订单表：先写库再调微信支付，回调据此发放权益
CREATE TABLE IF NOT EXISTS public.agent_recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL UNIQUE,                 -- 外部订单号 out_trade_no
  openid TEXT,                                   -- 小程序/公众号 openid（支付回调依据）
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL,                         -- wholesale_5w / wholesale_10w / wholesale_30w / agent_test_cent
  product_title TEXT,                            -- 商品标题
  amount INTEGER NOT NULL,                       -- 实际支付金额（分）
  deposit_amount INTEGER NOT NULL,               -- 预存货款额度（分），与 amount 相同
  discount_rate DECIMAL(3,2) DEFAULT 1.00,       -- 对应折扣率：5w/10w=0.28，30w=0.26
  return_rate DECIMAL(3,2) DEFAULT 0,            -- 可退比例：5%=0.05，10%=0.10，20%=0.20
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  paid_at TIMESTAMPTZ,
  transaction_id TEXT,                           -- 微信支付订单号
  platform TEXT DEFAULT 'mini',                    -- mini / native / mp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_recharges_order_no ON public.agent_recharges(order_no);
CREATE INDEX IF NOT EXISTS idx_agent_recharges_openid ON public.agent_recharges(openid);
CREATE INDEX IF NOT EXISTS idx_agent_recharges_status ON public.agent_recharges(status);

-- 3. RLS：默认只允许 service_role/管理员操作；普通用户通过 API 间接访问
ALTER TABLE public.agent_recharges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agent_recharges' AND policyname = 'Service role can manage agent recharges'
  ) THEN
    CREATE POLICY "Service role can manage agent recharges"
      ON public.agent_recharges
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- 4. 确保 profiles 预存货款字段存在（user-auth-schema.sql 已包含，这里做安全补充）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deposit_amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_discount_rate DECIMAL(3,2) DEFAULT 1.00,
  ADD COLUMN IF NOT EXISTS deposit_return_rate DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'none' CHECK (membership_type IN ('none', 'view_price', 'deposit_discount'));

-- ========== B. 虚拟试衣套餐规格规范化（按新套餐 9.9/99/199/699） ==========
-- 新规格：首单 9.9/10次、月卡 99/120次、季卡 199/280次、年卡 699/1000次
-- 新套餐次数为“通用次数”，统一计入 normal_left，pro_left 清 0

-- 1) 规范新类型（按新套餐发放时已写入 type=first/month/quarter/year 的记录）
UPDATE public.tryon_entitlements
SET
  normal_left = CASE type
    WHEN 'first' THEN 10
    WHEN 'month' THEN 120
    WHEN 'quarter' THEN 280
    WHEN 'year' THEN 1000
    ELSE normal_left
  END,
  pro_left = 0,
  tries_left = CASE type
    WHEN 'first' THEN 10
    WHEN 'month' THEN 120
    WHEN 'quarter' THEN 280
    WHEN 'year' THEN 1000
    ELSE tries_left
  END,
  updated_at = now()
WHERE type IN ('first','month','quarter','year');

-- 2) 【可选】旧类型（normal_month/pro_month/pro_year）按金额映射到新规格
-- 注意：这会改变旧用户的有效期与剩余次数，请确认后再取消注释执行。
-- UPDATE public.tryon_entitlements
-- SET type = CASE type
--     WHEN 'normal_month' THEN 'month'
--     WHEN 'pro_month' THEN 'quarter'
--     WHEN 'pro_year' THEN 'year'
--     ELSE type
--   END,
--   normal_left = CASE type
--     WHEN 'normal_month' THEN 120
--     WHEN 'pro_month' THEN 280
--     WHEN 'pro_year' THEN 1000
--     ELSE normal_left
--   END,
--   pro_left = 0,
--   tries_left = CASE type
--     WHEN 'normal_month' THEN 120
--     WHEN 'pro_month' THEN 280
--     WHEN 'pro_year' THEN 1000
--     ELSE tries_left
--   END,
--   updated_at = now()
-- WHERE type IN ('normal_month','pro_month','pro_year');

SELECT 'all migrations applied (agent_recharge + tryon specs)' AS result;

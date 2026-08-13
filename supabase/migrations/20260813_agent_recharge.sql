-- ============================================================
-- 代理/预存货款充值体系 MVP
-- 用于修复小程序 deposit 页充值后不到账的问题
-- ============================================================

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
  plan_id TEXT NOT NULL,                         -- wholesale_5w / wholesale_10w / wholesale_30w
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

-- 管理员可读全部（实际通过 service_role 绕过 RLS，此处保留一个策略兜底）
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

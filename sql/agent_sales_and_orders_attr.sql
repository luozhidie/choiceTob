-- ============================================================
-- 销售代理「推广归因 + 自定义卖价 + 差价自动结算」
-- 商业模型（平台自动结算版）：
--   1) 代理(预存货款/认证店主)在工作台给商品设「对客卖价」(agent_product_prices)
--   2) 客户经代理专属链接下单，付代理设的卖价（界面隐藏批发价）
--   3) 平台发货（钱货两清：客户付款 → 平台发货）
--   4) 支付成功后，平台自动把(卖价 − 批发成本)的差价结算进代理可提现余额
--   批发成本 = 产品零售价(products.price) × 代理折扣率(profiles.deposit_discount_rate)
-- 适用：Supabase SQL Editor 手动执行
-- ============================================================

-- 1. orders 加归因 + 结算字段
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS agent_cost INTEGER DEFAULT 0,       -- 平台批发成本(分)=产品价×代理折扣率×数量
  ADD COLUMN IF NOT EXISTS agent_profit INTEGER DEFAULT 0,     -- 代理差价(分)=客户实付−批发成本
  ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'pending'
    CHECK (settlement_status IN ('pending', 'settled', 'failed'));

CREATE INDEX IF NOT EXISTS idx_orders_agent_id ON public.orders(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON public.orders(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_settlement ON public.orders(settlement_status) WHERE settlement_status = 'pending';

-- 2. 代理自定义卖价（对客价）
CREATE TABLE IF NOT EXISTS public.agent_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  custom_price INTEGER NOT NULL,           -- 对客卖价（分）
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (agent_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_app_agent_product ON public.agent_product_prices(agent_id, product_id);

-- 3. 代理提现申请（差价收益提现）
CREATE TABLE IF NOT EXISTS public.agent_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                 -- 提现金额（分）
  method TEXT DEFAULT 'wechat',            -- wechat / bank / manual
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_aw_agent ON public.agent_withdrawals(agent_id, created_at DESC);

-- 4. 代理推广码（复用 profiles.invite_code）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invite_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_invite_code ON public.profiles(invite_code) WHERE invite_code IS NOT NULL;

-- 5. 代理收益余额（user_wallet：已存在则跳过，并兜底补列）
CREATE TABLE IF NOT EXISTS public.user_wallet (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,      -- 可提现余额（分）
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_wallet ADD COLUMN IF NOT EXISTS balance INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.user_wallet ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. RLS：仅 service_role 操作，普通用户经 API 间接访问
ALTER TABLE public.agent_product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallet ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_product_prices' AND policyname = 'svc_agent_product_prices') THEN
    CREATE POLICY "svc_agent_product_prices" ON public.agent_product_prices FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_withdrawals' AND policyname = 'svc_agent_withdrawals') THEN
    CREATE POLICY "svc_agent_withdrawals" ON public.agent_withdrawals FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_wallet' AND policyname = 'svc_user_wallet') THEN
    CREATE POLICY "svc_user_wallet" ON public.user_wallet FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END
$$;

COMMENT ON COLUMN public.orders.agent_id IS '归因代理用户ID';
COMMENT ON COLUMN public.orders.agent_cost IS '平台批发成本(分)=产品零售价×代理折扣率×数量';
COMMENT ON COLUMN public.orders.agent_profit IS '代理差价(分)=客户实付−批发成本';
COMMENT ON COLUMN public.agent_product_prices.custom_price IS '代理给客户设的卖价(分)';
COMMENT ON COLUMN public.user_wallet.balance IS '代理可提现收益余额(分)';

-- ============================================================
-- 阶段0-4: 货款余额流水表 deposit_transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.deposit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  openid TEXT,
  type TEXT NOT NULL CHECK (type IN ('recharge','order_deduct','return','adjust')),
  amount INTEGER NOT NULL,            -- 正=进货款，负=扣减（分）
  balance_after INTEGER NOT NULL,     -- 变动后 deposit_amount
  ref_order_no TEXT,                  -- 关联 orders / agent_recharges
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_user ON public.deposit_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dt_openid ON public.deposit_transactions(openid, created_at DESC);

ALTER TABLE public.deposit_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'deposit_transactions'
      AND policyname = 'Service role can manage deposit_transactions'
  ) THEN
    CREATE POLICY "Service role can manage deposit_transactions"
      ON public.deposit_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.deposit_transactions IS '预存货款余额变动流水（充值/下单抵扣/退货/调整）';

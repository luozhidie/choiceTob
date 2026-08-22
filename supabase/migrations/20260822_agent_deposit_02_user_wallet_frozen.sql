-- ============================================================
-- 阶段0-2: user_wallet 加冻结余额（待结算佣金）
-- ============================================================

ALTER TABLE public.user_wallet
  ADD COLUMN IF NOT EXISTS frozen_balance INTEGER NOT NULL DEFAULT 0;  -- 待结算冻结（分），发货后转 balance

COMMENT ON COLUMN public.user_wallet.frozen_balance IS '待结算冻结佣金(分)，订单发货后转入 balance';

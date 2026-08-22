-- ============================================================
-- 阶段0-7: agent_withdrawals 扩展列（类型/银行卡/个税/到账/驳回）
-- ============================================================

ALTER TABLE public.agent_withdrawals
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'commission' CHECK (type IN ('commission')),
  ADD COLUMN IF NOT EXISTS bank_card_id UUID REFERENCES public.user_bank_cards(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expected_arrival_at TIMESTAMPTZ,     -- 预计到账时间（工作日）
  ADD COLUMN IF NOT EXISTS tax_deducted INTEGER DEFAULT 0,      -- 应扣个税（分）
  ADD COLUMN IF NOT EXISTS actual_paid INTEGER DEFAULT 0,       -- 实发（分）
  ADD COLUMN IF NOT EXISTS reject_reason TEXT;

COMMENT ON COLUMN public.agent_withdrawals.type IS '提现类型：仅佣金 commission';
COMMENT ON COLUMN public.agent_withdrawals.bank_card_id IS '绑定的银行卡';
COMMENT ON COLUMN public.agent_withdrawals.expected_arrival_at IS '预计到账时间（工作日口径）';
COMMENT ON COLUMN public.agent_withdrawals.tax_deducted IS '应扣个税(分)';
COMMENT ON COLUMN public.agent_withdrawals.actual_paid IS '实际打款金额(分)';
COMMENT ON COLUMN public.agent_withdrawals.reject_reason IS '驳回原因';

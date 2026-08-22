-- ============================================================
-- 阶段0-5: 银行卡表 user_bank_cards
-- 说明：全卡号由应用层 AES-256-GCM 加密后存 card_no_enc；
--       前端只展示后4位 + 银行名 + 持卡人（脱敏）。
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_bank_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name TEXT,
  account_name TEXT,                  -- 持卡人姓名（属本人信息，直接存）
  card_no_last4 TEXT NOT NULL,        -- 仅后4位
  card_no_enc TEXT NOT NULL,          -- 加密全卡号（应用层 AES-256-GCM）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ubc_user ON public.user_bank_cards(user_id, created_at DESC);

ALTER TABLE public.user_bank_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_bank_cards'
      AND policyname = 'Service role can manage user_bank_cards'
  ) THEN
    CREATE POLICY "Service role can manage user_bank_cards"
      ON public.user_bank_cards FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.user_bank_cards IS '代理提现绑定银行卡（全卡号应用层加密）';

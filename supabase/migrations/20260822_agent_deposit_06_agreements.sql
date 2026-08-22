-- ============================================================
-- 阶段0-6: 协议签约表 agreements（版本化落库）
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_key TEXT NOT NULL,        -- 如 'pre_deposit'
  version TEXT NOT NULL,              -- 如 'v1'
  content_hash TEXT,                  -- 签约时协议文本 sha256，便于比对版本漂移
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, agreement_key, version)
);

CREATE INDEX IF NOT EXISTS idx_agr_user ON public.agreements(user_id, agreement_key);

ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'agreements'
      AND policyname = 'Service role can manage agreements'
  ) THEN
    CREATE POLICY "Service role can manage agreements"
      ON public.agreements FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

COMMENT ON TABLE public.agreements IS '用户协议签约记录（版本化）';

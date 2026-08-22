-- ============================================================
-- 阶段0-1: profiles 扩列（支付密码 / 协议签约 / 充值会员拦截）
-- 在 Supabase Dashboard → SQL Editor 执行（幂等可重跑）
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_password_hash TEXT,            -- bcrypt 哈希，绝不存明文
  ADD COLUMN IF NOT EXISTS pre_deposit_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pre_deposit_agreed_version TEXT,       -- 如 'v1'
  ADD COLUMN IF NOT EXISTS pre_deposit_agreed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.payment_password_hash IS '货款抵扣支付密码哈希(bcrypt)，非明文';
COMMENT ON COLUMN public.profiles.pre_deposit_agreed IS '是否已签署《预充货款协议》';
COMMENT ON COLUMN public.profiles.pre_deposit_agreed_version IS '签约协议版本';
COMMENT ON COLUMN public.profiles.pre_deposit_agreed_at IS '签约时间';

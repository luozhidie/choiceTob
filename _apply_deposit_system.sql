-- ============================================================
-- 代理预存货款系统：阶段0 合并迁移（复制本文件全部内容到 Supabase Dashboard → SQL Editor 执行）
-- 幂等可重跑。执行后请确认表/列已建：
--   profiles.payment_password_hash / pre_deposit_agreed*
--   user_wallet.frozen_balance
--   agent_recharges.tryon_fee / deposit_granted / tryon_granted / deposit_granted_flag / agreement_version
--   deposit_transactions / user_bank_cards / agreements
--   agent_withdrawals.type / bank_card_id / expected_arrival_at / tax_deducted / actual_paid / reject_reason
--   orders 触发器 trg_confirm_settlement
-- ============================================================

-- ------------------------------------------------------------
-- 来源: supabase/migrations/20260822_agent_deposit_01_profiles.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 来源: supabase/migrations/20260822_agent_deposit_02_user_wallet_frozen.sql
-- ------------------------------------------------------------
-- ============================================================
-- 阶段0-2: user_wallet 加冻结余额（待结算佣金）
-- ============================================================

ALTER TABLE public.user_wallet
  ADD COLUMN IF NOT EXISTS frozen_balance INTEGER NOT NULL DEFAULT 0;  -- 待结算冻结（分），发货后转 balance

COMMENT ON COLUMN public.user_wallet.frozen_balance IS '待结算冻结佣金(分)，订单发货后转入 balance';

-- ------------------------------------------------------------
-- 来源: supabase/migrations/20260822_agent_deposit_03_agent_recharges_columns.sql
-- ------------------------------------------------------------
-- ============================================================
-- 阶段0-3: agent_recharges 加幂等 / 试衣费 / 实际货款列
-- 说明：wholesale_6k 充值 600000 分，其中 99800 扣作试衣费，
--       实际进货款 = 500200 分（其他套餐全额进货款、不发试衣）
-- ============================================================

ALTER TABLE public.agent_recharges
  ADD COLUMN IF NOT EXISTS tryon_fee INTEGER DEFAULT 0,           -- 本单扣的试衣费（分），如 99800
  ADD COLUMN IF NOT EXISTS deposit_granted INTEGER DEFAULT 0,     -- 实际进货款余额的金额（分），如 500200
  ADD COLUMN IF NOT EXISTS tryon_granted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deposit_granted_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS agreement_version TEXT;               -- 下单时签的协议版本

COMMENT ON COLUMN public.agent_recharges.tryon_fee IS '本单扣除的虚拟试衣费(分)';
COMMENT ON COLUMN public.agent_recharges.deposit_granted IS '实际发放到货款余额的金额(分)';
COMMENT ON COLUMN public.agent_recharges.tryon_granted IS '试衣权益是否已发放(幂等)';
COMMENT ON COLUMN public.agent_recharges.deposit_granted_flag IS '货款是否已发放(幂等)';
COMMENT ON COLUMN public.agent_recharges.agreement_version IS '下单时签署的预充货款协议版本';

-- ------------------------------------------------------------
-- 来源: supabase/migrations/20260822_agent_deposit_04_deposit_transactions.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 来源: supabase/migrations/20260822_agent_deposit_05_user_bank_cards.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 来源: supabase/migrations/20260822_agent_deposit_06_agreements.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 来源: supabase/migrations/20260822_agent_deposit_07_agent_withdrawals_columns.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 来源: supabase/migrations/20260822_agent_deposit_08_settlement_trigger.sql
-- ------------------------------------------------------------
-- ============================================================
-- 阶段0-8: 结算状态枚举扩展 + 发货自动确认结算（DB 触发器兜底）
-- 逻辑：订单标记 shipped/completed 且 settlement_status='frozen' 时，
--       把该单代理差价从 user_wallet.frozen_balance 转入 balance，
--       并置 settlement_status='settled'。幂等（已 settled 跳过）。
-- ============================================================

-- 1. 扩展 settlement_status 枚举，新增 'frozen'
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_settlement_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_settlement_status_check
    CHECK (settlement_status IN ('pending', 'frozen', 'settled', 'failed'));

-- 2. 结算确认函数
CREATE OR REPLACE FUNCTION public.confirm_order_settlement()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_id UUID;
  v_profit INTEGER;
  v_status TEXT;
BEGIN
  -- 仅当状态变为已发货/已完成 且 当前是 frozen 待结算
  IF (NEW.status IN ('shipped', 'completed')) AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT agent_id, agent_profit, settlement_status
      INTO v_agent_id, v_profit, v_status
    FROM public.orders
    WHERE id = NEW.id;

    IF v_agent_id IS NOT NULL AND v_profit > 0 AND v_status = 'frozen' THEN
      -- 冻结 → 可提现
      UPDATE public.user_wallet
        SET frozen_balance = GREATEST(0, frozen_balance - v_profit),
            balance = balance + v_profit,
            updated_at = NOW()
      WHERE user_id = v_agent_id;

      UPDATE public.orders
        SET settlement_status = 'settled'
      WHERE id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 触发器（覆盖所有修改 orders.status 的入口：小程序 [id] 接口、后台、未来其他）
DROP TRIGGER IF EXISTS trg_confirm_settlement ON public.orders;

CREATE TRIGGER trg_confirm_settlement
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.confirm_order_settlement();

COMMENT ON FUNCTION public.confirm_order_settlement() IS '订单发货后自动把冻结佣金转入可提现余额';

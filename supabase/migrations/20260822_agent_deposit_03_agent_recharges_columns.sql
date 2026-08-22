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

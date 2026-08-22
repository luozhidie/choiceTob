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

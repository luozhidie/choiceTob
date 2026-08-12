-- ============================================================
-- 销售代理 MVP 数据模型迁移
-- 骆芷蝶·智选 · 代理买手商业闭环
-- 手动在 Supabase Dashboard → SQL Editor 执行（一次即可）
-- ============================================================

-- ───────────────────────────────────────────────────────────
-- 1) profiles 扩展：代理 / 批发 / 试衣 字段
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_sales_agent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_tier text NOT NULL DEFAULT 'none',          -- none | basic_5w | pro_10w | brand_30w
  ADD COLUMN IF NOT EXISTS agent_store_id uuid,                              -- -> stores.id
  ADD COLUMN IF NOT EXISTS wholesale_enabled boolean NOT NULL DEFAULT false, -- 批发价可见
  ADD COLUMN IF NOT EXISTS return_rate numeric NOT NULL DEFAULT 0,           -- 退换额度 % (5 / 10 / 20)
  ADD COLUMN IF NOT EXISTS agent_discount numeric NOT NULL DEFAULT 1.0,      -- 充值档折扣 (0.28 / 0.26 / 1.0)
  ADD COLUMN IF NOT EXISTS cumulative_order_amount numeric NOT NULL DEFAULT 0, -- 累计订单金额（成长等级用，销售驱动）
  ADD COLUMN IF NOT EXISTS agent_level text NOT NULL DEFAULT '普通',         -- 普通 | 白银 | 黄金 | 钻石
  ADD COLUMN IF NOT EXISTS tryon_credits integer NOT NULL DEFAULT 0,         -- 剩余试衣次数
  ADD COLUMN IF NOT EXISTS tryon_subscription_tier text NOT NULL DEFAULT 'none', -- none | personal_basic | personal_pro | shop | brand
  ADD COLUMN IF NOT EXISTS tryon_subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS tryon_free_claimed boolean NOT NULL DEFAULT false; -- 是否已领免费试用（前100名）

-- 代理店铺 FK
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_agent_store_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_agent_store_id_fkey
  FOREIGN KEY (agent_store_id) REFERENCES public.stores(id) ON DELETE SET NULL;

-- ───────────────────────────────────────────────────────────
-- 2) agent_recharges：充值即代理记录
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_recharges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,                 -- 50000 / 100000 / 300000
  tier text NOT NULL,                      -- basic_5w / pro_10w / brand_30w
  return_rate numeric NOT NULL DEFAULT 0,  -- 5 / 10 / 20
  agent_discount numeric NOT NULL DEFAULT 1.0,
  wholesale_enabled boolean NOT NULL DEFAULT true,
  payment_id text,                         -- 微信 out_trade_no
  status text NOT NULL DEFAULT 'pending',  -- pending / paid
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_agent_recharges_user ON public.agent_recharges(user_id);

-- ───────────────────────────────────────────────────────────
-- 3) tryon_subscriptions：虚拟试衣月卡
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tryon_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier text NOT NULL,                      -- personal_basic / personal_pro / shop / brand
  price numeric NOT NULL,
  credits_total integer NOT NULL,
  credits_used integer NOT NULL DEFAULT 0,
  credits_remaining integer NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',   -- active / expired
  payment_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tryon_subs_user ON public.tryon_subscriptions(user_id);

-- ───────────────────────────────────────────────────────────
-- 4) tryon_credit_log：试衣次数消耗日志
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tryon_credit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.tryon_subscriptions(id) ON DELETE SET NULL,
  amount integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tryon_log_user ON public.tryon_credit_log(user_id);

-- ───────────────────────────────────────────────────────────
-- 5) 等级 / 折扣 计算函数
-- ───────────────────────────────────────────────────────────
-- 成长等级：按累计订单金额
CREATE OR REPLACE FUNCTION public.calc_agent_level(cum numeric)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF cum >= 300000 THEN RETURN '钻石';
  ELSIF cum >= 100000 THEN RETURN '黄金';
  ELSIF cum >= 50000 THEN RETURN '白银';
  ELSE RETURN '普通';
  END IF;
END;
$$;

-- 等级折扣：白银 & 黄金 2.8折，钻石 2.6折，普通无
CREATE OR REPLACE FUNCTION public.calc_level_discount(cum numeric)
RETURNS numeric LANGUAGE plpgsql AS $$
BEGIN
  IF cum >= 300000 THEN RETURN 0.26;
  ELSIF cum >= 50000 THEN RETURN 0.28;   -- 白银、黄金 同 2.8折
  ELSE RETURN 1.0;                       -- 普通 无折扣
  END IF;
END;
$$;

-- 有效折扣 = 充值档折扣 与 等级折扣 取更优（更小）
CREATE OR REPLACE FUNCTION public.effective_agent_discount(
  p_agent_discount numeric, p_cum numeric
) RETURNS numeric LANGUAGE plpgsql AS $$
DECLARE
  lvl numeric;
BEGIN
  lvl := public.calc_level_discount(p_cum);
  RETURN LEAST(COALESCE(p_agent_discount, 1.0), lvl);
END;
$$;

-- 订单完成后累加累计金额并重算等级（在订单成功回调中调用）
CREATE OR REPLACE FUNCTION public.bump_agent_level(p_user_id uuid, p_amount numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET cumulative_order_amount = cumulative_order_amount + p_amount,
      agent_level = public.calc_agent_level(cumulative_order_amount + p_amount)
  WHERE id = p_user_id;
END;
$$;

-- ───────────────────────────────────────────────────────────
-- 6) 充值成功落地（供 /api/wechat-pay/notify 调用）
--    充值档 → 代理身份 + 自动开店 + 批发价 + 退换额度
--    注意：累计订单金额 / 等级 由销售订单驱动，不在此处改动
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_agent_recharge(
  p_user_id uuid,
  p_amount numeric,
  p_out_trade_no text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tier text;
  v_return numeric;
  v_discount numeric;
  v_store_id uuid;
  v_profile public.profiles%ROWTYPE;
  v_store_name text;
BEGIN
  -- 档位映射（5万 / 10万 / 30万）
  IF p_amount >= 300000 THEN v_tier := 'brand_30w'; v_return := 20; v_discount := 0.26;
  ELSIF p_amount >= 100000 THEN v_tier := 'pro_10w'; v_return := 10; v_discount := 0.28;
  ELSIF p_amount >= 50000 THEN v_tier := 'basic_5w'; v_return := 5; v_discount := 0.28;
  ELSE v_tier := 'none'; v_return := 0; v_discount := 1.0;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user not found');
  END IF;

  -- 自动开店（仅首次；失败不阻断代理授权）
  IF v_profile.agent_store_id IS NULL THEN
    v_store_name := COALESCE(v_profile.full_name, '代理') || '的店';
    BEGIN
      INSERT INTO public.stores(name, source)
      VALUES (v_store_name, 'auto_agent_recharge')
      RETURNING id INTO v_store_id;
    EXCEPTION WHEN OTHERS THEN
      v_store_id := NULL;
    END;
  ELSE
    v_store_id := v_profile.agent_store_id;
  END IF;

  -- 写入充值记录
  INSERT INTO public.agent_recharges(
    user_id, amount, tier, return_rate, agent_discount, wholesale_enabled, payment_id, status, paid_at
  ) VALUES (
    p_user_id, p_amount, v_tier, v_return, v_discount, true, p_out_trade_no, 'paid', now()
  );

  -- 更新 profiles（充值档权益；累计金额/等级不动）
  UPDATE public.profiles SET
    is_sales_agent = true,
    agent_tier = v_tier,
    agent_store_id = v_store_id,
    wholesale_enabled = true,
    return_rate = GREATEST(return_rate, v_return),
    agent_discount = LEAST(agent_discount, v_discount)
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'ok', true, 'tier', v_tier, 'store_id', v_store_id,
    'return_rate', v_return, 'discount', v_discount
  );
END;
$$;

-- ───────────────────────────────────────────────────────────
-- 7) RLS：后端用 service_role 绕过；此处给 service_role 全权
-- ───────────────────────────────────────────────────────────
ALTER TABLE public.agent_recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryon_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tryon_credit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_agent_recharges" ON public.agent_recharges;
CREATE POLICY "service_role_all_agent_recharges" ON public.agent_recharges
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_tryon_subscriptions" ON public.tryon_subscriptions;
CREATE POLICY "service_role_all_tryon_subscriptions" ON public.tryon_subscriptions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all_tryon_credit_log" ON public.tryon_credit_log;
CREATE POLICY "service_role_all_tryon_credit_log" ON public.tryon_credit_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ───────────────────────────────────────────────────────────
-- 6.5) payment_orders：统一下单的待支付跟踪（notify 靠它识别商品）
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  out_trade_no text UNIQUE NOT NULL,
  user_openid text,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  product_type text NOT NULL,   -- wholesale | tryon | vip | product
  product_id text,
  amount_fen integer NOT NULL,  -- 微信金额（分）
  amount_yuan numeric NOT NULL, -- 元
  status text NOT NULL DEFAULT 'pending', -- pending | paid | failed
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_payment_orders_no ON public.payment_orders(out_trade_no);

-- ───────────────────────────────────────────────────────────
-- 6.6) 试衣月卡落地
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_tryon_subscription(
  p_user_id uuid, p_tier text, p_price numeric, p_credits integer, p_out_trade_no text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
  v_expires timestamptz;
BEGIN
  v_expires := now() + interval '1 month';
  INSERT INTO public.tryon_subscriptions(
    user_id, tier, price, credits_total, credits_remaining, expires_at, payment_id, status
  ) VALUES (
    p_user_id, p_tier, p_price, p_credits, p_credits, v_expires, p_out_trade_no, 'active'
  ) RETURNING id INTO v_id;

  UPDATE public.profiles SET
    tryon_credits = tryon_credits + p_credits,
    tryon_subscription_tier = p_tier,
    tryon_subscription_expires_at = v_expires
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'subscription_id', v_id, 'expires_at', v_expires);
END;
$$;

-- 试衣次数扣减（返回剩余；不足返回 false）
CREATE OR REPLACE FUNCTION public.consume_tryon_credit(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_remaining integer;
  v_sub_id uuid;
BEGIN
  SELECT id INTO v_sub_id FROM public.tryon_subscriptions
  WHERE user_id = p_user_id AND status = 'active' AND expires_at > now()
  ORDER BY expires_at ASC LIMIT 1;

  IF v_sub_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_active_subscription');
  END IF;

  SELECT credits_remaining INTO v_remaining FROM public.tryon_subscriptions WHERE id = v_sub_id;
  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_credits');
  END IF;

  UPDATE public.tryon_subscriptions
  SET credits_remaining = credits_remaining - 1, credits_used = credits_used + 1
  WHERE id = v_sub_id;

  UPDATE public.profiles SET tryon_credits = GREATEST(tryon_credits - 1, 0) WHERE id = p_user_id;

  INSERT INTO public.tryon_credit_log(user_id, subscription_id, amount)
  VALUES (p_user_id, v_sub_id, 1);

  RETURN jsonb_build_object('ok', true, 'remaining', v_remaining - 1);
END;
$$;

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_payment_orders" ON public.payment_orders;
CREATE POLICY "service_role_all_payment_orders" ON public.payment_orders
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ───────────────────────────────────────────────────────────
-- 8) 免费试用：前 100 名每人 1 次虚拟试衣
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tryon_free_trials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tryon_free_trials_user ON public.tryon_free_trials(user_id);
CREATE INDEX IF NOT EXISTS idx_tryon_free_trials_created ON public.tryon_free_trials(created_at);

-- 领取免费试用（限前 100 名，每人 1 次）
-- 并发极小可忽略；如要绝对严格可加 advisory lock
CREATE OR REPLACE FUNCTION public.claim_tryon_free_trial(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int;
  v_expires timestamptz;
  v_sub_id uuid;
BEGIN
  -- 已领取（每人 1 次）
  IF EXISTS (SELECT 1 FROM public.tryon_free_trials WHERE user_id = p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_claimed');
  END IF;

  -- 名额（前 100 名）
  SELECT count(*) INTO v_count FROM public.tryon_free_trials;
  IF v_count >= 100 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'sold_out', 'remaining', 0);
  END IF;

  -- 落领取记录
  INSERT INTO public.tryon_free_trials(user_id) VALUES (p_user_id);

  -- 发放 1 次免费额度：建一条 0 元试用订阅，复用 consume_tryon_credit 正常扣减
  v_expires := now() + interval '1 month';
  INSERT INTO public.tryon_subscriptions(
    user_id, tier, price, credits_total, credits_remaining, expires_at, payment_id, status
  ) VALUES (
    p_user_id, 'free_trial', 0, 1, 1, v_expires, 'free_trial', 'active'
  ) RETURNING id INTO v_sub_id;

  UPDATE public.profiles SET
    tryon_free_claimed = true,
    tryon_credits = tryon_credits + 1
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true, 'credits', 1, 'remaining', 100 - v_count - 1, 'subscription_id', v_sub_id);
END;
$$;

ALTER TABLE public.tryon_free_trials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all_tryon_free_trials" ON public.tryon_free_trials;
CREATE POLICY "service_role_all_tryon_free_trials" ON public.tryon_free_trials
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 完成提示
SELECT 'sales_agent_mvp migration applied' AS result;

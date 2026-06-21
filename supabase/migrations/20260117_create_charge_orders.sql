-- 创建充值订单表
CREATE TABLE IF NOT EXISTS public.charge_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  order_no TEXT UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  amount NUMERIC,
  discount_rate NUMERIC,
  actual_amount NUMERIC,
  payment_method TEXT,
  payment_proof TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'cancelled')),
  paid_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  remark TEXT,
  admin_remark TEXT,
  balance_before NUMERIC,
  balance_after NUMERIC
);

-- 启用 RLS
ALTER TABLE public.charge_orders ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有充值订单
CREATE POLICY "Admin can view all charge orders"
  ON public.charge_orders
  FOR SELECT
  USING (true);

-- 管理员可以更新充值订单
CREATE POLICY "Admin can update charge orders"
  ON public.charge_orders
  FOR UPDATE
  USING (true);

-- 用户可以创建充值订单
CREATE POLICY "Users can create charge orders"
  ON public.charge_orders
  FOR INSERT
  WITH CHECK (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_charge_orders_user_id ON public.charge_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_charge_orders_status ON public.charge_orders(status);
CREATE INDEX IF NOT EXISTS idx_charge_orders_created_at ON public.charge_orders(created_at DESC);

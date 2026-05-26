-- VIP会员订单表
CREATE TABLE IF NOT EXISTS membership_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,              -- basic / premium
  plan_name TEXT NOT NULL,
  price INTEGER NOT NULL,            -- 分
  payment_method TEXT,               -- wechat / alipay
  status TEXT DEFAULT 'pending',     -- pending(待确认) / confirmed(已开通) / cancelled(已取消)
  notes TEXT,                        -- 备注/转账单号
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE membership_orders ENABLE ROW LEVEL SECURITY;

-- 用户只能看自己的订单
CREATE POLICY "用户查看自己的订单" ON membership_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 管理员可读写
CREATE POLICY "管理员可读写" ON membership_orders
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- 用户可创建自己的订单
CREATE POLICY "用户可创建订单" ON membership_orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

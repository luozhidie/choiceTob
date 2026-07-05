-- ============================================================
-- 骆芷蝶智选 · 我的页面后端表结构
-- 在 Supabase Dashboard > SQL Editor 中执行
-- ============================================================

-- 【1】orders 表：我的订单
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_no TEXT UNIQUE NOT NULL,
  total_fee INTEGER NOT NULL,        -- 分单位
  status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('unpaid','toship','toreceive','aftersale')),
  items JSONB DEFAULT '[]',           -- [{product_id,title,price,quantity,image}]
  shipping_address JSONB,              -- {name,phone,address}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- RLS：用户只能看自己的订单
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "用户查看自己订单"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "用户创建订单"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 【2】user_wallet 表：我的钱包
CREATE TABLE IF NOT EXISTS user_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,             -- 分单位
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE user_wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "用户查看自己钱包"
  ON user_wallet FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 【3】coupons 表：我的卡券
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  discount_desc TEXT,               -- "满339减30" 等
  min_amount INTEGER DEFAULT 0,       -- 满多少元可用（分）
  discount_amount INTEGER DEFAULT 0,  -- 抵扣金额（分）
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused','used','expired')),
  expire_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_user ON coupons(user_id);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "用户查看自己卡券"
  ON coupons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 【4】red_packets 表：我的红包
CREATE TABLE IF NOT EXISTS red_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount INTEGER DEFAULT 0,           -- 分单位
  status TEXT DEFAULT 'unused' CHECK (status IN ('unused','used','expired')),
  expire_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_red_packets_user ON red_packets(user_id);
ALTER TABLE red_packets ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "用户查看自己红包"
  ON red_packets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- 完毕
-- ============================================================

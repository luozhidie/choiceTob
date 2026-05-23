-- 删除旧表（如果创建不完整）
DROP TABLE IF EXISTS orders;

-- 创建orders表
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_no TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  product_title TEXT,
  product_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,
  contact TEXT NOT NULL,
  address TEXT,
  note TEXT,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  payment_url TEXT,
  payment_qrcode TEXT,
  payment_trade_no TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 开启RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 策略
CREATE POLICY "Allow anon insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon select" ON orders FOR SELECT USING (true);
CREATE POLICY "Allow service role all" ON orders FOR ALL USING (true) WITH CHECK (true);

-- 索引
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

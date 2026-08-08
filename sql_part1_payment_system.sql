-- 第一段：支付系统表（粘贴后点 RUN）
-- 1. 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, user_name TEXT, user_phone TEXT,
  order_no TEXT UNIQUE NOT NULL DEFAULT 'PO' || to_char(NOW(), 'YYYYMMDDHH24MISS') || '_' || substr(md5(random()::text), 1, 8),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'CNY', subject TEXT NOT NULL, body TEXT,
  payment_method TEXT NOT NULL DEFAULT 'wxpay', product_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending', paid_at TIMESTAMP WITH TIME ZONE, closed_at TIMESTAMP WITH TIME ZONE, refund_at TIMESTAMP WITH TIME ZONE,
  third_party_order_no TEXT, third_party_prepay_id TEXT, notify_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLIY "Users can view own payment orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLIY "Users can insert own payment orders" ON payment_orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. 支付配置表
CREATE TABLE IF NOT EXISTS payment_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY, channel TEXT UNIQUE NOT NULL,
  app_id TEXT NOT NULL, mch_id TEXT, api_key TEXT, cert_serial_no TEXT, cert_private_key TEXT, alipay_public_key TEXT, app_cert_content TEXT,
  notify_url TEXT, return_url TEXT, is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
CREATE POLIY "Only admins can access payment config" ON payment_config FOR ALL USING (false);

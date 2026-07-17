-- 20260718 补齐优惠券/红包表
-- 说明：后台已有发放功能，但此前 migrations 缺少 coupons 和 red_packets 建表语句，
--       导致发放后无记录。这里补齐，并保留 template_id 以便后续关联模板。

-- 用户优惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID,
  title TEXT NOT NULL,
  discount_desc TEXT,
  min_amount INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  coupon_type TEXT DEFAULT 'general',
  expire_at DATE,
  status TEXT DEFAULT 'unused',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_template_id ON coupons(template_id);

-- 用户红包表
CREATE TABLE IF NOT EXISTS red_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  packet_type TEXT DEFAULT 'general',
  expire_at DATE,
  status TEXT DEFAULT 'unused',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_red_packets_user_id ON red_packets(user_id);
CREATE INDEX IF NOT EXISTS idx_red_packets_status ON red_packets(status);

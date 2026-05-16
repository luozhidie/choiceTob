-- ==========================================
-- 买手选品电商模式改造
-- ==========================================

-- 1. 添加新字段到 buyer_products 表
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS original_price integer;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS color_season text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS style_type text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 把旧字段 name 的数据迁移到 title（如果 title 为空）
UPDATE buyer_products SET title = name WHERE title IS NULL OR title = '';

-- 2. 创建 B端用户充值表
CREATE TABLE IF NOT EXISTS buyer_recharge_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount integer NOT NULL,        -- 充值金额（分）
  discount numeric(3,2) NOT NULL, -- 拿货折扣 如 0.28 = 2.8折
  return_rate numeric(3,2) NOT NULL, -- 退换比例 如 0.05 = 5%
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. 创建 B端用户余额表
CREATE TABLE IF NOT EXISTS buyer_user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  company_name text,
  recharge_level text,  -- 'tier_5w' / 'tier_10w' / 'tier_30w'
  balance integer DEFAULT 0,  -- 余额（分）
  total_recharged integer DEFAULT 0,
  discount numeric(3,2) DEFAULT 1.00,
  return_rate numeric(3,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. 创建买手选品订单表
CREATE TABLE IF NOT EXISTS buyer_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  product_id uuid REFERENCES buyer_products(id),
  quantity integer DEFAULT 1,
  unit_price integer NOT NULL,
  discount_price integer NOT NULL,
  total_amount integer NOT NULL,
  status text DEFAULT 'pending', -- pending/paid/shipped/completed/cancelled
  shipping_address text,
  note text,
  created_at timestamp with time zone DEFAULT now()
);

-- RLS 策略
ALTER TABLE buyer_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_recharge_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;

-- buyer_products：公开可读已发布
DROP POLICY IF EXISTS "Allow public read published buyer_products" ON buyer_products;
CREATE POLICY "Allow public read published buyer_products"
  ON buyer_products FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- buyer_recharge_tiers：公开可读
DROP POLICY IF EXISTS "Allow public read recharge tiers" ON buyer_recharge_tiers;
CREATE POLICY "Allow public read recharge tiers"
  ON buyer_recharge_tiers FOR SELECT TO anon, authenticated
  USING (is_active = true);

-- buyer_user_profiles：用户可读自己的，管理员全权限
DROP POLICY IF EXISTS "Users can view own profile" ON buyer_user_profiles;
CREATE POLICY "Users can view own profile"
  ON buyer_user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- buyer_orders：用户可读自己的订单，管理员全权限
DROP POLICY IF EXISTS "Users can view own orders" ON buyer_orders;
CREATE POLICY "Users can view own orders"
  ON buyer_orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 管理员全权限（所有表）
DROP POLICY IF EXISTS "Admin full access buyer_products" ON buyer_products;
CREATE POLICY "Admin full access buyer_products"
  ON buyer_products FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn');

DROP POLICY IF EXISTS "Admin full access recharge_tiers" ON buyer_recharge_tiers;
CREATE POLICY "Admin full access recharge_tiers"
  ON buyer_recharge_tiers FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn');

DROP POLICY IF EXISTS "Admin full access buyer_user_profiles" ON buyer_user_profiles;
CREATE POLICY "Admin full access buyer_user_profiles"
  ON buyer_user_profiles FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn');

DROP POLICY IF EXISTS "Admin full access buyer_orders" ON buyer_orders;
CREATE POLICY "Admin full access buyer_orders"
  ON buyer_orders FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn');

-- 5. 插入充值档位配置
INSERT INTO buyer_recharge_tiers (amount, discount, return_rate)
VALUES
  (5000000, 0.28, 0.05),  -- 5万 → 2.8折，退换5%
  (10000000, 0.28, 0.10), -- 10万 → 2.8折，退换10%
  (30000000, 0.26, 0.20)  -- 30万 → 2.6折，退换20%
ON CONFLICT DO NOTHING;

-- 6. 插入示例买手选品商品
INSERT INTO buyer_products (title, description, price, original_price, category, subcategory, color_season, style_type, stock, is_published, sort_order)
VALUES
('桑蚕丝提花连衣裙 A2024', '100%桑蚕丝，适合浅暖型/暖亮型客户，春夏爆款', 29800, 59800, 'clothing', 'dress', 'light_warm', 'elegant', 50, true, 10),
('高支棉休闲西装套装', '120支长绒棉，适合净暖型/深暖型，商务休闲两用', 45800, 89800, 'clothing', 'suit', 'clear_warm', 'classic', 30, true, 20),
('真丝印花围巾 90x90', '12季型通用，净暖型/暖亮型特别推荐', 12800, 25800, 'accessory', 'scarf', 'clear_warm', 'elegant', 100, true, 30),
('925银简约耳饰套装', '冷柔型/净冷型专属设计，925银针低敏', 6800, 12800, 'accessory', 'jewelry', 'cool_soft', 'minimalist', 200, true, 40),
('春季轻薄针织开衫', '浅暖型/浅冷型推荐，羊绒混纺，触感柔软', 35800, 65800, 'clothing', 'tops', 'light_warm', 'natural', 40, true, 50)
ON CONFLICT DO NOTHING;

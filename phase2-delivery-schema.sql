-- ==========================================
-- Phase 2：交付系统
-- ==========================================

-- 1. 交付方案表
CREATE TABLE IF NOT EXISTS delivery_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text,
  customer_wechat text,
  vip_level text DEFAULT 'V1', -- V1/V2/V3
  service_type text NOT NULL, -- 'select'选品 / 'display'陈列 / 'planning'企划 / 'full'全案
  title text NOT NULL,
  description text,
  status text DEFAULT 'draft', -- 'draft'草稿 / 'in_progress'进行中 / 'delivered'已交付 / 'confirmed'客户确认
  delivery_data jsonb, -- 交付内容（选品列表/陈列方案/企划报告）
  file_urls text[], -- 附件URLs
  price integer, -- 分，如 9900 = ¥99
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE delivery_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access on delivery_plans"
  ON delivery_plans FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- 2. 订单/结算表
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_plan_id uuid REFERENCES delivery_plans(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text,
  service_type text NOT NULL,
  title text NOT NULL,
  amount integer NOT NULL, -- 分
  status text DEFAULT 'pending', -- 'pending'待支付 / 'paid'已支付 / 'refunded'已退款
  paid_at timestamp with time zone,
  payment_method text, -- 'wechat' / 'alipay' / 'bank'
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access on orders"
  ON orders FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

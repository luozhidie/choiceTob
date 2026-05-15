-- ==========================================
-- 第一阶段：风格测试 + 客户管理 + 线索管理
-- ==========================================

-- 1. 风格测试结果表
CREATE TABLE IF NOT EXISTS style_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gender text NOT NULL, -- 'male' / 'female'
  answers jsonb NOT NULL, -- 所有题目的答案 { "q1": "A", "q2": "B", ... }
  main_style text NOT NULL, -- 主风格
  sub_style text, -- 副风格
  source text DEFAULT 'online', -- 'online' / 'manual'
  customer_name text,
  customer_phone text,
  customer_wechat text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE style_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert style_test_results"
  ON style_test_results FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admin full access on style_test_results"
  ON style_test_results FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- 2. VIP客户表
CREATE TABLE IF NOT EXISTS vip_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  wechat text,
  company text,
  gender text, -- 'male' / 'female'
  color_season text, -- 色彩季型：深秋/浅春/净冬/柔夏等12种
  main_style text, -- 主风格
  sub_style text, -- 副风格
  vip_level text DEFAULT 'V1', -- V1/V2/V3
  tags text[],
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE vip_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access on vip_customers"
  ON vip_customers FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- 3. 客户留资/线索表
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone text,
  wechat text,
  company text,
  source text, -- 'paywall' / 'contact' / 'style_test' / 'supplier'
  interest text,
  status text DEFAULT 'new', -- 'new' / 'contacted' / 'qualified' / 'converted' / 'lost'
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert leads"
  ON leads FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow admin full access on leads"
  ON leads FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

-- 4. 风格测试码表
CREATE TABLE IF NOT EXISTS test_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  package_name text DEFAULT '风格测试套餐',
  price integer DEFAULT 9900, -- 分，¥99
  max_attempts integer DEFAULT 2,
  used_attempts integer DEFAULT 0,
  customer_name text,
  customer_phone text,
  customer_wechat text,
  is_active boolean DEFAULT true,
  note text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE test_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access on test_codes"
  ON test_codes FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

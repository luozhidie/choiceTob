-- ============================================================
-- 客户信息表（注册会员）
-- ============================================================

-- 如果 profiles 表已经包含客户信息，可以扩展它
-- 这里创建一个单独的 customers 表，用于存储详细的客户信息

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 基本信息
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  wechat_id TEXT,
  avatar_url TEXT,
  
  -- 详细信息
  birthday DATE,
  age_group TEXT, -- '18-24', '25-34', '35-44', '45+'
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  location TEXT,
  address TEXT,
  
  -- 会员信息
  membership_level TEXT DEFAULT 'basic', -- 'basic', 'vip', 'premium'
  membership_expires_at TIMESTAMPTZ,
  total_spent DECIMAL(10,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  
  -- 来源和标签
  source TEXT, -- 'website', 'wechat', 'referral', 'ad'
  tags TEXT[],
  notes TEXT,
  
  -- 状态
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at DESC);

-- RLS（行级安全）
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 管理员可以完全管理
CREATE POLICY "Admins can manage all customers"
  ON customers FOR ALL USING (true);

-- 用户只能查看自己的信息
CREATE POLICY "Users can view own customer info"
  ON customers FOR SELECT USING (auth.uid() = user_id);

-- updated_at 触发器
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE customers IS '客户信息表（注册会员详细信息）';


-- ============================================================
-- 访客信息表（未注册用户、潜在客户）
-- ============================================================

CREATE TABLE IF NOT EXISTS visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 联系信息
  email TEXT,
  phone TEXT,
  wechat_id TEXT,
  
  -- 基本信息
  full_name TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  age_group TEXT,
  location TEXT,
  
  -- 行为数据
  first_visit_at TIMESTAMPTZ DEFAULT NOW(),
  last_visit_at TIMESTAMPTZ DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  page_views INTEGER DEFAULT 1,
  time_spent INTEGER DEFAULT 0, -- 秒
  
  -- 兴趣标签
  interests TEXT[], -- ['搭配', '潮流', '奢侈品']
  viewed_products TEXT[], -- 查看过的产品ID
  viewed_articles TEXT[], -- 查看过的文章ID
  
  -- 来源
  source TEXT, -- 'direct', 'wechat', 'search', 'social'
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- 转化状态
  status TEXT DEFAULT 'lead' CHECK (status IN ('visitor', 'lead', 'converted')),
  converted_at TIMESTAMPTZ,
  converted_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 标签和备注
  tags TEXT[],
  notes TEXT,
  
  -- 时间戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visitors_phone ON visitors(phone);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_source ON visitors(source);
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_last_visit ON visitors(last_visit_at DESC);

-- RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

-- 管理员可以完全管理
CREATE POLICY "Admins can manage all visitors"
  ON visitors FOR ALL USING (true);

-- updated_at 触发器
DROP TRIGGER IF EXISTS update_visitors_updated_at ON visitors;
CREATE TRIGGER update_visitors_updated_at
  BEFORE UPDATE ON visitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE visitors IS '访客信息表（未注册用户、潜在客户）';


-- ============================================================
-- 访客行为日志表（记录每次访问）
-- ============================================================

CREATE TABLE IF NOT EXISTS visitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES visitors(id) ON DELETE CASCADE,
  
  -- 访问信息
  visited_at TIMESTAMPTZ DEFAULT NOW(),
  page_path TEXT NOT NULL,
  page_title TEXT,
  time_spent INTEGER DEFAULT 0, -- 秒
  
  -- 设备信息
  user_agent TEXT,
  ip_address INET,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  
  -- 来源
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- 行为
  clicked_elements TEXT[],
  scrolled_depth INTEGER, -- 滚动深度百分比
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visitor_id ON visitor_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_visited_at ON visitor_logs(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_page_path ON visitor_logs(page_path);

-- RLS
ALTER TABLE visitor_logs ENABLE ROW LEVEL SECURITY;

-- 管理员可以完全管理
CREATE POLICY "Admins can manage all visitor logs"
  ON visitor_logs FOR ALL USING (true);

COMMENT ON TABLE visitor_logs IS '访客行为日志表（记录每次访问和点击）';

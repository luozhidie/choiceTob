-- 买手选品页面功能增强迁移（修复版）
-- 修复：去掉了对 users 表的依赖
-- 创建时间：2026-06-13

-- ========================================
-- 1. 营销活动表
-- ========================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  promo_type TEXT NOT NULL CHECK (promo_type IN ('flash_sale', 'new_user', 'invite', 'seasonal', 'clearance')),
  discount_rate DECIMAL(5,2),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  banner_image_url TEXT,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "促销活动公开读取" ON promotions FOR SELECT USING (status = 'active');

-- ========================================
-- 2. 新品日历表
-- ========================================
CREATE TABLE IF NOT EXISTS new_product_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  release_date DATE NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE new_product_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "新品日历公开读取" ON new_product_calendar FOR SELECT USING (true);

-- ========================================
-- 3. 商品标签表
-- ========================================
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('limited', 'scarce', 'new', 'hot', 'exclusive')),
  tag_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "商品标签公开读取" ON product_tags FOR SELECT USING (true);

-- ========================================
-- 4. 用户推荐记录表（user_id改为TEXT，不关联users表）
-- ========================================
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- 改为TEXT，不强制关联users表
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  recommendation_score DECIMAL(5,2) DEFAULT 0,
  reason TEXT,
  is_clicked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户推荐记录公开读取" ON user_recommendations FOR SELECT USING (true);

-- ========================================
-- 5. 页面浏览统计表（user_id改为TEXT）
-- ========================================
CREATE TABLE IF NOT EXISTS page_view_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  user_id TEXT, -- 改为TEXT
  session_id TEXT,
  referrer TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE page_view_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "任何人可插入统计数据" ON page_view_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "统计数据公开读取" ON page_view_stats FOR SELECT USING (true);

-- ========================================
-- 6. 触发器函数
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. 索引
-- ========================================
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_new_product_calendar_date ON new_product_calendar(release_date);
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_page_view_stats_page ON page_view_stats(page_path);
CREATE INDEX IF NOT EXISTS idx_page_view_stats_created ON page_view_stats(created_at);

-- ========================================
-- 8. 插入示例数据
-- ========================================
INSERT INTO promotions (title, description, promo_type, discount_rate, start_date, end_date, status, link_url) VALUES
('618大促', '全场2.8折起', 'seasonal', 0.28, '2026-06-01', '2026-06-20', 'active', '/promotion/618'),
('新品特惠', '首单立减50', 'new_user', 0.30, '2026-06-10', '2026-06-30', 'active', '/promotion/new'),
('爆款返场', '昨日热销TOP10', 'flash_sale', 0.25, '2026-06-12', '2026-06-15', 'active', '/promotion/hot'),
('邀请有礼', '邀友得会员', 'invite', NULL, '2026-06-01', '2026-12-31', 'active', '/promotion/invite');
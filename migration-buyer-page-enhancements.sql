-- 买手选品页面功能增强迁移
-- 创建时间：2026-06-12
-- 说明：为买手选品页面添加营销活动、新品日历、商品标签、用户推荐等功能

-- 1. 营销活动表
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  promo_type TEXT NOT NULL CHECK (promo_type IN ('flash_sale', 'new_user', 'invite', 'seasonal', 'clearance')),
  discount_rate DECIMAL(5,2), -- 折扣率，如0.28表示2.8折
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  banner_image_url TEXT,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 营销活动RLS策略
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "促销活动公开读取" ON promotions FOR SELECT USING (status = 'active');
CREATE POLICY "管理员可管理促销活动" ON promotions FOR ALL USING (auth.role() = 'authenticated' AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 2. 新品日历表
CREATE TABLE IF NOT EXISTS new_product_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  release_date DATE NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 新品日历RLS策略
ALTER TABLE new_product_calendar ENABLE ROW LEVEL SECURITY;
CREATE POLICY "新品日历公开读取" ON new_product_calendar FOR SELECT USING (true);
CREATE POLICY "管理员可管理新品日历" ON new_product_calendar FOR ALL USING (auth.role() = 'authenticated' AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 3. 商品标签表
CREATE TABLE IF NOT EXISTS product_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('limited', 'scarce', 'new', 'hot', 'exclusive')),
  tag_text TEXT NOT NULL, -- 如"仅剩5件"、"限量"、"新品"
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 商品标签RLS策略
ALTER TABLE product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "商品标签公开读取" ON product_tags FOR SELECT USING (true);
CREATE POLICY "管理员可管理商品标签" ON product_tags FOR ALL USING (auth.role() = 'authenticated' AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 4. 用户推荐记录表
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  recommendation_score DECIMAL(5,2) DEFAULT 0, -- 推荐评分
  reason TEXT, -- 推荐理由，如"根据你的浏览历史"
  is_clicked BOOLEAN DEFAULT false, -- 是否被点击
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 用户推荐记录RLS策略
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "用户可看自己的推荐" ON user_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "管理员可管理推荐记录" ON user_recommendations FOR ALL USING (auth.role() = 'authenticated' AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- 5. 页面浏览统计表（数据化运营）
CREATE TABLE IF NOT EXISTS page_view_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL, -- 页面路径，如"/buyer"
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT, -- 会话ID
  referrer TEXT, -- 来源页面
  duration INTEGER, -- 停留时长（秒）
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 页面浏览统计RLS策略
ALTER TABLE page_view_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "管理员可查看统计数据" ON page_view_stats FOR SELECT USING (auth.role() = 'authenticated' AND auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "任何人可插入统计数据" ON page_view_stats FOR INSERT WITH CHECK (true);

-- 6. 创建更新时间触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. 为promotions表添加更新时间触发器
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_new_product_calendar_date ON new_product_calendar(release_date);
CREATE INDEX IF NOT EXISTS idx_product_tags_product ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_page_view_stats_page ON page_view_stats(page_path);
CREATE INDEX IF NOT EXISTS idx_page_view_stats_created ON page_view_stats(created_at);

-- 9. 插入示例数据
-- 营销活动示例数据
INSERT INTO promotions (title, description, promo_type, discount_rate, start_date, end_date, status, link_url) VALUES
('618大促', '全场2.8折起', 'seasonal', 0.28, '2026-06-01', '2026-06-20', 'active', '/promotion/618'),
('新品特惠', '首单立减50', 'new_user', 0.30, '2026-06-10', '2026-06-30', 'active', '/promotion/new'),
('爆款返场', '昨日热销TOP10', 'flash_sale', 0.25, '2026-06-12', '2026-06-15', 'active', '/promotion/hot'),
('邀请有礼', '邀友得会员', 'invite', NULL, '2026-06-01', '2026-12-31', 'active', '/promotion/invite');

-- 新品日历示例数据（假设products表有数据）
-- 注意：这里假设products表存在且有数据，实际部署时需要调整
-- INSERT INTO new_product_calendar (product_id, release_date, is_featured) 
-- SELECT id, CURRENT_DATE + (i || ' days')::interval, true 
-- FROM products LIMIT 5;

COMMENT ON TABLE promotions IS '营销活动表 - 存储所有促销活动信息';
COMMENT ON TABLE new_product_calendar IS '新品日历表 - 记录商品上新计划';
COMMENT ON TABLE product_tags IS '商品标签表 - 存储商品的营销标签';
COMMENT ON TABLE user_recommendations IS '用户推荐记录表 - 存储个性化推荐数据';
COMMENT ON TABLE page_view_stats IS '页面浏览统计表 - 用于数据化运营分析';
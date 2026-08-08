-- 测款行为事件表（记录每一次用户行为，用于精准统计）
CREATE TABLE IF NOT EXISTS product_test_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES product_test_campaigns(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view','click','add_cart','inquire','order')),
  visitor_id TEXT, -- 用 cookie 标记同一访客（避免重复计数）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_test_events_campaign ON product_test_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_test_events_product ON product_test_events(product_id);
CREATE INDEX IF NOT EXISTS idx_test_events_type ON product_test_events(event_type);

-- 允许匿名访问（记录行为不需要登录）
ALTER TABLE product_test_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "允许匿名插入事件" ON product_test_events;
CREATE POLICY "允许匿名插入事件" ON product_test_events FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "允许匿名读取事件" ON product_test_events FOR SELECT USING (true);
GRANT SELECT, INSERT ON product_test_events TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE product_test_events_id_seq TO anon, authenticated;

-- 同时给 product_test_campaigns 和 product_test_items 也放开 RLS（管理员通过 cookie 访问）
ALTER TABLE product_test_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_test_items DISABLE ROW LEVEL SECURITY;

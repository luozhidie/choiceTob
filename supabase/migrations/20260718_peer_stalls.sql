-- ============================================================
-- 20260718 同行档口货架板块
-- 用途：对标同行（十三行/沙河/杭州 等）的档口货架：
--       市场商圈(markets) + 档口(peer_stalls) + 档口评价(stall_reviews)
-- 请在 Supabase SQL Editor 执行（Vercel 不会自动跑迁移）
-- ============================================================

-- 1. 市场/商圈（十三行、沙河、杭州、南油、中纺…）
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                  -- 十三行、沙河、杭州
  location TEXT,                       -- 广州市荔湾区
  cover_image TEXT,                    -- 市场头图
  avatar TEXT,                         -- 圆形小头像
  intro TEXT,                          -- 特色介绍
  is_published BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE markets IS '服装批发市场/商圈，如十三行、沙河、杭州';
COMMENT ON COLUMN markets.avatar IS '圆形小头像（Supabase products bucket 或 stalls bucket 的公开 URL）';
COMMENT ON COLUMN markets.cover_image IS '市场头图';

-- 2. 档口（peer_stalls）
CREATE TABLE IF NOT EXISTS peer_stalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id) ON DELETE SET NULL,
  name TEXT NOT NULL,                  -- 档口名称
  avatar TEXT,                         -- 档口头像
  intro TEXT,                          -- 档口简介
  market_floor TEXT,                   -- 楼层，如 1楼 / 2楼A区
  tags TEXT[] DEFAULT '{}',            -- 严选品牌、韩版、大码…
  rating NUMERIC(2,1) DEFAULT 5.0,     -- 评分 0.0~5.0
  fan_count INT DEFAULT 0,             -- 粉丝数
  reorder_rate NUMERIC(5,2) DEFAULT 0, -- 返单率 %
  delivery_rate NUMERIC(5,2) DEFAULT 0,-- 24H/发货率 %
  product_ids TEXT[] DEFAULT '{}',     -- 关联商品 UUID 数组
  recommend_reason TEXT,               -- 推荐理由
  is_published BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE peer_stalls IS '同行档口，关联所属市场与商品';
COMMENT ON COLUMN peer_stalls.tags IS '标签数组，如 {"严选品牌","韩版","大码"}';
COMMENT ON COLUMN peer_stalls.product_ids IS '关联商品 UUID 数组，用于档口卡片/详情展示商品';
COMMENT ON COLUMN peer_stalls.reorder_rate IS '返单率（百分比数值，如 68.50 表示 68.50%）';
COMMENT ON COLUMN peer_stalls.delivery_rate IS '发货率（百分比数值）';

-- 3. 档口评价（stall_reviews）
CREATE TABLE IF NOT EXISTS stall_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id UUID REFERENCES peer_stalls(id) ON DELETE CASCADE,
  user_name TEXT,                      -- 评价人昵称（匿名则为 匿名买手）
  content TEXT,                        -- 评价内容
  rating NUMERIC(2,1) DEFAULT 5,       -- 评分 0.0~5.0
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE stall_reviews IS '档口客户评价';
COMMENT ON COLUMN stall_reviews.user_name IS '评价人昵称，缺省 匿名买手';

-- 索引（提升按市场查询档口、按档口查评价的速度）
CREATE INDEX IF NOT EXISTS idx_peer_stalls_market ON peer_stalls(market_id);
CREATE INDEX IF NOT EXISTS idx_peer_stalls_published ON peer_stalls(is_published);
CREATE INDEX IF NOT EXISTS idx_peer_stalls_sort ON peer_stalls(sort_order);
CREATE INDEX IF NOT EXISTS idx_stall_reviews_stall ON stall_reviews(stall_id);
CREATE INDEX IF NOT EXISTS idx_markets_published ON markets(is_published);

-- ============================================================
-- 行级安全（RLS）
-- 公开只读已发布内容；其余写操作走 service_role 后台 API
-- ============================================================

-- 市场
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读取已发布市场" ON markets;
CREATE POLICY "公开读取已发布市场" ON markets
  FOR SELECT USING (is_published = true);

-- 档口
ALTER TABLE peer_stalls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读取已发布档口" ON peer_stalls;
CREATE POLICY "公开读取已发布档口" ON peer_stalls
  FOR SELECT USING (is_published = true);

-- 档口评价（评价默认全部公开，跟随档口展示）
ALTER TABLE stall_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读取档口评价" ON stall_reviews;
CREATE POLICY "公开读取档口评价" ON stall_reviews
  FOR SELECT USING (true);

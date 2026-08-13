-- ============================================================
-- 20260719 自动化商品组货系统
-- 1) assortment_plans 组货方案表（架构写到商城后的落库）
-- 2) products 补 cost_price 成本价（价格系统完善 / 算毛利）
-- 3) categories(code) 唯一索引（发布时 upsert 去重）
-- 请在 Supabase SQL Editor 执行（接在既有迁移之后）
-- ============================================================

-- 1. 组货方案表
CREATE TABLE IF NOT EXISTS assortment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  season TEXT,                                   -- 春/夏/秋/冬/全年
  status TEXT DEFAULT 'planned',                 -- planned / published / archived
  source TEXT DEFAULT 'manual',                  -- ai / manual
  categories JSONB NOT NULL DEFAULT '[]',        -- [{category, code, target_sku, retail_band, wholesale_band, bulk_band, wave, note}]
  price_bands JSONB,                             -- 方案级价格带（来自 AI pricePlan）
  waves JSONB,                                   -- 上货波段（来自 AI waveCalendar）
  total_sku INTEGER DEFAULT 0,
  total_budget NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE assortment_plans IS '自动化商品组货方案：规划出的品类架构+价格带+波段，写入商城后供店主照传';
COMMENT ON COLUMN assortment_plans.categories IS '品类架构数组，价带单位为分';

CREATE INDEX IF NOT EXISTS idx_assortment_plans_status ON assortment_plans(status);

-- 2. 商品补成本价（分）
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0;
COMMENT ON COLUMN products.cost_price IS '成本价/拿货价（分），用于计算毛利率';

-- 3. 商城分类树 code 唯一索引（发布 upsert 去重）
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_code ON categories(code);

-- 行级安全：读公开（前台看板），写走 service_role 后台 API
ALTER TABLE assortment_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读组货方案" ON assortment_plans;
CREATE POLICY "公开读组货方案" ON assortment_plans
  FOR SELECT USING (true);

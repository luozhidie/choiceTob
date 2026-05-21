-- ================================================================
-- 买手店实操系统 - 数据库表结构
-- 对应 Excel：买手店实操模板合集.xlsx
-- ================================================================

-- ================================================================
-- 1. 商品结构规划表
-- 对应 Sheet: 1.商品结构规划表
-- ================================================================
CREATE TABLE IF NOT EXISTS product_structure_plan (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  season TEXT NOT NULL,              -- 季节：春夏/秋冬/全年
  items JSONB NOT NULL DEFAULT '[]',  -- [{category, pct, sku_count, gross_margin, target_sales}]
  total_sku INTEGER DEFAULT 0,
  total_budget NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 2. 96格商品矩阵规划表
-- 对应 Sheet: 2.96格商品矩阵规划表
-- 结构：行=季型(12季)，列=风格(女士8+男士5)
-- ================================================================
CREATE TABLE IF NOT EXISTS product_matrix_plan (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  season TEXT NOT NULL,              -- 春/夏/秋/冬/全年
  matrix_data JSONB NOT NULL,        -- 96格数据：{ "浅春型": {"少女型": {sku:0, pct:0, budget:0}, ...}, ... }
  total_sku INTEGER DEFAULT 0,
  total_budget NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 3. 订货款式清单表
-- 对应 Sheet: 3.订货款式清单表
-- ================================================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  order_id TEXT,                     -- 关联采购订单号
  sku_code TEXT NOT NULL,            -- 款号
  product_name TEXT NOT NULL,         -- 品名
  category TEXT NOT NULL,            -- 品类：上衣/裤装/裙装/外套/配饰
  season_type TEXT,                  -- 季型：浅春型/暖亮型/...
  style TEXT,                       -- 风格：少女型/优雅型/...
  colors TEXT,                      -- 颜色（逗号分隔）
  sizes TEXT,                       -- 尺码（逗号分隔 S/M/L/XL/XXL）
  cost_price NUMERIC(10,2),        -- 采购价
  retail_price NUMERIC(10,2),      -- 零售价
  gross_margin_pct NUMERIC(5,2),   -- 毛利率%
  quantity INTEGER DEFAULT 0,        -- 采购数量
  total_amount NUMERIC(12,2),      -- 金额
  wave_band TEXT,                   -- 波段：第一波/第二波/第三波/第四波
  status TEXT DEFAULT 'draft',     -- draft/confirmed/ordered/received
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 4. 上货波段计划表
-- 对应 Sheet: 4.上货波段计划表
-- ================================================================
CREATE TABLE IF NOT EXISTS wave_plan (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  wave_number INTEGER NOT NULL,       -- 第几波
  wave_name TEXT,                   -- 波段名称：第一波/第二波...
  plan_date TEXT NOT NULL,          -- 上货日期：2月第1周 / 2026-04-20
  pct NUMERIC(5,2),                -- 占比%
  sku_count INTEGER,               -- SKU数
  amount NUMERIC(12,2),            -- 金额
  core_categories TEXT[],           -- 核心品类数组
  season_focus TEXT[],              -- 季型重点数组
  style_focus TEXT[],              -- 风格重点数组
  marketing_activity TEXT,          -- 营销活动
  status TEXT DEFAULT 'planned',   -- planned/in_progress/done
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 5. VIP服务记录表（扩展现有vip_customers，新增服务记录表）
-- 对应 Sheet: 6.VIP服务记录表
-- ================================================================
CREATE TABLE IF NOT EXISTS vip_service_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vip_customer_id UUID REFERENCES vip_customers(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type TEXT NOT NULL,        -- 私人搭配/形象诊断/新品试穿/沙龙邀请
  service_content TEXT,
  consultant TEXT,                  -- 顾问姓名
  satisfaction_score INTEGER,       -- 满意度 0-100
  next_appointment DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 6. 选品评估表
-- 对应 Sheet: 7.选品评估表
-- ================================================================
CREATE TABLE IF NOT EXISTS product_evaluation (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  sku_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  supplier TEXT,
  -- 评分维度
  design_score INTEGER,             -- 设计感 (30分)
  quality_score INTEGER,            -- 品质 (25分)
  price_score INTEGER,              -- 价格竞争力 (20分)
  wearability_score INTEGER,        -- 实穿性 (15分)
  scarcity_score INTEGER,            -- 稀缺性 (10分)
  total_score NUMERIC(5,2),       -- 综合评分
  decision TEXT,                   -- 决策建议：优先采购/可考虑/暂不采购/淘汰
  trial_start DATE,                -- 试销开始
  trial_end DATE,                  -- 试销结束
  trial_result TEXT,               -- 试销结果：达标/不达标/待评估
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 7. 周度销售分析表
-- 对应 Sheet: 8.周度销售分析表
-- ================================================================
CREATE TABLE IF NOT EXISTS weekly_sales_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  week_ending DATE NOT NULL,
  sales_amount NUMERIC(12,2),
  sales_units INTEGER,
  avg_price NUMERIC(10,2),
  gross_margin_pct NUMERIC(5,2),
  comparison_last_week NUMERIC(5,4),  -- 环比%
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 8. 库存管理表
-- 对应 Sheet: 9.库存管理表
-- ================================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  sku_code TEXT NOT NULL,
  product_name TEXT,
  category TEXT,
  color TEXT,
  size TEXT,
  stock_in_qty INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  sales_qty INTEGER DEFAULT 0,
  sell_through_pct NUMERIC(5,4),
  turnover_days INTEGER,
  status TEXT DEFAULT 'normal',    -- normal/low_stock/out_of_stock
  restock_advice TEXT,
  unit_cost NUMERIC(12,2) DEFAULT 0,  -- 单位成本
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 9. 采购订单管理表
-- 对应 Sheet: 10.采购订单管理表
-- ================================================================
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  order_no TEXT UNIQUE NOT NULL,
  supplier TEXT NOT NULL,
  total_amount NUMERIC(12,2),
  order_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE,
  payment_terms TEXT,               -- 预付30%/货到付款/月结30天
  status TEXT DEFAULT 'draft',     -- draft/confirmed/shipped/received/completed
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 10. 沙龙活动流程表
-- 对应 Sheet: 11.沙龙活动流程表
-- ================================================================
CREATE TABLE IF NOT EXISTS salon_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  expected_attendees INTEGER,
  actual_attendees INTEGER,
  budget NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  status TEXT DEFAULT 'planned',   -- planned/ongoing/completed/cancelled
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 11. 内容日历表
-- 对应 Sheet: 12.内容日历表
-- ================================================================
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  post_date DATE NOT NULL,
  platform TEXT NOT NULL,            -- 小红书/微信公众号/抖音
  content_type TEXT,                -- 新品预告/穿搭指南/变装视频/客户案例
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'draft',    -- draft/scheduled/published
  performance_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 12. 项目进度跟踪表
-- 对应 Sheet: 13.项目进度跟踪表
-- ================================================================
CREATE TABLE IF NOT EXISTS project_tracker (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  owner TEXT,                       -- 负责人
  deliverable TEXT,                 -- 交付物
  start_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'not_started', -- not_started/in_progress/done
  progress_pct INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 13. 预算与成本表
-- 对应 Sheet: 14.预算与成本表
-- ================================================================
CREATE TABLE IF NOT EXISTS budget_tracker (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  category TEXT NOT NULL,            -- 采购成本/营销费用/运营成本/人力成本
  item TEXT NOT NULL,
  budget_amount NUMERIC(12,2),
  actual_amount NUMERIC(12,2),
  variance NUMERIC(12,2),           -- 差异 = actual - budget
  variance_pct NUMERIC(5,4),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 索引
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_product_structure_plan_store ON product_structure_plan(store_id);
CREATE INDEX IF NOT EXISTS idx_product_matrix_plan_store ON product_matrix_plan(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_store ON purchase_order_items(store_id);
CREATE INDEX IF NOT EXISTS idx_wave_plan_store ON wave_plan(store_id);
CREATE INDEX IF NOT EXISTS idx_vip_service_logs_vip ON vip_service_logs(vip_customer_id);
CREATE INDEX IF NOT EXISTS idx_weekly_sales_store ON weekly_sales_analysis(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store ON inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_store ON purchase_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_salon_events_store ON salon_events(store_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_store ON content_calendar(store_id);
CREATE INDEX IF NOT EXISTS idx_project_tracker_store ON project_tracker(store_id);
CREATE INDEX IF NOT EXISTS idx_budget_tracker_store ON budget_tracker(store_id);

-- ================================================================
-- 启用 RLS（行级安全）
-- ================================================================
ALTER TABLE product_structure_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_matrix_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wave_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_service_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_sales_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_tracker ENABLE ROW LEVEL SECURITY;

-- Fix: Add unit_cost column to inventory if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'unit_cost') THEN
    ALTER TABLE inventory ADD COLUMN unit_cost NUMERIC(12,2) DEFAULT 0;
  END IF;
END $$;

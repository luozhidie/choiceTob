-- 爆款平台数据库表结构
-- 创建时间：2026-05-29
-- 说明：爆款数据中心 + 竞品监控 + 爬虫调度

-- ============================================================
-- 1. 实战案例库主表：bao_kuan_cases
-- 存储从各平台爬取的爆款商品/内容，含FCPSR属性编码
-- ============================================================
CREATE TABLE IF NOT EXISTS bao_kuan_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id VARCHAR(20) UNIQUE NOT NULL,
  
  -- 来源信息
  source_platform VARCHAR(20) NOT NULL CHECK (source_platform IN ('douyin','xiaohongshu','taobao','1688')),
  source_url TEXT,
  source_id VARCHAR(100),
  
  -- 爆款基础信息
  title VARCHAR(500),
  price DECIMAL(10,2),
  sales_volume INTEGER,
  image_urls TEXT[],
  
  -- FCPSR属性编码（AI识别结果）
  attr_fabric TEXT[],           -- 面料: ['F01','F02']
  attr_cut TEXT[],              -- 剪裁: ['C01','C02']
  attr_pattern TEXT[],          -- 图案: ['P01','P03']
  attr_season_color TEXT[],     -- 色季型: ['S01','S02']
  attr_rule TEXT[],            -- 搭配原则: ['R01','R02']
  
  -- AI拆解报告
  ai_report_text TEXT,         -- 文字报告
  ai_report_table JSONB,       -- 结构化表格
  ai_suggestion TEXT,          -- AI建议
  
  -- 热度与竞争
  heat_score INTEGER CHECK (heat_score BETWEEN 1 AND 100),
  competition_level VARCHAR(10) CHECK (competition_level IN ('高','中','低')),
  
  -- 元数据
  crawled_at TIMESTAMP,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_bao_kuan_cases_case_id ON bao_kuan_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_bao_kuan_cases_source_platform ON bao_kuan_cases(source_platform);
CREATE INDEX IF NOT EXISTS idx_bao_kuan_cases_heat_score ON bao_kuan_cases(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_bao_kuan_cases_crawled_at ON bao_kuan_cases(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_bao_kuan_cases_attr_fabric ON bao_kuan_cases USING GIN(attr_fabric);
CREATE INDEX IF NOT EXISTS idx_bao_kuan_cases_attr_cut ON bao_kuan_cases USING GIN(attr_cut);
CREATE INDEX IF NOT EXISTS idx_bao_kuan_cases_attr_pattern ON bao_kuan_cases USING GIN(attr_pattern);
CREATE INDEX IF NOT EXISTS idx_bao_kuan_cases_attr_season_color ON bao_kuan_cases USING GIN(attr_season_color);

COMMENT ON TABLE bao_kuan_cases IS '实战案例库：存储各平台爆款商品及FCPSR属性编码';
COMMENT ON COLUMN bao_kuan_cases.case_id IS '爆款编号，格式：BL+年月+序号，如BL2026001';
COMMENT ON COLUMN bao_kuan_cases.heat_score IS '热度分1-100，越高越热';
COMMENT ON COLUMN bao_kuan_cases.attr_fabric IS '面料属性编码数组，如["F01","F02"]';

-- ============================================================
-- 2. 竞品监控表：competitor_monitor
-- 用户添加的竞品监控目标
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_monitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- 监控目标
  target_platform VARCHAR(20) NOT NULL CHECK (target_platform IN ('douyin','xiaohongshu','taobao','1688')),
  target_url TEXT NOT NULL,
  target_name VARCHAR(200),
  target_id VARCHAR(100),
  
  -- 监控状态
  is_active BOOLEAN DEFAULT true,
  alert_condition JSONB,  -- {"price_change": true, "new_product": true, "sales_spike": true}
  last_check_at TIMESTAMP,
  
  -- 元数据
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_competitor_monitor_user_id ON competitor_monitor(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_monitor_target_platform ON competitor_monitor(target_platform);
CREATE INDEX IF NOT EXISTS idx_competitor_monitor_is_active ON competitor_monitor(is_active);

COMMENT ON TABLE competitor_monitor IS '竞品监控：用户添加的监控目标';
COMMENT ON COLUMN competitor_monitor.alert_condition IS '预警条件JSON，如{"price_change":true,"new_product":true}';

-- ============================================================
-- 3. 竞品价格历史表：competitor_price_history
-- 记录竞品每次检查的价格/销量变化
-- ============================================================
CREATE TABLE IF NOT EXISTS competitor_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID NOT NULL REFERENCES competitor_monitor(id) ON DELETE CASCADE,
  
  price DECIMAL(10,2),
  sales_volume INTEGER,
  extra_data JSONB,  -- 其他变化数据
  
  checked_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_competitor_price_history_monitor_id ON competitor_price_history(monitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_price_history_checked_at ON competitor_price_history(checked_at DESC);

COMMENT ON TABLE competitor_price_history IS '竞品价格历史：记录每次检查的价格销量变化';

-- ============================================================
-- 4. 爬虫运行日志表：crawl_log
-- 记录每次爬虫运行的日志
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('douyin','xiaohongshu','taobao','1688')),
  crawl_type VARCHAR(50) NOT NULL,  -- 'hot_product'|'competitor'|'trend'|'price_history'
  keyword VARCHAR(200),
  
  status VARCHAR(20) NOT NULL CHECK (status IN ('success','failed','blocked','running')),
  items_count INTEGER DEFAULT 0,
  error_message TEXT,
  
  started_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP,
  duration_ms INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_crawl_log_platform ON crawl_log(platform);
CREATE INDEX IF NOT EXISTS idx_crawl_log_status ON crawl_log(status);
CREATE INDEX IF NOT EXISTS idx_crawl_log_created_at ON crawl_log(created_at DESC);

COMMENT ON TABLE crawl_log IS '爬虫运行日志：记录每次爬虫执行状态';
COMMENT ON COLUMN crawl_log.crawl_type IS '爬取类型：hot_product=爆款商品, competitor=竞品, trend=趋势, price_history=价格历史';

-- ============================================================
-- 5. 爬虫调度表：crawl_schedule
-- 管理定时爬虫任务
-- ============================================================
CREATE TABLE IF NOT EXISTS crawl_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('douyin','xiaohongshu','taobao','1688')),
  crawl_type VARCHAR(50) NOT NULL,
  keyword VARCHAR(200),
  
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily','weekly','once')),
  schedule_config JSONB,  -- {"hour": 8, "minute": 0} 或 {"day_of_week": "monday"}
  
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  last_run_status VARCHAR(20),
  
  is_active BOOLEAN DEFAULT true,
  max_runs INTEGER,  -- NULL=无限
  run_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_crawl_schedule_next_run_at ON crawl_schedule(next_run_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_crawl_schedule_platform ON crawl_schedule(platform);

COMMENT ON TABLE crawl_schedule IS '爬虫调度：管理定时爬虫任务';
COMMENT ON COLUMN crawl_schedule.schedule_config IS '调度配置JSON，如{"hour":8,"minute":0}';

-- ============================================================
-- 6. 爆款编号生成函数
-- 生成格式：BL + 年月(6位) + 序号(3位)，如 BL2026001001
-- ============================================================
CREATE OR REPLACE FUNCTION generate_case_id()
RETURNS VARCHAR(20) AS $$
DECLARE
  prefix VARCHAR(8);
  seq_num INTEGER;
  result VARCHAR(20);
BEGIN
  prefix := 'BL' || to_char(NOW(), 'YYYYMM');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(case_id FROM 9 FOR 3) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM bao_kuan_cases
  WHERE case_id LIKE prefix || '%';
  
  result := prefix || LPAD(seq_num::TEXT, 3, '0');
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_case_id() IS '生成爆款编号：BL+年月+序号';

-- ============================================================
-- 7. 自动更新 updated_at 的触发器函数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为相关表添加 updated_at 触发器
DROP TRIGGER IF EXISTS update_bao_kuan_cases_updated_at ON bao_kuan_cases;
CREATE TRIGGER update_bao_kuan_cases_updated_at BEFORE UPDATE ON bao_kuan_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_competitor_monitor_updated_at ON competitor_monitor;
CREATE TRIGGER update_competitor_monitor_updated_at BEFORE UPDATE ON competitor_monitor
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crawl_schedule_updated_at ON crawl_schedule;
CREATE TRIGGER update_crawl_schedule_updated_at BEFORE UPDATE ON crawl_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. Row Level Security (RLS) 策略
-- ============================================================

-- 启用 RLS
ALTER TABLE bao_kuan_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_monitor ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawl_schedule ENABLE ROW LEVEL SECURITY;

-- bao_kuan_cases: 所有已登录用户可读，仅管理员可写
CREATE POLICY "bao_kuan_cases_select_policy" ON bao_kuan_cases
  FOR SELECT USING (auth.role() = 'authenticated');

-- competitor_monitor: 用户只能访问自己的监控
CREATE POLICY "competitor_monitor_select_policy" ON competitor_monitor
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "competitor_monitor_insert_policy" ON competitor_monitor
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "competitor_monitor_update_policy" ON competitor_monitor
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "competitor_monitor_delete_policy" ON competitor_monitor
  FOR DELETE USING (auth.uid() = user_id);

-- competitor_price_history: 通过 monitor_id 关联，用户只能访问自己的
CREATE POLICY "competitor_price_history_select_policy" ON competitor_price_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM competitor_monitor cm 
      WHERE cm.id = monitor_id AND cm.user_id = auth.uid()
    )
  );

-- crawl_log: 管理员可读
CREATE POLICY "crawl_log_select_policy" ON crawl_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- crawl_schedule: 管理员可管理
CREATE POLICY "crawl_schedule_admin_policy" ON crawl_schedule
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
  );

-- ============================================================
-- 完成提示
-- ============================================================
-- 本SQL文件创建完成，包含：
-- 1. bao_kuan_cases - 实战案例库主表
-- 2. competitor_monitor - 竞品监控表
-- 3. competitor_price_history - 竞品价格历史表
-- 4. crawl_log - 爬虫运行日志表
-- 5. crawl_schedule - 爬虫调度表
-- 6. generate_case_id() - 爆款编号生成函数
-- 7. updated_at 触发器
-- 8. RLS安全策略
--
-- 执行方式：在 Supabase SQL Editor 中运行此文件
-- 或 psql 连接数据库后执行：\i sql/baokuan-platform.sql
-- ============================================================

-- ================================================================
-- 修复 weekly_sales_analysis 表结构
-- 页面使用 sale_date/period_type/comparison_last_month/comparison_last_year
-- 但表中只有 week_ending/comparison_last_week
-- ================================================================

-- 添加 sale_date 列（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_sales_analysis' AND column_name = 'sale_date') THEN
    ALTER TABLE weekly_sales_analysis ADD COLUMN sale_date DATE;
    -- 把已有 week_ending 数据迁移到 sale_date
    UPDATE weekly_sales_analysis SET sale_date = week_ending WHERE sale_date IS NULL;
  END IF;
END $$;

-- 添加 period_type 列
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_sales_analysis' AND column_name = 'period_type') THEN
    ALTER TABLE weekly_sales_analysis ADD COLUMN period_type TEXT DEFAULT 'week';
    UPDATE weekly_sales_analysis SET period_type = 'week' WHERE period_type IS NULL;
  END IF;
END $$;

-- 添加 comparison_last_month 列
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_sales_analysis' AND column_name = 'comparison_last_month') THEN
    ALTER TABLE weekly_sales_analysis ADD COLUMN comparison_last_month NUMERIC(5,4);
  END IF;
END $$;

-- 添加 comparison_last_year 列
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weekly_sales_analysis' AND column_name = 'comparison_last_year') THEN
    ALTER TABLE weekly_sales_analysis ADD COLUMN comparison_last_year NUMERIC(5,4);
  END IF;
END $$;

-- ================================================================
-- 修复 purchase_orders 表 - 确保 store_id 存在
-- ================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'store_id') THEN
    ALTER TABLE purchase_orders ADD COLUMN store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 验证
SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'weekly_sales_analysis'
  ORDER BY ordinal_position;

SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'purchase_orders'
  ORDER BY ordinal_position;

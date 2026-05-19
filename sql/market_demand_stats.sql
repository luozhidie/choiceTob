-- 市场需求统计视图
-- 从多个来源汇总用户偏好数据，反馈市场客户需求

-- 1. 企划订单需求统计视图
CREATE OR REPLACE VIEW v_planning_demand AS
SELECT
  style_type AS 风格偏好,
  color_season AS 色系偏好,
  target_age AS 目标年龄,
  price_range AS 价格带,
  brand_name AS 品牌名,
  COUNT(*) AS 需求数量,
  DATE_TRUNC('week', created_at)::date AS 统计周
FROM planning_orders
WHERE status IS NOT NULL
GROUP BY style_type, color_season, target_age, price_range, brand_name, DATE_TRUNC('week', created_at);

-- 2. 风格测试需求统计视图
CREATE OR REPLACE VIEW v_style_test_demand AS
SELECT
  gender AS 性别,
  main_style AS 主风格,
  COUNT(*) AS 测试次数,
  DATE_TRUNC('week', created_at)::date AS 统计周
FROM style_test_results
GROUP BY gender, main_style, DATE_TRUNC('week', created_at);

-- 3. 线索来源统计视图
CREATE OR REPLACE VIEW v_lead_source_demand AS
SELECT
  source AS 来源,
  interest AS 兴趣方向,
  COUNT(*) AS 线索数量,
  DATE_TRUNC('week', created_at)::date AS 统计周
FROM leads
GROUP BY source, interest, DATE_TRUNC('week', created_at);

-- 4. 综合市场需求统计视图（合并所有来源）
CREATE OR REPLACE VIEW v_market_demand_summary AS
SELECT
  '企划需求' AS 数据来源,
  style_type AS 风格,
  color_season AS 色系,
  target_age AS 年龄段,
  price_range AS 价格带,
  COUNT(*) AS 数量,
  MIN(created_at) AS 最早时间,
  MAX(created_at) AS 最近时间
FROM planning_orders
WHERE status IS NOT NULL
GROUP BY style_type, color_season, target_age, price_range

UNION ALL

SELECT
  '风格测试' AS 数据来源,
  main_style AS 风格,
  NULL AS 色系,
  NULL AS 年龄段,
  NULL AS 价格带,
  COUNT(*) AS 数量,
  MIN(created_at) AS 最早时间,
  MAX(created_at) AS 最近时间
FROM style_test_results
GROUP BY main_style

UNION ALL

SELECT
  '客户线索' AS 数据来源,
  interest AS 风格,
  NULL AS 色系,
  NULL AS 年龄段,
  NULL AS 价格带,
  COUNT(*) AS 数量,
  MIN(created_at) AS 最早时间,
  MAX(created_at) AS 最近时间
FROM leads
GROUP BY interest;

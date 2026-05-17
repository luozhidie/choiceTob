-- 迁移脚本：将 color_season 字段中的旧中文 key 归一化为标准英文 key
-- 执行前请备份数据

-- 1. vip_customers 表
UPDATE vip_customers SET color_season = 'light_warm' WHERE color_season IN ('浅春', '浅春型', '柔春');
UPDATE vip_customers SET color_season = 'warm_bright' WHERE color_season IN ('暖春', '暖春型', '深春');
UPDATE vip_customers SET color_season = 'clear_warm' WHERE color_season IN ('净春', '净春型', '净秋');
UPDATE vip_customers SET color_season = 'light_cool' WHERE color_season IN ('冷夏', '浅夏型');
UPDATE vip_customers SET color_season = 'soft_cool' WHERE color_season IN ('柔夏', '柔夏型');
UPDATE vip_customers SET color_season = 'cool_soft' WHERE color_season IN ('深夏', '冷夏型');
UPDATE vip_customers SET color_season = 'warm_soft' WHERE color_season IN ('柔秋', '柔秋型', '浅秋');
UPDATE vip_customers SET color_season = 'soft_warm' WHERE color_season IN ('暖秋', '暖秋型');
UPDATE vip_customers SET color_season = 'deep_warm' WHERE color_season IN ('深秋', '深秋型');
UPDATE vip_customers SET color_season = 'clear_cool' WHERE color_season IN ('净冬', '净冬型', '浅冬');
UPDATE vip_customers SET color_season = 'cool_bright' WHERE color_season IN ('冷冬', '冷冬型', '柔冬');
UPDATE vip_customers SET color_season = 'deep_cool' WHERE color_season IN ('深冬', '深冬型');

-- 2. buyer_products 表
UPDATE buyer_products SET color_season = 'light_warm' WHERE color_season IN ('浅春', '浅春型', '柔春');
UPDATE buyer_products SET color_season = 'warm_bright' WHERE color_season IN ('暖春', '暖春型', '深春');
UPDATE buyer_products SET color_season = 'clear_warm' WHERE color_season IN ('净春', '净春型', '净秋');
UPDATE buyer_products SET color_season = 'light_cool' WHERE color_season IN ('冷夏', '浅夏型');
UPDATE buyer_products SET color_season = 'soft_cool' WHERE color_season IN ('柔夏', '柔夏型');
UPDATE buyer_products SET color_season = 'cool_soft' WHERE color_season IN ('深夏', '冷夏型');
UPDATE buyer_products SET color_season = 'warm_soft' WHERE color_season IN ('柔秋', '柔秋型', '浅秋');
UPDATE buyer_products SET color_season = 'soft_warm' WHERE color_season IN ('暖秋', '暖秋型');
UPDATE buyer_products SET color_season = 'deep_warm' WHERE color_season IN ('深秋', '深秋型');
UPDATE buyer_products SET color_season = 'clear_cool' WHERE color_season IN ('净冬', '净冬型', '浅冬');
UPDATE buyer_products SET color_season = 'cool_bright' WHERE color_season IN ('冷冬', '冷冬型', '柔冬');
UPDATE buyer_products SET color_season = 'deep_cool' WHERE color_season IN ('深冬', '深冬型');

-- 3. displays 表
UPDATE displays SET color_season = 'light_warm' WHERE color_season IN ('浅春', '浅春型', '柔春');
UPDATE displays SET color_season = 'warm_bright' WHERE color_season IN ('暖春', '暖春型', '深春');
UPDATE displays SET color_season = 'clear_warm' WHERE color_season IN ('净春', '净春型', '净秋');
UPDATE displays SET color_season = 'light_cool' WHERE color_season IN ('冷夏', '浅夏型');
UPDATE displays SET color_season = 'soft_cool' WHERE color_season IN ('柔夏', '柔夏型');
UPDATE displays SET color_season = 'cool_soft' WHERE color_season IN ('深夏', '冷夏型');
UPDATE displays SET color_season = 'warm_soft' WHERE color_season IN ('柔秋', '柔秋型', '浅秋');
UPDATE displays SET color_season = 'soft_warm' WHERE color_season IN ('暖秋', '暖秋型');
UPDATE displays SET color_season = 'deep_warm' WHERE color_season IN ('深秋', '深秋型');
UPDATE displays SET color_season = 'clear_cool' WHERE color_season IN ('净冬', '净冬型', '浅冬');
UPDATE displays SET color_season = 'cool_bright' WHERE color_season IN ('冷冬', '冷冬型', '柔冬');
UPDATE displays SET color_season = 'deep_cool' WHERE color_season IN ('深冬', '深冬型');

-- 4. planning_reports 表
UPDATE planning_reports SET color_season = 'light_warm' WHERE color_season IN ('浅春', '浅春型', '柔春');
UPDATE planning_reports SET color_season = 'warm_bright' WHERE color_season IN ('暖春', '暖春型', '深春');
UPDATE planning_reports SET color_season = 'clear_warm' WHERE color_season IN ('净春', '净春型', '净秋');
UPDATE planning_reports SET color_season = 'light_cool' WHERE color_season IN ('冷夏', '浅夏型');
UPDATE planning_reports SET color_season = 'soft_cool' WHERE color_season IN ('柔夏', '柔夏型');
UPDATE planning_reports SET color_season = 'cool_soft' WHERE color_season IN ('深夏', '冷夏型');
UPDATE planning_reports SET color_season = 'warm_soft' WHERE color_season IN ('柔秋', '柔秋型', '浅秋');
UPDATE planning_reports SET color_season = 'soft_warm' WHERE color_season IN ('暖秋', '暖秋型');
UPDATE planning_reports SET color_season = 'deep_warm' WHERE color_season IN ('深秋', '深秋型');
UPDATE planning_reports SET color_season = 'clear_cool' WHERE color_season IN ('净冬', '净冬型', '浅冬');
UPDATE planning_reports SET color_season = 'cool_bright' WHERE color_season IN ('冷冬', '冷冬型', '柔冬');
UPDATE planning_reports SET color_season = 'deep_cool' WHERE color_season IN ('深冬', '深冬型');

-- 5. style_test_results 表（如果有 color_season 字段）
-- UPDATE style_test_results SET color_season = ...

-- 验证：检查是否还有未归一化的值
-- SELECT DISTINCT color_season FROM vip_customers WHERE color_season NOT IN (
--   'light_warm','warm_bright','clear_warm',
--   'light_cool','soft_cool','cool_soft',
--   'warm_soft','soft_warm','deep_warm',
--   'clear_cool','cool_bright','deep_cool'
-- ) AND color_season IS NOT NULL;

-- ============================================================
-- 色彩季型表扩展字段
-- 执行时间: 2026-05-29
-- ============================================================

-- 新增字段：所属大类
ALTER TABLE attribute_color_seasons ADD COLUMN IF NOT EXISTS category_group text;
COMMENT ON COLUMN attribute_color_seasons.category_group IS '所属大类：浅色型/深色型/暖色型/冷色型/净色型/柔色型';

-- 新增字段：矩阵位置
ALTER TABLE attribute_color_seasons ADD COLUMN IF NOT EXISTS matrix_position text;
COMMENT ON COLUMN attribute_color_seasons.matrix_position IS '矩阵位置，如"浅（明度高）+ 亮（艳度高）"';

-- 新增字段：用色原则
ALTER TABLE attribute_color_seasons ADD COLUMN IF NOT EXISTS color_principle text;
COMMENT ON COLUMN attribute_color_seasons.color_principle IS '用色原则，如"遵循浅、亮、暖的原则"';

-- 新增字段：测试用色/特征
ALTER TABLE attribute_color_seasons ADD COLUMN IF NOT EXISTS test_colors text;
COMMENT ON COLUMN attribute_color_seasons.test_colors IS '测试用色/特征，如"桃色 + 浅苔绿"';

-- 新增字段：适合饰品/材质
ALTER TABLE attribute_color_seasons ADD COLUMN IF NOT EXISTS suitable_accessories text;
COMMENT ON COLUMN attribute_color_seasons.suitable_accessories IS '适合饰品/材质，如"K金为主，透明晶莹宝石"';

-- 新增字段：理想颜色
ALTER TABLE attribute_color_seasons ADD COLUMN IF NOT EXISTS ideal_colors text[];
COMMENT ON COLUMN attribute_color_seasons.ideal_colors IS '理想颜色数组，如{奶油色,桃色,浅苔绿}';

-- 刷新 schema cache
SELECT pg_notify('pgrst', 'reload schema');

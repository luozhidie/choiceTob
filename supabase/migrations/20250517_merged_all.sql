-- ================================================================
-- 合并迁移脚本：一次性执行 Phase 5 所有数据归一化
-- 执行顺序：触发器 → 公司迁移 → 色彩归一化 → 风格归一化 → 全量刷新
-- ================================================================

-- ================================================================
-- 第1步：创建自动刷新触发器函数和触发器
-- ================================================================
CREATE OR REPLACE FUNCTION auto_refresh_store_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_store_id := OLD.store_id;
  ELSE
    v_store_id := NEW.store_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.store_id IS DISTINCT FROM NEW.store_id THEN
    IF OLD.store_id IS NOT NULL THEN
      PERFORM refresh_store_member_stats(OLD.store_id);
    END IF;
    v_store_id := NEW.store_id;
  END IF;

  IF v_store_id IS NOT NULL THEN
    PERFORM refresh_store_member_stats(v_store_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_refresh_store_stats ON vip_customers;

CREATE TRIGGER trg_auto_refresh_store_stats
  AFTER INSERT OR UPDATE OR DELETE ON vip_customers
  FOR EACH ROW
  EXECUTE FUNCTION auto_refresh_store_stats();

-- ================================================================
-- 第2步：迁移 vip_customers.company → stores 表
-- ================================================================
INSERT INTO stores (name, status, created_at, updated_at)
SELECT DISTINCT
  company,
  'active',
  NOW(),
  NOW()
FROM vip_customers
WHERE company IS NOT NULL AND company != ''
  AND company NOT IN (SELECT name FROM stores)
ORDER BY company;

UPDATE vip_customers
SET store_id = s.id
FROM stores s
WHERE vip_customers.company = s.name
  AND vip_customers.store_id IS NULL;

-- ================================================================
-- 第3步：归一化 color_season 字段（4个表）
-- ================================================================
-- 3.1 vip_customers
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

-- 3.2 buyer_products
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

-- 3.3 displays
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

-- 3.4 planning_reports
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

-- ================================================================
-- 第4步：归一化 main_style / sub_style / style_position
-- ================================================================
-- 4.1 vip_customers main_style
UPDATE vip_customers SET main_style = 'shao_nv' WHERE main_style IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE vip_customers SET main_style = 'you_ya' WHERE main_style IN ('知性风', '法式优雅', 'french_elegant');
UPDATE vip_customers SET main_style = 'lang_man_f' WHERE main_style IN ('名媛风', '浪漫女神');
UPDATE vip_customers SET main_style = 'shao_nian_f' WHERE main_style IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE vip_customers SET main_style = 'shi_shang_f' WHERE main_style IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE vip_customers SET main_style = 'gu_dian_f' WHERE main_style IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE vip_customers SET main_style = 'zi_ran_f' WHERE main_style IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE vip_customers SET main_style = 'xi_ju_f' WHERE main_style IN ('大牌风', '气场女王', 'retro_vintage');

-- 4.2 vip_customers sub_style
UPDATE vip_customers SET sub_style = 'shao_nv' WHERE sub_style IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE vip_customers SET sub_style = 'you_ya' WHERE sub_style IN ('知性风', '法式优雅', 'french_elegant');
UPDATE vip_customers SET sub_style = 'lang_man_f' WHERE sub_style IN ('名媛风', '浪漫女神');
UPDATE vip_customers SET sub_style = 'shao_nian_f' WHERE sub_style IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE vip_customers SET sub_style = 'shi_shang_f' WHERE sub_style IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE vip_customers SET sub_style = 'gu_dian_f' WHERE sub_style IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE vip_customers SET sub_style = 'zi_ran_f' WHERE sub_style IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE vip_customers SET sub_style = 'xi_ju_f' WHERE sub_style IN ('大牌风', '气场女王', 'retro_vintage');

-- 4.3 style_test_results main_style
UPDATE style_test_results SET main_style = 'shao_nv' WHERE main_style IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE style_test_results SET main_style = 'you_ya' WHERE main_style IN ('知性风', '法式优雅', 'french_elegant');
UPDATE style_test_results SET main_style = 'lang_man_f' WHERE main_style IN ('名媛风', '浪漫女神');
UPDATE style_test_results SET main_style = 'shao_nian_f' WHERE main_style IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE style_test_results SET main_style = 'shi_shang_f' WHERE main_style IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE style_test_results SET main_style = 'gu_dian_f' WHERE main_style IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE style_test_results SET main_style = 'zi_ran_f' WHERE main_style IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE style_test_results SET main_style = 'xi_ju_f' WHERE main_style IN ('大牌风', '气场女王', 'retro_vintage');

-- 4.4 style_test_results sub_style
UPDATE style_test_results SET sub_style = 'shao_nv' WHERE sub_style IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE style_test_results SET sub_style = 'you_ya' WHERE sub_style IN ('知性风', '法式优雅', 'french_elegant');
UPDATE style_test_results SET sub_style = 'lang_man_f' WHERE sub_style IN ('名媛风', '浪漫女神');
UPDATE style_test_results SET sub_style = 'shao_nian_f' WHERE sub_style IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE style_test_results SET sub_style = 'shi_shang_f' WHERE sub_style IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE style_test_results SET sub_style = 'gu_dian_f' WHERE sub_style IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE style_test_results SET sub_style = 'zi_ran_f' WHERE sub_style IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE style_test_results SET sub_style = 'xi_ju_f' WHERE sub_style IN ('大牌风', '气场女王', 'retro_vintage');

-- 4.5 stores style_position
UPDATE stores SET style_position = 'shao_nv' WHERE style_position IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE stores SET style_position = 'you_ya' WHERE style_position IN ('知性风', '法式优雅', 'french_elegant');
UPDATE stores SET style_position = 'lang_man_f' WHERE style_position IN ('名媛风', '浪漫女神');
UPDATE stores SET style_position = 'shao_nian_f' WHERE style_position IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE stores SET style_position = 'shi_shang_f' WHERE style_position IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE stores SET style_position = 'gu_dian_f' WHERE style_position IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE stores SET style_position = 'zi_ran_f' WHERE style_position IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE stores SET style_position = 'xi_ju_f' WHERE style_position IN ('大牌风', '气场女王', 'retro_vintage');

-- ================================================================
-- 第5步：最终全量刷新所有店铺会员统计
-- ================================================================
DO $$
DECLARE
  store_rec RECORD;
BEGIN
  FOR store_rec IN SELECT id FROM stores LOOP
    PERFORM refresh_store_member_stats(store_rec.id);
  END LOOP;
END $$;

-- ================================================================
-- 验证查询（可选，取消注释后执行）
-- ================================================================
-- SELECT DISTINCT main_style FROM vip_customers WHERE main_style NOT IN (
--   'shao_nv','you_ya','lang_man_f','shao_nian_f','shi_shang_f','gu_dian_f','zi_ran_f','xi_ju_f'
-- ) AND main_style IS NOT NULL;
--
-- SELECT DISTINCT color_season FROM vip_customers WHERE color_season NOT IN (
--   'light_warm','warm_bright','clear_warm','light_cool','soft_cool','cool_soft',
--   'warm_soft','soft_warm','deep_warm','clear_cool','cool_bright','deep_cool'
-- ) AND color_season IS NOT NULL;

-- ================================================================
-- 迁移脚本：将 main_style / sub_style 字段中的旧市场名归一化为拼音 key
-- 执行前请备份数据
-- ================================================================

-- ==================== 1. vip_customers 表 ====================
UPDATE vip_customers SET main_style = 'shao_nv' WHERE main_style IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE vip_customers SET main_style = 'you_ya' WHERE main_style IN ('知性风', '法式优雅', 'french_elegant');
UPDATE vip_customers SET main_style = 'lang_man_f' WHERE main_style IN ('名媛风', '浪漫女神');
UPDATE vip_customers SET main_style = 'shao_nian_f' WHERE main_style IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE vip_customers SET main_style = 'shi_shang_f' WHERE main_style IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE vip_customers SET main_style = 'gu_dian_f' WHERE main_style IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE vip_customers SET main_style = 'zi_ran_f' WHERE main_style IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE vip_customers SET main_style = 'xi_ju_f' WHERE main_style IN ('大牌风', '气场女王', 'retro_vintage');

UPDATE vip_customers SET sub_style = 'shao_nv' WHERE sub_style IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE vip_customers SET sub_style = 'you_ya' WHERE sub_style IN ('知性风', '法式优雅', 'french_elegant');
UPDATE vip_customers SET sub_style = 'lang_man_f' WHERE sub_style IN ('名媛风', '浪漫女神');
UPDATE vip_customers SET sub_style = 'shao_nian_f' WHERE sub_style IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE vip_customers SET sub_style = 'shi_shang_f' WHERE sub_style IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE vip_customers SET sub_style = 'gu_dian_f' WHERE sub_style IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE vip_customers SET sub_style = 'zi_ran_f' WHERE sub_style IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE vip_customers SET sub_style = 'xi_ju_f' WHERE sub_style IN ('大牌风', '气场女王', 'retro_vintage');

-- ==================== 2. style_test_results 表 ====================
UPDATE style_test_results SET main_style = 'shao_nv' WHERE main_style IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE style_test_results SET main_style = 'you_ya' WHERE main_style IN ('知性风', '法式优雅', 'french_elegant');
UPDATE style_test_results SET main_style = 'lang_man_f' WHERE main_style IN ('名媛风', '浪漫女神');
UPDATE style_test_results SET main_style = 'shao_nian_f' WHERE main_style IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE style_test_results SET main_style = 'shi_shang_f' WHERE main_style IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE style_test_results SET main_style = 'gu_dian_f' WHERE main_style IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE style_test_results SET main_style = 'zi_ran_f' WHERE main_style IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE style_test_results SET main_style = 'xi_ju_f' WHERE main_style IN ('大牌风', '气场女王', 'retro_vintage');

UPDATE style_test_results SET sub_style = 'shao_nv' WHERE sub_style IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE style_test_results SET sub_style = 'you_ya' WHERE sub_style IN ('知性风', '法式优雅', 'french_elegant');
UPDATE style_test_results SET sub_style = 'lang_man_f' WHERE sub_style IN ('名媛风', '浪漫女神');
UPDATE style_test_results SET sub_style = 'shao_nian_f' WHERE sub_style IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE style_test_results SET sub_style = 'shi_shang_f' WHERE sub_style IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE style_test_results SET sub_style = 'gu_dian_f' WHERE sub_style IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE style_test_results SET sub_style = 'zi_ran_f' WHERE sub_style IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE style_test_results SET sub_style = 'xi_ju_f' WHERE sub_style IN ('大牌风', '气场女王', 'retro_vintage');

-- ==================== 3. stores 表 style_position 字段 ====================
UPDATE stores SET style_position = 'shao_nv' WHERE style_position IN ('淑女风', '甜美少女', 'korean_fresh');
UPDATE stores SET style_position = 'you_ya' WHERE style_position IN ('知性风', '法式优雅', 'french_elegant');
UPDATE stores SET style_position = 'lang_man_f' WHERE style_position IN ('名媛风', '浪漫女神');
UPDATE stores SET style_position = 'shao_nian_f' WHERE style_position IN ('中性风', '简约通勤', 'minimal_commute');
UPDATE stores SET style_position = 'shi_shang_f' WHERE style_position IN ('潮牌风', '街头潮牌', 'sport_casual', 'street_trend');
UPDATE stores SET style_position = 'gu_dian_f' WHERE style_position IN ('职业风', '轻奢极简', 'luxury_minimal', 'chinese_style');
UPDATE stores SET style_position = 'zi_ran_f' WHERE style_position IN ('休闲风', '日系文艺', 'japanese_art', 'bohemian');
UPDATE stores SET style_position = 'xi_ju_f' WHERE style_position IN ('大牌风', '气场女王', 'retro_vintage');

-- ==================== 4. 刷新所有店铺会员统计 ====================
DO $$
DECLARE
  store_rec RECORD;
BEGIN
  FOR store_rec IN SELECT id FROM stores LOOP
    PERFORM refresh_store_member_stats(store_rec.id);
  END LOOP;
END $$;

-- ==================== 5. 验证 ====================
-- 检查是否还有未归一化的值
-- SELECT DISTINCT main_style FROM vip_customers WHERE main_style NOT IN (
--   'shao_nv','you_ya','lang_man_f','shao_nian_f','shi_shang_f','gu_dian_f','zi_ran_f','xi_ju_f',
--   'xi_ju_m','zi_ran_m','gu_dian_m','lang_man_m','shi_shang_m'
-- ) AND main_style IS NOT NULL;

-- ============================================================
-- 组货面积档位 UPDATE：面积仅作软参考，风情/风格数由店铺VIP构成决定
-- 配套 engine.ts 修正（commit 247cc8f1）：去除 ≤30㎡ 硬锁 1 杆
-- 仅 UPDATE，不 DROP，不会清掉 store_style_mix 等已填数据
-- 直接在 Supabase Dashboard → SQL Editor 执行
-- ============================================================

UPDATE store_area_config SET mood_count_min=1, mood_count_max=3,  style_count='以VIP构成为准（参考1种）'     WHERE area_max=30;
UPDATE store_area_config SET mood_count_min=1, mood_count_max=4,  style_count='以VIP构成为准（参考2-3种）'   WHERE area_min=31  AND area_max=150;
UPDATE store_area_config SET mood_count_min=1, mood_count_max=6,  style_count='以VIP构成为准（参考多风格）'  WHERE area_min=151 AND area_max=240;
UPDATE store_area_config SET mood_count_min=1, mood_count_max=12, style_count='以VIP构成为准（参考全风格）'  WHERE area_min=241;

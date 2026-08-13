-- ============================================================
-- 2026-08-13 虚拟试衣套餐规格调整后的权益规范化
-- 新规格：首单 9.9/10次、月卡 99/120次、季卡 199/280次、年卡 699/1000次
-- 说明：新套餐次数为“通用次数”，统一计入 normal_left，pro_left 清 0
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1) 规范新类型（按新套餐发放时已写入 type=first/month/quarter/year 的记录）
UPDATE public.tryon_entitlements
SET
  normal_left = CASE type
    WHEN 'first' THEN 10
    WHEN 'month' THEN 120
    WHEN 'quarter' THEN 280
    WHEN 'year' THEN 1000
    ELSE normal_left
  END,
  pro_left = 0,
  tries_left = CASE type
    WHEN 'first' THEN 10
    WHEN 'month' THEN 120
    WHEN 'quarter' THEN 280
    WHEN 'year' THEN 1000
    ELSE tries_left
  END,
  updated_at = now()
WHERE type IN ('first','month','quarter','year');

-- 2) 【可选】旧类型（normal_month/pro_month/pro_year）按金额映射到新规格
-- 注意：这会改变旧用户的有效期与剩余次数，请确认后再取消注释执行。
-- normal_month ￥59 → 映射为 month ￥99/120次（按新规格）
-- pro_month    ￥199 → 映射为 quarter ￥199/280次
-- pro_year     ￥999 → 映射为 year ￥699/1000次
-- UPDATE public.tryon_entitlements
-- SET type = CASE type
--     WHEN 'normal_month' THEN 'month'
--     WHEN 'pro_month' THEN 'quarter'
--     WHEN 'pro_year' THEN 'year'
--     ELSE type
--   END,
--   normal_left = CASE type
--     WHEN 'normal_month' THEN 120
--     WHEN 'pro_month' THEN 280
--     WHEN 'pro_year' THEN 1000
--     ELSE normal_left
--   END,
--   pro_left = 0,
--   tries_left = CASE type
--     WHEN 'normal_month' THEN 120
--     WHEN 'pro_month' THEN 280
--     WHEN 'pro_year' THEN 1000
--     ELSE tries_left
--   END,
--   updated_at = now()
-- WHERE type IN ('normal_month','pro_month','pro_year');

SELECT 'tryon entitlements normalized to new specs' AS result;

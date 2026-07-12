-- ============================================
-- 为 site_assets 表添加 value 列
-- 用途：存储 JSON 结构的站点配置/图片模块
--   - diagnosis_blocks / style_test_blocks：图片模块（URL 数组 JSON）
--   - diagnosis_booking：形象诊断预约配置（JSON 对象）
-- 该列此前漏建，导致公开 API 与后台保存全部失败、上传的图片不显示。
-- 在 Supabase Dashboard > SQL Editor 中执行本文件即可。
-- ============================================

ALTER TABLE public.site_assets
  ADD COLUMN IF NOT EXISTS value TEXT DEFAULT NULL;

-- 验证
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'site_assets'
  AND column_name = 'value';

-- ============================================================
-- 20260719_assortment_marketing
-- 扩展 assortment_plans：marketing JSONB（文案/图片/关键词）
-- 请在 Supabase SQL Editor 执行（接在 20260719_assortment 之后）
-- ============================================================

ALTER TABLE assortment_plans ADD COLUMN IF NOT EXISTS marketing JSONB DEFAULT NULL;

COMMENT ON COLUMN assortment_plans.marketing IS '营销资产：headline, subheadline, selling_points, cta, image_keywords, banner_image_url, banner_prompt, source_report, promo_id, site_asset_id';

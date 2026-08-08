-- ============================================================
-- 20260723 风格诊断结果映射（本系统色彩季型 + 风格）
-- 与商品/组货打标同构（TEXT[]），诊断结果可直接喂 recommend_products_by_season(p_seasons, p_styles)。
-- 幂等：可重复执行。请在 Supabase SQL Editor 执行。
-- ============================================================
ALTER TABLE style_diagnoses ADD COLUMN IF NOT EXISTS result_color_seasons TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE style_diagnoses ADD COLUMN IF NOT EXISTS result_style_tags TEXT[] NOT NULL DEFAULT '{}';

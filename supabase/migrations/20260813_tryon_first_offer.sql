-- ============================================================
-- 销售代理 MVP · 修正：免费试用(前100名) → 首单1元换衣
-- 骆芷蝶·智选
-- 手动在 Supabase Dashboard → SQL Editor 执行（一次即可）
-- 说明：本迁移清理旧的 free-trial 方案，改为「每人首单 1 元换衣」标记。
-- ============================================================

-- ① 清理旧的免费试用方案（若之前已在库中存在则清理，不存在则跳过）
DROP FUNCTION IF EXISTS public.claim_tryon_free_trial(uuid);

DROP TABLE IF EXISTS public.tryon_free_trials;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tryon_free_claimed'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN tryon_free_claimed;
  END IF;
END $$;

-- ② 新增：首单 1 元换衣是否已使用（每人仅 1 次）
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tryon_first_offer_used boolean NOT NULL DEFAULT false;

-- 完成提示
SELECT 'tryon_first_offer migration applied' AS result;

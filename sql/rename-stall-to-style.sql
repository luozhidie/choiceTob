-- ============================================================================
-- 档口 → 风格 数据库迁移脚本（手动在 Supabase Dashboard SQL Editor 执行）
-- 仅迁移 schema 标识符；用户可见文案改动已随 Vercel 部署生效。
--
-- 涉及对象：
--   1) peer_stalls          → peer_styles
--   2) stall_reviews        → style_reviews
--   3) stall_subscriptions  → style_subscriptions
--   4) 列：stall_reviews.stall_id → style_reviews.style_id
--   5) 列：stall_subscriptions.stall_id → style_subscriptions.style_id
--   6) 外键约束、索引、RLS policy 一并重命名
--
-- 兼容性策略：
--   - 重命名后旧表名不再可用，已部署的 Vercel 代码已改成"风格"语义但仍引用
--     .from('peer_stalls') 等，因此必须在执行本脚本前/后同步部署。
--   - 若希望新旧表名并存（迁移过渡期），把下方 RENAME 改为
--     CREATE VIEW peer_stalls AS SELECT * FROM peer_styles; 反之亦然。
--   - 本脚本采用"直接重命名"路径，干净但需要停机或蓝绿切换。
-- ============================================================================

BEGIN;

-- 1. 处理 stall_reviews.stall_id 之类依赖外键的列先停掉触发器（如有）
--    假设存在外键 fk_stall_reviews_stall_id，先 drop（如果有）
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE contype = 'f'
      AND conrelid IN ('peer_stalls'::regclass, 'stall_reviews'::regclass, 'stall_subscriptions'::regclass)
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', 'peer_stalls', r.conname);
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', 'stall_reviews', r.conname);
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', 'stall_subscriptions', r.conname);
  END LOOP;
END $$;

-- 2. 重命名列：stall_id → style_id（在两个从表里）
ALTER TABLE stall_reviews       RENAME COLUMN stall_id TO style_id;
ALTER TABLE stall_subscriptions RENAME COLUMN stall_id TO style_id;

-- 3. 重命名表
ALTER TABLE peer_stalls         RENAME TO peer_styles;
ALTER TABLE stall_reviews       RENAME TO style_reviews;
ALTER TABLE stall_subscriptions RENAME TO style_subscriptions;

-- 4. 重建外键（指向新表 peer_styles.id）
DO $$
BEGIN
  -- 重命名外键约束到统一命名
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'style_reviews_style_id_fkey') THEN
    ALTER TABLE style_reviews RENAME CONSTRAINT style_reviews_style_id_fkey TO style_reviews_style_id_fkey;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'style_reviews_style_id_fkey'
  ) THEN
    ALTER TABLE style_reviews
      ADD CONSTRAINT style_reviews_style_id_fkey
      FOREIGN KEY (style_id) REFERENCES peer_styles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'style_subscriptions_style_id_fkey'
  ) THEN
    ALTER TABLE style_subscriptions
      ADD CONSTRAINT style_subscriptions_style_id_fkey
      FOREIGN KEY (style_id) REFERENCES peer_styles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 5. 重建索引（保留原索引名语义，重命名为新表风格）
DO $$
DECLARE idx record;
BEGIN
  FOR idx IN
    SELECT indexname, indexdef FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename IN ('peer_styles', 'style_reviews', 'style_subscriptions')
  LOOP
    -- 已是新名的跳过；老名（如 stall_reviews_*）需要 rename
    IF idx.indexname LIKE 'stall_reviews_%' THEN
      EXECUTE format('ALTER INDEX %I RENAME TO %I',
        idx.indexname,
        replace(idx.indexname, 'stall_reviews_', 'style_reviews_'));
    ELSIF idx.indexname LIKE 'stall_subscriptions_%' THEN
      EXECUTE format('ALTER INDEX %I RENAME TO %I',
        idx.indexname,
        replace(idx.indexname, 'stall_subscriptions_', 'style_subscriptions_'));
    ELSIF idx.indexname LIKE 'peer_stalls_%' THEN
      EXECUTE format('ALTER INDEX %I RENAME TO %I',
        idx.indexname,
        replace(idx.indexname, 'peer_stalls_', 'peer_styles_'));
    END IF;
  END LOOP;
END $$;

-- 6. RLS policy 重命名（如果之前用 *_stall_* 命名）
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('peer_styles', 'style_reviews', 'style_subscriptions')
  LOOP
    IF p.policyname LIKE '%stall%' THEN
      EXECUTE format('ALTER POLICY %I ON %I RENAME TO %I',
        p.policyname, p.tablename,
        replace(p.policyname, 'stall', 'style'));
    END IF;
  END LOOP;
END $$;

-- 7. 校验
SELECT
  to_regclass('public.peer_styles')         AS peer_styles,
  to_regclass('public.style_reviews')       AS style_reviews,
  to_regclass('public.style_subscriptions') AS style_subscriptions;

COMMIT;

-- ============================================================================
-- 部署顺序：
-- 1) 在 Supabase SQL Editor 跑本脚本（DB 改名生效）
-- 2) 改 Vercel 端 API 代码：.from('peer_stalls') → .from('peer_styles') 等
--    这些已经在本会话里修改完（见仓库 src/app/api/）
-- 3) Vercel 自动部署生效
-- ============================================================================
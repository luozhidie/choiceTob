-- ============================================================================
-- 迁移脚本：清理 coupons / red_packets 表 CHECK 约束中残留的 invite_reward 枚举
-- ----------------------------------------------------------------------------
-- 背景：
--   supabase-membership-system.sql 用
--     ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_type ... CHECK (... IN ('general','vip_gift','festival'))
--   方式补充字段。但线上库若此前已执行过含 'invite_reward' 的旧版本约束，
--   "ADD COLUMN IF NOT EXISTS" 不会重建列，旧 CHECK 约束（含 invite_reward）会一直留在线上库。
--   本脚本把这两列的 CHECK 约束精确重置为干净枚举，移除 invite_reward。
--
-- 适用范围：public.coupons、public.red_packets（仅 coupon_type / packet_type 两列）
-- 幂等性：   已干净则自动跳过；含 invite_reward 才修复。不会误删其他约束。
-- 使用方式：登录 Supabase → SQL Editor → 粘贴执行 → 查看最底部的“执行后自查”结果。
-- 注意：    这是手动迁移脚本，不走 CI；请在生产库执行后保留本文件以备复查。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0) 执行前自查：列出当前 public 模式中所有含 invite_reward 的 CHECK 约束
--    （若结果为空，说明线上库已干净，可不必执行下方修复段）
-- ----------------------------------------------------------------------------
SELECT
  n.nspname      AS schema,
  t.relname      AS table,
  c.conname      AS constraint_name,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t     ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE c.contype = 'c'
  AND n.nspname = 'public'
  AND pg_get_constraintdef(c.oid) LIKE '%invite_reward%'
ORDER BY t.relname, c.conname;


-- ----------------------------------------------------------------------------
-- 1) 修复 coupons.coupon_type
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_cname TEXT;
  v_exists BOOLEAN;
BEGIN
  -- 找到 coupons 表上、与 coupon_type 相关且仍含 invite_reward 的 CHECK 约束
  SELECT c.conname
    INTO v_cname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
   WHERE c.contype = 'c'
     AND t.relname = 'coupons'
     AND pg_get_constraintdef(c.oid) LIKE '%invite_reward%'
   LIMIT 1;

  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE coupons DROP CONSTRAINT %I', v_cname);

    -- 重建为干净约束（若已存在同名干净约束则跳过，避免重复）
    SELECT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE c.contype = 'c'
        AND t.relname = 'coupons'
        AND c.conname = 'coupons_coupon_type_check'
    ) INTO v_exists;

    IF NOT v_exists THEN
      EXECUTE 'ALTER TABLE coupons ADD CONSTRAINT coupons_coupon_type_check CHECK (coupon_type IN (''general'',''vip_gift'',''festival''))';
    END IF;

    RAISE NOTICE 'coupons: 已移除 invite_reward（原约束 %）', v_cname;
  ELSE
    RAISE NOTICE 'coupons: 未发现含 invite_reward 的约束，无需处理';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 2) 修复 red_packets.packet_type
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_cname TEXT;
  v_exists BOOLEAN;
BEGIN
  SELECT c.conname
    INTO v_cname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
   WHERE c.contype = 'c'
     AND t.relname = 'red_packets'
     AND pg_get_constraintdef(c.oid) LIKE '%invite_reward%'
   LIMIT 1;

  IF v_cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE red_packets DROP CONSTRAINT %I', v_cname);

    SELECT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_class t ON t.oid = c.conrelid
      WHERE c.contype = 'c'
        AND t.relname = 'red_packets'
        AND c.conname = 'red_packets_packet_type_check'
    ) INTO v_exists;

    IF NOT v_exists THEN
      EXECUTE 'ALTER TABLE red_packets ADD CONSTRAINT red_packets_packet_type_check CHECK (packet_type IN (''general'',''vip_gift'',''festival''))';
    END IF;

    RAISE NOTICE 'red_packets: 已移除 invite_reward（原约束 %）', v_cname;
  ELSE
    RAISE NOTICE 'red_packets: 未发现含 invite_reward 的约束，无需处理';
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 3) 执行后自查：再次列出含 invite_reward 的约束（应为空）并打印两列当前约束
-- ----------------------------------------------------------------------------
SELECT
  n.nspname AS schema,
  t.relname AS table,
  c.conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t     ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE c.contype = 'c'
  AND n.nspname = 'public'
  AND t.relname IN ('coupons', 'red_packets')
ORDER BY t.relname, c.conname;

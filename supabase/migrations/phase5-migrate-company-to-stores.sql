-- ================================================================
-- Phase 5 #81: 迁移 vip_customers.company → stores 表
-- 执行方法：在 Supabase SQL Editor 中逐段执行
-- ================================================================

-- ==================== 第1段：预览待迁移数据 ====================
-- 先看看有哪些 company 值需要迁移
SELECT DISTINCT company, COUNT(*) as member_count
FROM vip_customers
WHERE company IS NOT NULL AND company != ''
GROUP BY company
ORDER BY member_count DESC;

-- ==================== 第2段：创建 stores 记录 ====================
-- 为每个不重复的 company 创建 stores 记录（INSERT ... ON CONFLICT DO NOTHING 防重复）
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

-- 验证：查看已创建的 stores
SELECT id, name, status, created_at FROM stores ORDER BY created_at DESC;

-- ==================== 第3段：回填 vip_customers.store_id ====================
-- 将 vip_customers.store_id 关联至对应的 stores.id
UPDATE vip_customers
SET store_id = s.id
FROM stores s
WHERE vip_customers.company = s.name
  AND vip_customers.store_id IS NULL;

-- 验证：查看关联结果
SELECT
  v.id,
  v.name as member_name,
  v.company,
  v.store_id,
  s.name as store_name
FROM vip_customers v
LEFT JOIN stores s ON v.store_id = s.id
WHERE v.company IS NOT NULL AND v.company != ''
LIMIT 20;

-- ==================== 第4段：刷新所有 stores 的会员统计 ====================
-- 对每个有VIP的店铺，刷新 member_stats
DO $$
DECLARE
  store_rec RECORD;
BEGIN
  FOR store_rec IN SELECT id FROM stores LOOP
    PERFORM refresh_store_member_stats(store_rec.id);
  END LOOP;
END $$;

-- 验证：查看刷新后的统计
SELECT id, name, member_stats->>'total_vip_count' as total_vip FROM stores ORDER BY created_at DESC;

-- ==================== 第5段（可选）：清理 company 字段 ====================
-- 确认 store_id 已全部回填后，可删除 company 字段
-- ALTER TABLE vip_customers DROP COLUMN IF EXISTS company;

-- 但如果"买手选品"页面还在用 company 字段，先保留
-- 查看是否还有页面依赖 company 字段：
-- SELECT COUNT(*) FROM vip_customers WHERE company IS NOT NULL AND store_id IS NULL;

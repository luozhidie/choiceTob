-- 修复 stock_watchlist: 补 industry 列 + 确保 service-role 可写入
-- 问题: 原建表缺少 industry 列, 且 RLS 可能拦截 service-role 写入

-- 1. 添加缺失的 industry 列
ALTER TABLE stock_watchlist ADD COLUMN IF NOT EXISTS industry TEXT NOT NULL DEFAULT '其他';

-- 2. 确保 RLS 已启用（如已启用则跳过）
ALTER TABLE stock_watchlist FORCE ROW LEVEL SECURITY;

-- 3. 允许 service_role 绕过所有策略（BYPASSRLS）
--    Supabase 内置: service_role 自动绕过 RLS，无需额外 policy
--    此处仅做防御性确认：如果有 USING/CHECK 约束导致问题，清除之

-- 删除可能存在的过严策略（保留基本的 auth.users 关联策略）
DO $$
BEGIN
  -- 如果存在阻止插入的策略，删除并重建为宽松版本
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stock_watchlist' AND policyname LIKE '%insert%' OR policyname LIKE '%all%'
  ) THEN
    DROP POLICY IF EXISTS "stock_watchlist_insert_policy" ON stock_watchlist;
    DROP POLICY IF EXISTS "stock_watchlist_all_policy" ON stock_watchlist;
  END IF;
END $$;

-- 创建/更新宽松策略: 允许已认证用户读写自己的数据 + service-role 全权
CREATE POLICY "stock_watchlist_select" ON stock_watchlist
  FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "stock_watchlist_insert" ON stock_watchlist
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "stock_watchlist_update" ON stock_watchlist
  FOR UPDATE USING (auth.role() = 'service_role' OR auth.uid() = user_id)
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);

CREATE POLICY "stock_watchlist_delete" ON stock_watchlist
  FOR DELETE USING (auth.role() = 'service_role' OR auth.uid() = user_id);

-- 4. stock_snapshots 也做同样处理（防类似问题）
ALTER TABLE stock_snapshots FORCE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "stock_snapshots_all_policy" ON stock_snapshots;
END $$;

CREATE POLICY "stock_snapshots_select" ON stock_snapshots
  FOR SELECT USING (true); -- 快照表公开可读（无敏感数据）

CREATE POLICY "stock_snapshots_insert" ON stock_snapshots
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "stock_snapshots_update" ON stock_snapshots
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "stock_snapshots_delete" ON stock_snapshots
  FOR DELETE USING (auth.role() = 'service_role');

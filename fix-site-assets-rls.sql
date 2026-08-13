-- 修复 site_assets 表 RLS 策略，允许已认证用户管理
ALTER TABLE site_assets ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Public can view site assets" ON site_assets;
DROP POLICY IF EXISTS "Authenticated can manage site assets" ON site_assets;

-- 查看策略：任何人
CREATE POLICY "site_assets_select_all" ON site_assets
  FOR SELECT TO anon, authenticated
  USING (true);

-- 插入/更新/删除：已认证用户（管理员在客户端校验）
CREATE POLICY "site_assets_insert_auth" ON site_assets
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "site_assets_update_auth" ON site_assets
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "site_assets_delete_auth" ON site_assets
  FOR DELETE TO authenticated
  USING (true);

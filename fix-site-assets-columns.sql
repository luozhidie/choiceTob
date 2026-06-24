-- 修复 site_assets 表：添加轮播图管理所需的列
-- 执行时间: 2025-06-24

-- 1. 添加 link_url 列（轮播图跳转链接）
ALTER TABLE site_assets 
  ADD COLUMN IF NOT EXISTS link_url TEXT DEFAULT NULL;

-- 2. 添加 sort_order 列（排序顺序）
ALTER TABLE site_assets 
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 3. 添加 is_published 列（是否展示，轮播图用）
ALTER TABLE site_assets 
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_site_assets_sort_order ON site_assets(sort_order);
CREATE INDEX IF NOT EXISTS idx_site_assets_is_published ON site_assets(is_published);

-- 5. 更新现有数据：设置合理的sort_order
UPDATE site_assets SET sort_order = 0 WHERE sort_order IS NULL;

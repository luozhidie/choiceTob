-- 修复 products 表 RLS 策略和缺失列

-- 启用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 添加 sort_order 列（前端查询用）
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 清理旧策略
DROP POLICY IF EXISTS "p" ON products;
DROP POLICY IF EXISTS "a" ON products;
DROP POLICY IF EXISTS "Allow public read published products" ON products;
DROP POLICY IF EXISTS "Allow admin full access on products" ON products;

-- 公开读取：匿名和登录用户都可读已发布商品
CREATE POLICY "Allow public read published products"
  ON products FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- 管理员全权限
CREATE POLICY "Allow admin full access on products"
  ON products FOR ALL TO authenticated
  USING (auth.email() = 'luozhidie@live.cn')
  WITH CHECK (auth.email() = 'luozhidie@live.cn');

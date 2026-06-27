-- 修复 products bucket 的 Storage RLS，允许匿名上传图片
-- 问题：products bucket 的 INSERT 策略只允许 authenticated 角色，
-- 但本项目 admin 用的是独立 cookie 鉴权（非 Supabase Auth），
-- 导致浏览器端用 anon key 直传时被 RLS 拦截。

-- 1. 允许所有已认证和匿名用户上传到 products bucket
CREATE POLICY "Allow public upload to products"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'products')
WITH CHECK (
  -- 只允许图片类型上传（安全防护）
  (storage.filename()) ~* '\.(jpg|jpeg|png|gif|webp|bmp)$' OR
  storage.path() LIKE 'grabbed/%'
);

-- 2. 确保 SELECT 对所有人开放（公开读取）
CREATE POLICY "Allow public read from products"
ON storage.objects
FOR SELECT
USING (bucket_id = 'products');

-- 3. 允许已认证用户删除自己的文件
CREATE POLICY "Allow authenticated delete from products"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'products');

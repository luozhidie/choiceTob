-- 创建爆款样衣图片存储桶
INSERT INTO storage.buckets (id, name, public) VALUES ('hot-product-images', 'hot-product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 允许任何人读取
DROP POLICY IF EXISTS "select_hot_product_images" ON storage.objects;
CREATE POLICY "select_hot_product_images" ON storage.objects
  FOR SELECT USING (bucket_id = 'hot-product-images');

-- 允许已认证用户上传
DROP POLICY IF EXISTS "insert_hot_product_images" ON storage.objects;
CREATE POLICY "insert_hot_product_images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'hot-product-images');

-- 允许已认证用户删除
DROP POLICY IF EXISTS "delete_hot_product_images" ON storage.objects;
CREATE POLICY "delete_hot_product_images" ON storage.objects
  FOR DELETE USING (bucket_id = 'hot-product-images');

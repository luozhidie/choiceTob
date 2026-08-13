-- 修复所有图片上传 bucket 的 RLS 权限
-- 允许已认证用户上传、删除、读取图片

-- planning-steps-images
CREATE POLICY "Allow authenticated uploads to planning-steps-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'planning-steps-images');

CREATE POLICY "Allow authenticated deletes from planning-steps-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'planning-steps-images');

CREATE POLICY "Allow public reads from planning-steps-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'planning-steps-images');

-- buyer-steps-images
CREATE POLICY "Allow authenticated uploads to buyer-steps-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'buyer-steps-images');

CREATE POLICY "Allow authenticated deletes from buyer-steps-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'buyer-steps-images');

CREATE POLICY "Allow public reads from buyer-steps-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'buyer-steps-images');

-- buyer-features-images
CREATE POLICY "Allow authenticated uploads to buyer-features-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'buyer-features-images');

CREATE POLICY "Allow authenticated deletes from buyer-features-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'buyer-features-images');

CREATE POLICY "Allow public reads from buyer-features-images"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'buyer-features-images');

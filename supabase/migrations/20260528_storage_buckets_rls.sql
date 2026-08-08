-- ============================================================
-- Storage Bucket RLS 配置：magazine-images + trend-images
-- 修复 "new row violates row-level security policy" 错误
-- ============================================================

-- 1. 创建 magazine-images bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'magazine-images',
  'magazine-images',
  true,
  false,
  5242880,  -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[];

-- 清空现有 RLS 策略（避免重复）
DELETE FROM storage.policies WHERE bucket_id = 'magazine-images';

-- magazine-images RLS 策略：任何人可查看，认证用户可上传/修改/删除
CREATE POLICY "Public can view magazine-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'magazine-images');

CREATE POLICY "Authenticated users can upload magazine-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'magazine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update magazine-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'magazine-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete magazine-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'magazine-images' AND auth.role() = 'authenticated');

-- 2. 创建 trend-images bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'trend-images',
  'trend-images',
  true,
  false,
  5242880,  -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[];

-- 清空现有 RLS 策略（避免重复）
DELETE FROM storage.policies WHERE bucket_id = 'trend-images';

-- trend-images RLS 策略
CREATE POLICY "Public can view trend-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trend-images');

CREATE POLICY "Authenticated users can upload trend-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'trend-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update trend-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'trend-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete trend-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'trend-images' AND auth.role() = 'authenticated');

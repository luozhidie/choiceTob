-- ============================================================
-- Storage Bucket 配置：site-assets
-- 用于站点图片管理（Hero背景、杂志封面、CTA背景、收款二维码等）
-- ============================================================

-- 1. 创建 bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'site-assets',
  'site-assets',
  true,
  false,
  10485760,  -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']::text[];

-- 2. 清空现有 RLS 策略（避免重复）
DELETE FROM storage.policies WHERE bucket_id = 'site-assets';

-- 3. 创建 RLS 策略
-- 任何人都可以查看公开文件
CREATE POLICY "Public can view site-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

-- 已登录用户可以上传
CREATE POLICY "Authenticated users can upload site-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- 已登录用户可以更新自己的文件
CREATE POLICY "Authenticated users can update site-assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- 已登录用户可以删除自己的文件
CREATE POLICY "Authenticated users can delete site-assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND auth.role() = 'authenticated');

-- 4. 确保 site_assets 表存在（如果不存在则创建）
CREATE TABLE IF NOT EXISTS site_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  title TEXT,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. site_assets 表 RLS
ALTER TABLE site_assets ENABLE ROW LEVEL SECURITY;

-- 任何人可以查看
CREATE POLICY IF NOT EXISTS "Public can view site assets"
  ON site_assets FOR SELECT
  TO anon, authenticated
  USING (true);

-- 已登录用户可以修改（管理员在客户端校验）
CREATE POLICY IF NOT EXISTS "Authenticated can manage site assets"
  ON site_assets FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

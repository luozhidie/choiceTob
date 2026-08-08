-- 待处理图片表：微信转发/监听器自动上传的图片先落这里，后台可批量分配给商品
CREATE TABLE IF NOT EXISTS scraped_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  filename text,
  bucket text DEFAULT 'products',
  storage_path text,
  status text DEFAULT 'pending',   -- pending | used
  created_at timestamptz DEFAULT now(),
  used_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_scraped_images_status_created
  ON scraped_images (status, created_at DESC);

-- 监听器/脚本用 service_role 写入，后台读取也用 service_role，无需 RLS 策略

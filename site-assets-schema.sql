-- 站点资源图片表（用于首页Hero/杂志/CTA等关键位置）
CREATE TABLE IF NOT EXISTS site_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,           -- 唯一标识：hero_bg / magazine_1 / magazine_2 / cta_bg 等
  title TEXT,                        -- 显示名称
  image_url TEXT NOT NULL,          -- Supabase Storage 公开URL
  alt_text TEXT,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE site_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可读写" ON site_assets
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- 预置默认数据（可选，也可通过后台上传后自动覆盖）
INSERT INTO site_assets (key, title, image_url) VALUES
  ('hero_bg', '首页Hero背景', ''),
  ('magazine_1', '杂志封面-流行趋势', ''),
  ('magazine_2', '杂志封面-搭配灵感', ''),
  ('magazine_3', '杂志封面-行业洞察', ''),
  ('cta_bg', 'CTA区域背景', '')
ON CONFLICT (key) DO NOTHING;

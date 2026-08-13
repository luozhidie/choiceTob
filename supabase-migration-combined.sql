-- ============================================================
-- 迁移 1: hot_picks_memberships 表（爆款样衣独立会员）
-- ============================================================
CREATE TABLE IF NOT EXISTS hot_picks_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')) DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_hot_picks_memberships_user_id ON hot_picks_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_hot_picks_memberships_status ON hot_picks_memberships(status);
CREATE INDEX IF NOT EXISTS idx_hot_picks_memberships_expires_at ON hot_picks_memberships(expires_at);

ALTER TABLE hot_picks_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own hot picks membership"
  ON hot_picks_memberships FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can manage hot picks memberships"
  ON hot_picks_memberships FOR ALL USING (true);

-- updated_at function (如果已存在会跳过)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hot_picks_memberships_updated_at ON hot_picks_memberships;
CREATE TRIGGER update_hot_picks_memberships_updated_at
  BEFORE UPDATE ON hot_picks_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 迁移 2: style_diagnoses 表（色彩风格诊断问卷）
-- ============================================================
CREATE TABLE IF NOT EXISTS style_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  wechat_qr_url TEXT,
  age TEXT NOT NULL,
  video_course_info TEXT,
  look_vs_age TEXT,
  height TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  photo_urls_1 TEXT[],
  photo_urls_2 TEXT[],
  photo_urls_3 TEXT[],
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'archived')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_style_diagnoses_user_id ON style_diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_style_diagnoses_status ON style_diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_style_diagnoses_created_at ON style_diagnoses(created_at DESC);

ALTER TABLE style_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own diagnoses"
  ON style_diagnoses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own diagnoses"
  ON style_diagnoses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Admins can manage all diagnoses"
  ON style_diagnoses FOR ALL USING (true);

DROP TRIGGER IF EXISTS update_style_diagnoses_updated_at ON style_diagnoses;
CREATE TRIGGER update_style_diagnoses_updated_at
  BEFORE UPDATE ON style_diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 存储桶：style-test（用于上传微信二维码和照片）
-- ============================================================
-- 请在 Supabase Dashboard > Storage 手动创建名为 "style-test" 的 bucket（Public）
-- 然后执行以下 RLS 策略：

-- INSERT POLICY: 登录用户可上传自己的文件
-- CREATE POLICY "Users can upload style-test files"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'style-test' AND auth.role() = 'authenticated');

-- SELECT POLICY: 所有人可查看（public bucket）
-- CREATE POLICY "Public can view style-test files"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'style-test');

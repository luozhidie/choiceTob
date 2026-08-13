-- 色彩风格诊断问卷（严格按用户截图表单）
CREATE TABLE IF NOT EXISTS style_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 基础信息 (1-6)
  full_name TEXT NOT NULL,
  wechat_qr_url TEXT,
  age TEXT NOT NULL,
  video_course_info TEXT,
  look_vs_age TEXT,
  height TEXT,

  -- 单选答案 JSON (7-17)
  answers JSONB NOT NULL DEFAULT '{}',

  -- 图片上传 (19-21)
  photo_urls_1 TEXT[],
  photo_urls_2 TEXT[],
  photo_urls_3 TEXT[],

  -- 状态
  status TEXT NOT NULL CHECK (status IN ('pending', 'reviewed', 'archived')) DEFAULT 'pending',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_style_diagnoses_user_id ON style_diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_style_diagnoses_status ON style_diagnoses(status);
CREATE INDEX IF NOT EXISTS idx_style_diagnoses_created_at ON style_diagnoses(created_at DESC);

-- RLS
ALTER TABLE style_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diagnoses"
  ON style_diagnoses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diagnoses"
  ON style_diagnoses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all diagnoses"
  ON style_diagnoses FOR ALL USING (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_style_diagnoses_updated_at ON style_diagnoses;
CREATE TRIGGER update_style_diagnoses_updated_at
  BEFORE UPDATE ON style_diagnoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

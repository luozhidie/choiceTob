-- 色彩风格诊断问卷提交表
CREATE TABLE IF NOT EXISTS style_test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- 基础信息
  full_name TEXT NOT NULL,
  wechat_qr_url TEXT,
  age INTEGER,
  is_video_student BOOLEAN DEFAULT FALSE,
  video_batch TEXT,
  -- 体型外貌
  look_vs_age TEXT,        -- 看上去比同龄人（更年轻/更成熟/差不多）
  height INTEGER,          -- 身高 cm
  look_height_vs_real TEXT, -- 看起来身高vs实际（更高/更矮/差不多）
  good_at_sports TEXT,     -- 擅长体育项目（是：项目名 / 否）
  -- 服装偏好
  formal_vs_casual TEXT,   -- 正装vs休闲
  pants_vs_skirt TEXT,     -- 裤装vs裙装
  dress_vs_half_skirt TEXT, -- 连衣裙vs半裙
  top_vs_outerwear TEXT,   -- 上衣vs外套
  -- 色彩肤色
  skin_tone TEXT,          -- 肤色偏向
  hair_color TEXT,         -- 发色
  eye_color TEXT,          -- 瞳孔色
  preferred_color_temp TEXT, -- 喜欢的色系（暖/冷/中性）
  -- 风格诊断
  bright_vs_plain TEXT,    -- 鲜艳vs素色
  body_line TEXT,          -- 身材线条（曲线/直线/混合）
  face_contour TEXT,       -- 面部轮廓
  improve_areas TEXT[],    -- 希望改善的方面（数组）
  notes TEXT,              -- 备注
  -- 管理
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'archived')),
  admin_notes TEXT,        -- 管理员备注
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_style_test_user ON style_test_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_style_test_status ON style_test_submissions(status);
CREATE INDEX IF NOT EXISTS idx_style_test_created ON style_test_submissions(created_at DESC);

-- RLS 策略
ALTER TABLE style_test_submissions ENABLE ROW LEVEL SECURITY;

-- 用户只能看到自己的提交
CREATE POLICY "Users can view own submissions"
  ON style_test_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 用户只能插入自己的提交
CREATE POLICY "Users can insert own submissions"
  ON style_test_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 管理员可以查看所有
CREATE POLICY "Admins can view all submissions"
  ON style_test_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

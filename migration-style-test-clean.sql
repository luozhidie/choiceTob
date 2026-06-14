CREATE TABLE IF NOT EXISTS style_test_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  wechat_qr_url TEXT,
  age INTEGER,
  is_video_student BOOLEAN DEFAULT FALSE,
  video_batch TEXT,
  look_vs_age TEXT,
  height INTEGER,
  look_height_vs_real TEXT,
  good_at_sports TEXT,
  sports_detail TEXT,
  formal_vs_casual TEXT,
  pants_vs_skirt TEXT,
  dress_vs_half_skirt TEXT,
  top_vs_outerwear TEXT,
  skin_tone TEXT,
  hair_color TEXT,
  eye_color TEXT,
  preferred_color_temp TEXT,
  bright_vs_plain TEXT,
  body_line TEXT,
  face_contour TEXT,
  improve_areas TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_style_test_user ON style_test_submissions(user_id);
CREATE INDEX idx_style_test_status ON style_test_submissions(status);
CREATE INDEX idx_style_test_created ON style_test_submissions(created_at DESC);

ALTER TABLE style_test_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON style_test_submissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own submissions"
  ON style_test_submissions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all"
  ON style_test_submissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

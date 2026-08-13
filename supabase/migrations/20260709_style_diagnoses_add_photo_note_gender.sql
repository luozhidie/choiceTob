-- 风格诊断表补充字段
ALTER TABLE style_diagnoses
  ADD COLUMN IF NOT EXISTS photo_note TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT;

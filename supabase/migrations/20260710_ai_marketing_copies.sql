-- AI 爆款文案 / 营销素材库
CREATE TABLE IF NOT EXISTS ai_marketing_copies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  product_desc TEXT,
  keywords TEXT,
  image_url TEXT,
  platform TEXT NOT NULL,
  tone TEXT,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_marketing_copies_user_id ON ai_marketing_copies(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_marketing_copies_created_at ON ai_marketing_copies(created_at DESC);

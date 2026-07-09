-- AI 生产协同模块：企划/选品结果 → 生产落地方案
CREATE TABLE IF NOT EXISTS ai_production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT,
  season TEXT,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_json JSONB,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_production_orders_user ON ai_production_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_production_orders_created ON ai_production_orders(created_at DESC);

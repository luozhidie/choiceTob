-- trend_history 表：存储历史爆款数据，供趋势分析使用
CREATE TABLE IF NOT EXISTS trend_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  platform TEXT,
  item_id TEXT,
  title TEXT,
  price INTEGER,
  sales_volume INTEGER DEFAULT 0,
  heat_score INTEGER,
  image_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trend_history_keyword ON trend_history(keyword);
CREATE INDEX IF NOT EXISTS idx_trend_history_recorded ON trend_history(recorded_at DESC);

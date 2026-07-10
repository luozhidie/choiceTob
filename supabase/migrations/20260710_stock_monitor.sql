-- 股票监控：观察服装企业/行业行情与财务
-- 阶段1：港股/美股(Yahoo 免 token) + A股(Tushare 预留)
CREATE TABLE IF NOT EXISTS stock_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'hk', -- hk / us / a / jp
  sector TEXT,        -- 环节：上游纺织/中游制造/下游品牌零售
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS stock_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  price NUMERIC,
  change_pct NUMERIC,
  volume BIGINT,
  currency TEXT,
  raw_json JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (symbol)
);

CREATE INDEX IF NOT EXISTS idx_stock_watchlist_user ON stock_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_snapshots_symbol ON stock_snapshots(symbol);

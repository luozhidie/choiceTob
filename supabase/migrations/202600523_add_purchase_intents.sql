-- 采购意向表
CREATE TABLE IF NOT EXISTS purchase_intents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_title TEXT,
  product_price INTEGER,
  quantity INTEGER NOT NULL DEFAULT 1,
  contact TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending', -- pending/submitted/contacted/confirmed/cancelled
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE purchase_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon insert" ON purchase_intents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role all" ON purchase_intents FOR ALL USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_purchase_intents_status ON purchase_intents(status);
CREATE INDEX IF NOT EXISTS idx_purchase_intents_created_at ON purchase_intents(created_at DESC);

-- ============================================================
-- 词元 API 计费（Stripe 外币收款）配套表
-- 在 Supabase Dashboard → SQL Editor 执行一次即可。
-- 前置：token_api_keys 表（supabase-api-keys.sql 已建）
-- ============================================================

-- 1) token_api_keys 增加预付费额度字段（向后兼容：旧 key 这两个字段为 NULL = 不限次按 usage_count 计）
ALTER TABLE token_api_keys
  ADD COLUMN IF NOT EXISTS credit_balance INTEGER,           -- 总预付费调用次数（NULL=不限）
  ADD COLUMN IF NOT EXISTS credit_used    INTEGER NOT NULL DEFAULT 0; -- 已消耗次数

-- 2) 计费订单表：每笔 Stripe 支付对应一条，webhook 履约后 status=paid
CREATE TABLE IF NOT EXISTS token_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id           UUID REFERENCES token_api_keys(id) ON DELETE SET NULL,
  api_key              TEXT,                                 -- 冗余存一份 key，便于后台查看
  package_key          TEXT NOT NULL,                       -- trial / starter / pro
  amount               INTEGER NOT NULL,                    -- 金额（外币最小单位，如美分）
  currency             TEXT NOT NULL DEFAULT 'usd',
  calls                INTEGER NOT NULL,                    -- 该笔授予的调用次数
  buyer_email          TEXT,
  buyer_name           TEXT,
  stripe_session_id    TEXT,
  stripe_payment_intent TEXT,
  status               TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','paid','failed')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_token_orders_status        ON token_orders(status);
CREATE INDEX IF NOT EXISTS idx_token_orders_session       ON token_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_token_orders_key           ON token_orders(api_key_id);

-- 行级安全：匿名不可枚举（计费数据敏感）
ALTER TABLE token_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "token_orders_no_anon" ON token_orders;
CREATE POLICY "token_orders_no_anon" ON token_orders FOR ALL TO anon USING (false);

-- 3) 触发器：更新 updated_at
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_token_orders_updated ON token_orders;
CREATE TRIGGER trg_token_orders_updated
  BEFORE UPDATE ON token_orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 4) 补齐微信支付所需字段（out_trade_no 关联微信订单号；paid_at 记录支付时间）
--    线上表已存在这两列，此处用 IF NOT EXISTS 保证幂等，重建 DB 时不缺列。
ALTER TABLE token_orders
  ADD COLUMN IF NOT EXISTS out_trade_no TEXT,
  ADD COLUMN IF NOT EXISTS paid_at      TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_token_orders_out_trade ON token_orders(out_trade_no);

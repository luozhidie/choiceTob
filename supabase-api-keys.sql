-- ============================================================
-- API 密钥表 (token_api_keys) - 供海外卖家/系统直连词元，按调用量计费
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行
-- 安全：开启 RLS，不建任何 policy（匿名默认不可读写），
--       仅后端 service_role 可绕过 RLS 读写，API Key 不外泄。
-- ============================================================

CREATE TABLE IF NOT EXISTS token_api_keys (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key     TEXT NOT NULL UNIQUE,
  name        TEXT,                       -- 密钥用途/买家备注
  owner       TEXT,                       -- 归属（默认 骆芷蝶）
  status      TEXT DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  usage_count INT DEFAULT 0,              -- 累计调用次数（计费依据）
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ                 -- 软删除
);

CREATE INDEX IF NOT EXISTS idx_token_api_keys_key    ON token_api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_token_api_keys_deleted ON token_api_keys(deleted_at);

-- 仅后端 service_role 读写；此处不建 SELECT policy，确保匿名无法枚举 Key
ALTER TABLE token_api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS token_api_keys_select ON token_api_keys;
DROP POLICY IF EXISTS token_api_keys_insert ON token_api_keys;
DROP POLICY IF EXISTS token_api_keys_update ON token_api_keys;
DROP POLICY IF EXISTS token_api_keys_delete ON token_api_keys;

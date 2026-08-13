-- AI 时尚助手交互日志（数据落表）
-- 覆盖：AI搭配 / 商品企划 / 买手组货 / 陈列搭配 / 营销策划 / 销售服务 / 品牌管理 / 服装设计
CREATE TABLE IF NOT EXISTS ai_fashion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL DEFAULT 'outfit',
  service TEXT,
  input_json JSONB,
  result_json JSONB NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_fashion_logs_user_id ON ai_fashion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_fashion_logs_task_type ON ai_fashion_logs(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_fashion_logs_created_at ON ai_fashion_logs(created_at DESC);

ALTER TABLE ai_fashion_logs ENABLE ROW LEVEL SECURITY;

-- 前端/普通用户不直接访问此表；所有读写经后端服务密钥（service_role 默认绕过 RLS）。
-- 显式拒绝 anon / authenticated 直连，避免越权读取管理员 AI 记录。
DROP POLICY IF EXISTS "deny_public_ai_fashion_logs" ON ai_fashion_logs;
CREATE POLICY "deny_public_ai_fashion_logs"
  ON ai_fashion_logs
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

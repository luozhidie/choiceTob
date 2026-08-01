-- ============================================================
-- 词元资产表 (selection_tokens) - 选品判断词元等，跨行业可扩展
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行
-- 说明：domain 行业（服装/金融/股票/艺术/其他）、category 类型均可按需扩展
-- ============================================================

CREATE TABLE IF NOT EXISTS selection_tokens (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain      TEXT NOT NULL DEFAULT '服装' CHECK (domain IN ('服装','金融','股票','艺术','其他')),
  category    TEXT NOT NULL DEFAULT '选品判断' CHECK (category IN ('选品判断','搭配方案','客户画像','销售方法','行业经验','其他')),
  title       TEXT NOT NULL,
  summary     TEXT,                       -- 一句话判断逻辑
  fields      JSONB DEFAULT '{}'::jsonb,  -- 结构化字段（品类/季节/客群/价格带/爆款信号/风险点...）
  prompt      TEXT,                       -- 可调用、可组合的提示词/逻辑
  tags        TEXT[] DEFAULT '{}',        -- 组合标签
  metric      TEXT,                       -- 计量标签（命中率/ROI 等，为交易做准备）
  status      TEXT DEFAULT 'draft' CHECK (status IN ('draft','published')),
  usage_count INT DEFAULT 0,              -- 被调用次数
  owner       TEXT,                       -- 作者/来源
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ                 -- 软删除
);

CREATE INDEX IF NOT EXISTS idx_selection_tokens_domain   ON selection_tokens(domain);
CREATE INDEX IF NOT EXISTS idx_selection_tokens_category ON selection_tokens(category);
CREATE INDEX IF NOT EXISTS idx_selection_tokens_status   ON selection_tokens(status);
CREATE INDEX IF NOT EXISTS idx_selection_tokens_deleted  ON selection_tokens(deleted_at);

-- RLS：管理端走 service_role 绕过；此处对匿名开放只读，保证页面可列
ALTER TABLE selection_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS selection_tokens_select ON selection_tokens;
CREATE POLICY selection_tokens_select ON selection_tokens FOR SELECT USING (true);
DROP POLICY IF EXISTS selection_tokens_insert ON selection_tokens FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS selection_tokens_update ON selection_tokens FOR UPDATE USING (true);
DROP POLICY IF EXISTS selection_tokens_delete ON selection_tokens FOR DELETE USING (true);

-- updated_at 自动更新（函数已存在于 crm 建表脚本，CREATE OR REPLACE 幂等）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_selection_tokens_updated ON selection_tokens;
CREATE TRIGGER trg_selection_tokens_updated BEFORE UPDATE ON selection_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

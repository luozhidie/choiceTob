-- ============================================
-- AI企划报告：数据库迁移
-- ============================================

-- 1. planning_reports 表增加字段（关联用户、存储AI报告JSON）
ALTER TABLE planning_reports 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES planning_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report_json JSONB,
  ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS admin_note TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- 2. planning_reports RLS（用户只能看自己的报告）
ALTER TABLE planning_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reports" ON planning_reports;
CREATE POLICY "Users can view own reports"
  ON planning_reports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON planning_reports;
CREATE POLICY "Users can insert own reports"
  ON planning_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can manage all reports" ON planning_reports;
CREATE POLICY "Admin can manage all reports"
  ON planning_reports FOR ALL
  USING (auth.jwt() ->> 'email' = 'luozhidie@live.cn');

-- 3. 扩展 planning_requests 表（增加字段追踪支付和报告）
ALTER TABLE planning_requests
  ADD COLUMN IF NOT EXISTS user_email TEXT,
  ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES planning_reports(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 4. 新建 planning_payments 表（支付记录，模拟支付用）
CREATE TABLE IF NOT EXISTS planning_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES planning_requests(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'mock',
  mock_paid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE planning_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON planning_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments"
  ON planning_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all payments"
  ON planning_payments FOR ALL
  USING (auth.jwt() ->> 'email' = 'luozhidie@live.cn');

-- 5. 索引
CREATE INDEX IF NOT EXISTS idx_planning_reports_user_id ON planning_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_reports_status ON planning_reports(status);
CREATE INDEX IF NOT EXISTS idx_planning_requests_user_id ON planning_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_planning_payments_user_id ON planning_payments(user_id);

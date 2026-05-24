-- 门店经营数据上报表
CREATE TABLE IF NOT EXISTS store_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_sales DECIMAL(12,2) DEFAULT 0,
  customer_count INTEGER DEFAULT 0,
  avg_transaction DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  top_categories TEXT[] DEFAULT '{}',
  inventory_value DECIMAL(12,2) DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE store_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "管理员可读写" ON store_reports
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

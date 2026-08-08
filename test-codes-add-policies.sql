-- test_codes 表已存在，只需添加公开访问策略
CREATE POLICY "Allow public select test_codes"
  ON test_codes FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public update test_codes used_attempts"
  ON test_codes FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

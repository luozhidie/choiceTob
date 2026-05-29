-- 确保 articles 表 content 字段支持长文本
ALTER TABLE articles ALTER COLUMN content TYPE text;
-- 确保 fashion_trends 表 content 字段支持长文本（如果存在）
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fashion_trends') THEN
    ALTER TABLE fashion_trends ALTER COLUMN content TYPE text;
  END IF;
END $$;

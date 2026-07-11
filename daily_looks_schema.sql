-- ============================================================
-- 每日搭配灵感 daily_looks 表（幂等，可重复执行）
-- 在 Supabase Dashboard → SQL Editor 中粘贴执行一次即可
-- 依赖：已存在 storage bucket 'daily-looks'（supabase-sql-fix.sql 已建）
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_looks (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title         text NOT NULL,
  style         text,                       -- 风格标签：温柔知性 / 职场通勤 / 休闲随性 / 优雅气质 / 活力潮流
  colors        text[] DEFAULT '{}',        -- 色值数组，如 {'#D4A574','#8B6914','#F5E6D3'}
  image_url     text,                       -- 实物搭配照片（存于 daily-looks 桶）
  description   text,
  is_published  boolean DEFAULT false,
  sort_order    int DEFAULT 0,
  created_at    timestamp with time zone DEFAULT now(),
  updated_at    timestamp with time zone DEFAULT now()
);

-- 排序索引（按 sort_order 升序展示）
CREATE INDEX IF NOT EXISTS daily_looks_sort_idx ON daily_looks (sort_order);

-- 行级安全
ALTER TABLE daily_looks ENABLE ROW LEVEL SECURITY;

-- 已发布内容对所有人可读（公共 API 走 service_role 会绕过 RLS，此策略为 anon 兜底）
DROP POLICY IF EXISTS "Published looks visible" ON daily_looks;
CREATE POLICY "Published looks visible" ON daily_looks
  FOR SELECT USING (is_published = true);

-- 管理员全权限（与 articles / fashion_trends 一致，依赖 app.admin_emails 配置）
DROP POLICY IF EXISTS "Admin full access on daily_looks" ON daily_looks;
CREATE POLICY "Admin full access on daily_looks" ON daily_looks
  FOR ALL USING (
    auth.email() IN (
      SELECT unnest(string_to_array(current_setting('app.admin_emails'), ','))
    )
  );

-- updated_at 自动刷新（若库内已有通用触发器可忽略，本段独立生效）
CREATE OR REPLACE FUNCTION set_daily_looks_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_daily_looks_updated_at ON daily_looks;
CREATE TRIGGER trg_daily_looks_updated_at
  BEFORE UPDATE ON daily_looks
  FOR EACH ROW EXECUTE FUNCTION set_daily_looks_updated_at();

-- ============================================================================
-- 在线课程「反复丢失」根因修复脚本
-- 适用：Supabase SQL Editor（https://supabase.com/dashboard → 你的项目 → SQL）
-- 说明：本脚本幂等安全，可反复执行；先跑【第 0 步诊断】确认，再跑【修复】。
-- ============================================================================

-- ====================== 第 0 步：诊断（只读，安全） ======================
-- 把下面这段单独执行，看清当前 courses 表到底缺什么、RLS 是什么。
SELECT '=== 1. 当前字段 ===' AS _;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'courses'
ORDER BY ordinal_position;

SELECT '=== 2. 行数 ===' AS _;
SELECT count(*) AS 总行数,
       count(*) FILTER (WHERE is_published = true) AS 已发布
FROM courses;

SELECT '=== 3. RLS 策略 ===' AS _;
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'courses';

SELECT '=== 4. app.admin_emails 配置 ===' AS _;
SELECT current_setting('app.admin_emails', true) AS 配置值;


-- ====================== 修复：补齐字段 + 统一 RLS ======================
-- 1) 补齐 phase3 的完整字段（admin 页面和公开页都依赖这些列）
ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS level text DEFAULT 'beginner';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 兼容旧字段：把旧的 cover_url 值迁移到新的 cover_image（不删旧列，安全）
UPDATE courses SET cover_image = cover_url
WHERE cover_image IS NULL AND cover_url IS NOT NULL;

-- 2) 清掉所有相互冲突的 courses 策略，重建确定的两条
DROP POLICY IF EXISTS "Public courses are visible" ON courses;
DROP POLICY IF EXISTS "Admin full access" ON courses;
DROP POLICY IF EXISTS "Admins can do anything" ON courses;
DROP POLICY IF EXISTS "Allow public read published courses" ON courses;
DROP POLICY IF EXISTS "Allow admin full access on courses" ON courses;

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- 公开：仅已发布可见（匿名/登录用户都能看）
CREATE POLICY "Published courses visible" ON courses
  FOR SELECT TO anon, authenticated
  USING (is_published = true);

-- 管理员：用确定的管理员邮箱判定，不再依赖 app.admin_emails / profiles.role
CREATE POLICY "Admin full access on courses" ON courses
  FOR ALL TO authenticated
  USING (coalesce(auth.email(), '') = 'luozhidie@live.cn')
  WITH CHECK (coalesce(auth.email(), '') = 'luozhidie@live.cn');

SELECT 'courses 修复完成 ✅' AS result;

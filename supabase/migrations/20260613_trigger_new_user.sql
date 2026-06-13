-- ================================================================
-- Supabase Trigger：新用户注册时自动设置 role=pending, approval_status=pending
-- 依附在 auth.users 上，新建用户时自动插入 profiles 行
-- ================================================================

-- 1. 先确保 profiles 表有正确的默认值（如果之前 migration 没跑）
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'pending';
ALTER TABLE profiles ALTER COLUMN approval_status SET DEFAULT 'pending';

-- 2. 创建或替换 trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 如果 profiles 行已存在（可能由其他机制创建），则更新
  -- 如果不存在，则插入
  INSERT INTO public.profiles (id, email, full_name, role, approval_status, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending',
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = CASE WHEN profiles.role IS NULL OR profiles.role = '' THEN 'pending' ELSE profiles.role END,
    approval_status = CASE WHEN profiles.approval_status IS NULL OR profiles.approval_status = '' THEN 'pending' ELSE profiles.approval_status END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- 3. 绑定 trigger（如果已存在会替换）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. 同时处理：已存在的用户但没有 profiles 行的，补插入
-- （可选，手动执行）
-- INSERT INTO public.profiles (id, email, role, approval_status, created_at, updated_at)
-- SELECT id, email, 'pending', 'pending', created_at, NOW()
-- FROM auth.users
-- ON CONFLICT (id) DO NOTHING;

COMMENT ON FUNCTION public.handle_new_user() IS '新用户注册 trigger：自动创建 profiles 行，role=pending, approval_status=pending';

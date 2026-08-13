-- 添加认证店主相关字段到 profiles 表，并回补已提交店铺认证数据
-- 执行方式：在 Supabase SQL Editor 中手动运行

-- 1. 为 profiles 表添加认证店主字段
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS store_owner_certified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS certified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS certified_style TEXT,
    ADD COLUMN IF NOT EXISTS certified_monthly_sales INTEGER;

-- 2. 创建店主认证记录表（与代码中的写入逻辑对应）
CREATE TABLE IF NOT EXISTS store_owner_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quiz_passed BOOLEAN DEFAULT false,
    style TEXT,
    monthly_sales INTEGER,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 回补：已存在 stores 记录但 profiles 未标记认证的用户，自动标记为认证店主
UPDATE profiles
SET
    store_owner_certified = true,
    certified_at = COALESCE(
        (SELECT MAX(created_at) FROM stores WHERE stores.owner_id = profiles.id),
        now()
    ),
    certified_style = (
        SELECT style_position
        FROM stores
        WHERE stores.owner_id = profiles.id
        ORDER BY created_at DESC
        LIMIT 1
    )
WHERE EXISTS (
    SELECT 1 FROM stores WHERE stores.owner_id = profiles.id
)
  AND (profiles.store_owner_certified IS NULL OR profiles.store_owner_certified = false);

-- 4. 添加索引
CREATE INDEX IF NOT EXISTS idx_profiles_store_owner_certified ON profiles(store_owner_certified);
CREATE INDEX IF NOT EXISTS idx_profiles_certified_at ON profiles(certified_at);
CREATE INDEX IF NOT EXISTS idx_store_owner_certifications_user_id ON store_owner_certifications(user_id);

-- ============================================================
-- 20260716 商品媒体字段 + 可领取优惠券模板池
-- 请在 Supabase SQL Editor 中执行本文件（Vercel 不会自动跑迁移）
-- ============================================================

-- 【1】products：视频 / 模特图 / 尺码表（实拍图复用现有 images[]，不新增）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS model_images TEXT[],
  ADD COLUMN IF NOT EXISTS size_chart_image TEXT;

-- 【2】coupons：关联领取模板（用于限领 / 去重）
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS template_id UUID;
CREATE INDEX IF NOT EXISTS idx_coupons_template ON coupons(template_id);

-- 【3】可领取优惠券模板池（公开可读、管理员可写）
CREATE TABLE IF NOT EXISTS coupon_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  discount_desc TEXT,
  min_amount INTEGER DEFAULT 0,         -- 满（分）
  discount_amount INTEGER DEFAULT 0,    -- 减（分）
  coupon_type TEXT DEFAULT 'general',   -- 仅作分类标签，取值见 coupons.coupon_type 约束
  valid_days INTEGER DEFAULT 30,        -- 领取后有效期天数
  per_user_limit INTEGER DEFAULT 1,     -- 每人限领张数
  total_limit INTEGER DEFAULT 0,        -- 0=不限量
  claimed_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coupon_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读取可领券" ON coupon_templates;
CREATE POLICY "公开读取可领券" ON coupon_templates FOR SELECT USING (is_active = true);

-- 【4】种子示例券（coupon_type 取合法值：general / vip_gift）
-- 使用 WHERE NOT EXISTS 防止重复执行时插入多份
INSERT INTO coupon_templates (title, discount_desc, min_amount, discount_amount, coupon_type, valid_days)
SELECT v.* FROM (VALUES
  ('新人立减券',  '满199减20',  19900, 2000, 'general',   30),
  ('全场满减券',  '满339减30',  33900, 3000, 'general',   30),
  ('无门槛包邮券','下单包邮',    0,    0,    'general',   15),
  ('会员专享券',  '满500减60',  50000, 6000, 'vip_gift',  30)
) AS v(title, discount_desc, min_amount, discount_amount, coupon_type, valid_days)
WHERE NOT EXISTS (SELECT 1 FROM coupon_templates WHERE title = v.title);

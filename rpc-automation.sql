-- =====================================================
-- 自动化 Level 1：允许前端通过 RPC 同步客户档案
-- 执行方式：在 Supabase SQL Editor 中逐段执行
-- =====================================================

-- 第1段：为 vip_customers 添加 source 字段（标记客户来源）
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS last_test_at timestamp with time zone;

-- 第2段：创建 RPC 函数 - 风格测试完成后自动 upsert 客户
-- 如果手机号已存在，则更新 main_style/color_season；否则新建
CREATE OR REPLACE FUNCTION upsert_customer_from_test(
  p_name text,
  p_phone text,
  p_wechat text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_main_style text DEFAULT NULL,
  p_color_season text DEFAULT NULL,
  p_source text DEFAULT 'style_test'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER  -- 以函数创建者（管理员）权限执行，绕过 RLS
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- 先查找是否已有同名同手机号的客户
  SELECT id INTO v_id FROM vip_customers
  WHERE phone = p_phone AND name = p_name
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    -- 已有客户，更新风格和测试时间
    UPDATE vip_customers SET
      main_style = COALESCE(p_main_style, main_style),
      color_season = COALESCE(p_color_season, color_season),
      gender = COALESCE(p_gender, gender),
      wechat = COALESCE(p_wechat, wechat),
      last_test_at = now(),
      is_active = true
    WHERE id = v_id;
  ELSE
    -- 新客户
    INSERT INTO vip_customers (name, phone, wechat, gender, main_style, color_season, source, last_test_at, vip_level)
    VALUES (
      p_name,
      p_phone,
      p_wechat,
      p_gender,
      p_main_style,
      p_color_season,
      p_source,
      now(),
      'V1'
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- 第3段：创建 RPC 函数 - 企划表单提交后自动 upsert 客户
CREATE OR REPLACE FUNCTION upsert_customer_from_planning(
  p_name text,
  p_phone text,
  p_wechat text DEFAULT NULL,
  p_company text DEFAULT NULL,
  p_color_season text DEFAULT NULL,
  p_style_type text DEFAULT NULL,
  p_source text DEFAULT 'planning_order'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vip_customers
  WHERE phone = p_phone AND name = p_name
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    UPDATE vip_customers SET
      color_season = COALESCE(p_color_season, color_season),
      main_style = COALESCE(p_style_type, main_style),
      company = COALESCE(p_company, company),
      wechat = COALESCE(p_wechat, wechat),
      is_active = true
    WHERE id = v_id;
  ELSE
    INSERT INTO vip_customers (name, phone, wechat, company, color_season, main_style, source, vip_level)
    VALUES (
      p_name,
      p_phone,
      p_wechat,
      p_company,
      p_color_season,
      p_style_type,
      p_source,
      'V1'
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

-- 第4段：授予权限 - anon 和 authenticated 用户可以调用 RPC
-- （SECURITY DEFINER 函数以定义者权限运行，不需要额外 RLS 策略）
-- 但需要确保函数的执行权限
GRANT EXECUTE ON FUNCTION upsert_customer_from_test TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_customer_from_planning TO anon, authenticated;

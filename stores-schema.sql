-- ================================================================
-- Phase 1: 店铺级服务交付系统 — 数据库变更
-- 执行顺序：按段落顺序逐段在 Supabase SQL Editor 中执行
-- ================================================================

-- ==================== 1. 创建 stores 表 ====================
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,                                -- 店铺名称
  contact_person TEXT,                               -- 联系人
  phone TEXT,                                        -- 联系电话
  wechat TEXT,                                       -- 微信号
  city TEXT,                                         -- 所在城市
  district TEXT,                                     -- 商圈/地段
  shop_size TEXT,                                    -- 店铺面积（如 "50-80㎡"）
  style_position TEXT,                               -- 风格定位（如 "french_elegant"）
  target_age TEXT,                                   -- 目标年龄层
  price_range TEXT,                                  -- 价格带（如 "199-399"）

  -- 经营数据 JSONB（弹性扩展，方便未来增减指标）
  business_data JSONB DEFAULT '{}',
  -- 结构示例：
  -- {
  --   "monthly_rent": 8000,
  --   "break_even_point": 50000,
  --   "gross_margin_rate": 0.55,
  --   "net_margin_rate": 0.15,
  --   "traffic_channels": ["小红书","抖音","线下"],
  --   "online_exposure": 5000,
  --   "foot_traffic": 300,
  --   "conversion_rate": 0.12,
  --   "attach_rate": 1.8,
  --   "avg_item_price": 350,
  --   "monthly_revenue": 80000,
  --   "current_trends": ["新中式","莫兰迪色系"]
  -- }

  -- 会员色彩/风格聚合统计 JSONB（由 RPC 函数定期计算更新）
  member_stats JSONB DEFAULT '{}',
  -- 结构示例：
  -- {
  --   "total_vip_count": 50,
  --   "tested_vip_count": 30,
  --   "color_season_distribution": {
  --     "light_warm": {"count": 5, "percentage": 16.7}
  --   },
  --   "style_distribution": {
  --     "you_ya": {"count": 10, "percentage": 33.3}
  --   },
  --   "last_updated": "2025-01-15T10:00:00Z"
  -- }

  notes TEXT,                                        -- 备注
  status TEXT DEFAULT 'active',                      -- active / inactive / churned
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on stores" ON stores
  FOR ALL USING (true);

CREATE POLICY "Public read active stores" ON stores
  FOR SELECT USING (status = 'active');

-- 索引
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores(status);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_stores_phone ON stores(phone);


-- ==================== 2. 给现有表添加 store_id ====================

ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE delivery_plans ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE planning_orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

CREATE INDEX IF NOT EXISTS idx_vip_customers_store_id ON vip_customers(store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_plans_store_id ON delivery_plans(store_id);
CREATE INDEX IF NOT EXISTS idx_planning_orders_store_id ON planning_orders(store_id);


-- ==================== 3. RPC: 刷新店铺会员聚合统计 ====================

CREATE OR REPLACE FUNCTION refresh_store_member_stats(p_store_id UUID)
RETURNS void AS $$
DECLARE
  v_total_count INT;
  v_tested_count INT;
  v_color_stats JSONB;
  v_style_stats JSONB;
BEGIN
  -- 总VIP数
  SELECT COUNT(*) INTO v_total_count
  FROM vip_customers WHERE store_id = p_store_id AND is_active = true;

  -- 已测试VIP数（有色彩季型或主风格的）
  SELECT COUNT(*) INTO v_tested_count
  FROM vip_customers
  WHERE store_id = p_store_id AND is_active = true
    AND (color_season IS NOT NULL OR main_style IS NOT NULL);

  -- 色彩季型分布
  SELECT jsonb_object_agg(
    color_season,
    jsonb_build_object(
      'count', cnt,
      'percentage', ROUND(cnt::numeric / NULLIF(v_tested_count, 0) * 100, 1)
    )
  ) INTO v_color_stats
  FROM (
    SELECT color_season, COUNT(*) as cnt
    FROM vip_customers
    WHERE store_id = p_store_id AND is_active = true AND color_season IS NOT NULL
    GROUP BY color_season
  ) sub;

  -- 风格分布
  SELECT jsonb_object_agg(
    main_style,
    jsonb_build_object(
      'count', cnt,
      'percentage', ROUND(cnt::numeric / NULLIF(v_tested_count, 0) * 100, 1)
    )
  ) INTO v_style_stats
  FROM (
    SELECT main_style, COUNT(*) as cnt
    FROM vip_customers
    WHERE store_id = p_store_id AND is_active = true AND main_style IS NOT NULL
    GROUP BY main_style
  ) sub;

  -- 更新 stores 表
  UPDATE stores SET
    member_stats = jsonb_build_object(
      'total_vip_count', v_total_count,
      'tested_vip_count', v_tested_count,
      'color_season_distribution', COALESCE(v_color_stats, '{}'::jsonb),
      'style_distribution', COALESCE(v_style_stats, '{}'::jsonb),
      'last_updated', now()
    ),
    updated_at = now()
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==================== 4. RPC: 带店铺关联的客户 upsert ====================

CREATE OR REPLACE FUNCTION upsert_customer_with_store(
  p_name TEXT,
  p_phone TEXT,
  p_wechat TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_color_season TEXT DEFAULT NULL,
  p_main_style TEXT DEFAULT NULL,
  p_company TEXT DEFAULT NULL,
  p_store_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- 按手机号查找已有客户
  SELECT id INTO v_customer_id FROM vip_customers WHERE phone = p_phone LIMIT 1;

  IF v_customer_id IS NOT NULL THEN
    UPDATE vip_customers SET
      color_season = COALESCE(p_color_season, color_season),
      main_style = COALESCE(p_main_style, main_style),
      store_id = COALESCE(p_store_id, store_id),
      company = COALESCE(p_company, company),
      wechat = COALESCE(p_wechat, wechat),
      gender = COALESCE(p_gender, gender),
      is_active = true
    WHERE id = v_customer_id;
  ELSE
    INSERT INTO vip_customers (name, phone, wechat, gender, color_season, main_style, company, store_id, vip_level, is_active)
    VALUES (
      p_name, p_phone, p_wechat, p_gender,
      p_color_season, p_main_style, p_company, p_store_id,
      'V1', true
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- 如果关联了店铺，自动刷新聚合统计
  IF p_store_id IS NOT NULL THEN
    PERFORM refresh_store_member_stats(p_store_id);
  END IF;

  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==================== 5. 授权 ====================

GRANT EXECUTE ON FUNCTION refresh_store_member_stats(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upsert_customer_with_store(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) TO anon, authenticated;

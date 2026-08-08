-- ================================================================
-- 修复数据流断点的 migration
-- 修复项：inventory.unit_cost 缺失、refresh_store_member_stats 函数缺失
-- ================================================================

-- 1. 给 inventory 表添加 unit_cost 列
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(10,2) DEFAULT 0;

-- 2. 给 purchase_order_items 的 order_id 字段增加与 purchase_orders 的关联
-- （已有 order_id TEXT，但需确保数据一致性）

-- 3. 创建 refresh_store_member_stats 函数
CREATE OR REPLACE FUNCTION refresh_store_member_stats(p_store_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_vip_count INTEGER;
  v_tested_vip_count INTEGER;
  v_color_season_dist JSONB;
  v_style_dist JSONB;
BEGIN
  -- 统计该店铺的 VIP 总数
  SELECT COUNT(*) INTO v_total_vip_count
  FROM vip_customers
  WHERE store_id = p_store_id;

  -- 统计已测试色彩季型的 VIP 数
  SELECT COUNT(*) INTO v_tested_vip_count
  FROM vip_customers
  WHERE store_id = p_store_id
    AND color_season IS NOT NULL AND color_season != '';

  -- 色彩季型分布
  SELECT jsonb_object_agg(
    color_season,
    jsonb_build_object(
      'count', cnt,
      'percentage', ROUND(cnt::numeric / NULLIF(v_tested_vip_count, 0) * 100, 1)
    )
  ) INTO v_color_season_dist
  FROM (
    SELECT color_season, COUNT(*) AS cnt
    FROM vip_customers
    WHERE store_id = p_store_id
      AND color_season IS NOT NULL AND color_season != ''
    GROUP BY color_season
  ) sub;

  -- 风格分布
  SELECT jsonb_object_agg(
    main_style,
    jsonb_build_object(
      'count', cnt,
      'percentage', ROUND(cnt::numeric / NULLIF(v_tested_vip_count, 0) * 100, 1)
    )
  ) INTO v_style_dist
  FROM (
    SELECT main_style, COUNT(*) AS cnt
    FROM vip_customers
    WHERE store_id = p_store_id
      AND main_style IS NOT NULL AND main_style != ''
    GROUP BY main_style
  ) sub;

  -- 写回 stores 表
  UPDATE stores
  SET member_stats = jsonb_set(
    jsonb_set(
      COALESCE(member_stats, '{}'::jsonb),
      '{total_vip_count}',
      to_jsonb(COALESCE(v_total_vip_count, 0))
    ),
    '{tested_vip_count}',
    to_jsonb(COALESCE(v_tested_vip_count, 0))
  ) || jsonb_build_object(
    'color_season_distribution', COALESCE(v_color_season_dist, '{}'::jsonb),
    'style_distribution', COALESCE(v_style_dist, '{}'::jsonb)
  )
  WHERE id = p_store_id;
END;
$$ LANGUAGE plpgsql;

-- 4. 给 vip_customers 添加触发器，VIP 增删改时自动刷新店铺统计
DROP TRIGGER IF EXISTS trigger_refresh_store_member_stats ON vip_customers;

CREATE TRIGGER trigger_refresh_store_member_stats
  AFTER INSERT OR UPDATE OF color_season, main_style OR DELETE ON vip_customers
  FOR EACH ROW
  EXECUTE FUNCTION refresh_store_member_stats_on_vip_change();

-- 辅助触发器函数
CREATE OR REPLACE FUNCTION refresh_store_member_stats_on_vip_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_store_member_stats(OLD.store_id);
  ELSE
    PERFORM refresh_store_member_stats(NEW.store_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

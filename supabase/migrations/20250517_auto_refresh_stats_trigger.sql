-- ================================================================
-- 自动刷新店铺会员统计触发器
-- 当 vip_customers 发生 INSERT/UPDATE/DELETE 时，自动刷新对应店铺的 member_stats
-- ================================================================

-- 1. 创建触发器函数
CREATE OR REPLACE FUNCTION auto_refresh_store_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
BEGIN
  -- 确定受影响的 store_id
  IF TG_OP = 'DELETE' THEN
    v_store_id := OLD.store_id;
  ELSE
    v_store_id := NEW.store_id;
  END IF;

  -- 如果 store_id 变化了（UPDATE 时从 A 改到 B），也要刷新旧店铺
  IF TG_OP = 'UPDATE' AND OLD.store_id IS DISTINCT FROM NEW.store_id THEN
    IF OLD.store_id IS NOT NULL THEN
      PERFORM refresh_store_member_stats(OLD.store_id);
    END IF;
    v_store_id := NEW.store_id;
  END IF;

  -- 刷新受影响店铺的统计
  IF v_store_id IS NOT NULL THEN
    PERFORM refresh_store_member_stats(v_store_id);
  END IF;

  -- 对于 DELETE 操作，返回 OLD；其他返回 NEW
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. 创建触发器（如果已存在则先删除）
DROP TRIGGER IF EXISTS trg_auto_refresh_store_stats ON vip_customers;

CREATE TRIGGER trg_auto_refresh_store_stats
  AFTER INSERT OR UPDATE OR DELETE ON vip_customers
  FOR EACH ROW
  EXECUTE FUNCTION auto_refresh_store_stats();

-- 3. 验证：触发器是否创建成功
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'vip_customers'::regclass;

-- 4. 初始化：刷新所有现有店铺的统计
DO $$
DECLARE
  store_rec RECORD;
BEGIN
  FOR store_rec IN SELECT id FROM stores LOOP
    PERFORM refresh_store_member_stats(store_rec.id);
  END LOOP;
END $$;

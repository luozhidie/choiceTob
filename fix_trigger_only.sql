-- 只修复触发器（前面 ALTER TABLE 已成功）
DROP TRIGGER IF EXISTS payment_orders_updated_at ON payment_orders;

CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

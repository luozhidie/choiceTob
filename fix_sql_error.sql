-- 修正版：修复 CREATE TRIGGER IF NOT EXISTS 语法错误
-- PostgreSQL 不支持 IF NOT EXISTS on CREATE TRIGGER，需先 DROP 再 CREATE

-- 先修复触发器（如果存在就先删除）
DROP TRIGGER IF EXISTS payment_orders_updated_at ON payment_orders;

CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

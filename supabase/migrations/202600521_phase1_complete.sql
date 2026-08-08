-- ================================================================
-- Phase 1 完善：RFM 精准营销 + 库存预警数据闭环
-- 执行前请确认：vip_customers 表已存在且包含 RFM 基础字段
-- ================================================================

-- ──────────────────────────────────────────────
-- 第1步：vip_customers 添加消费聚合字段
-- 用途：RFM 计算的数据来源
-- ──────────────────────────────────────────────
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS last_purchase_date TIMESTAMPTZ;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS total_purchase_count INTEGER DEFAULT 0;
ALTER TABLE vip_customers ADD COLUMN IF NOT EXISTS total_purchase_amount NUMERIC(12,2) DEFAULT 0;

-- ──────────────────────────────────────────────
-- 第2步：inventory 表添加补货预警字段
-- ──────────────────────────────────────────────
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS daily_avg_sales NUMERIC(8,2) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS days_of_stock INTEGER DEFAULT 999;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'normal';
  -- risk_level: normal / warning / danger / overstock
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS suggested_reorder_qty INTEGER DEFAULT 0;

-- ──────────────────────────────────────────────
-- 第3步：创建更新 vip_customers 消费聚合的函数
-- 当有新支付订单时，自动更新客户的消费聚合数据
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_customer_purchase_stats(p_customer_id UUID)
RETURNS VOID AS $$
DECLARE
  v_wechat TEXT;
  v_phone TEXT;
  v_email TEXT;
BEGIN
  -- 通过 vip_customers 的 wechat/phone/email 关联 payment_orders
  SELECT wechat, phone INTO v_wechat, v_phone
  FROM vip_customers WHERE id = p_customer_id;

  IF v_wechat IS NOT NULL THEN
    UPDATE vip_customers
    SET
      total_purchase_count = (
        SELECT COUNT(*) FROM payment_orders
        WHERE (user_phone = v_phone OR user_name = (SELECT name FROM vip_customers WHERE id = p_customer_id))
          AND status = 'paid'
      ),
      total_purchase_amount = COALESCE((
        SELECT SUM(amount) FROM payment_orders
        WHERE (user_phone = v_phone OR user_name = (SELECT name FROM vip_customers WHERE id = p_customer_id))
          AND status = 'paid'
      ), 0),
      last_purchase_date = (
        SELECT MAX(paid_at) FROM payment_orders
        WHERE (user_phone = v_phone OR user_name = (SELECT name FROM vip_customers WHERE id = p_customer_id))
          AND status = 'paid'
      )
    WHERE id = p_customer_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- 第4步：创建库存预警计算函数
-- 基于日均销量计算7天风险和补货建议
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION calculate_inventory_risk(p_store_id UUID)
RETURNS TABLE(
  sku_code TEXT,
  product_name TEXT,
  risk_level TEXT,
  days_of_stock INTEGER,
  suggested_reorder_qty INTEGER
) AS $$
DECLARE
  inv RECORD;
  v_daily_avg NUMERIC(8,2);
  v_days INTEGER;
  v_risk TEXT;
  v_reorder INTEGER;
BEGIN
  FOR inv IN
    SELECT id, sku_code, product_name, current_stock, sales_qty, stock_in_qty, unit_cost
    FROM inventory WHERE store_id = p_store_id
  LOOP
    -- 日均销量 = 累计销量 / 30（假设30天周期）
    v_daily_avg := CASE WHEN inv.sales_qty > 0 THEN ROUND(inv.sales_qty::NUMERIC / 30, 2) ELSE 0 END;

    -- 可售天数 = 当前库存 / 日均销量
    v_days := CASE WHEN v_daily_avg > 0 THEN FLOOR(inv.current_stock::NUMERIC / v_daily_avg)::INTEGER ELSE 999 END;

    -- 风险等级
    IF inv.current_stock = 0 THEN
      v_risk := 'danger';       -- 已断货
      v_reorder := GREATEST(ROUND(v_daily_avg * 14)::INTEGER, 20); -- 补14天销量
    ELSIF v_days <= 7 THEN
      v_risk := 'danger';       -- 7天内断货
      v_reorder := GREATEST(ROUND(v_daily_avg * 14)::INTEGER, 20);
    ELSIF v_days <= 14 THEN
      v_risk := 'warning';      -- 14天内断货
      v_reorder := GREATEST(ROUND(v_daily_avg * 7)::INTEGER, 10);
    ELSIF v_days > 60 AND inv.current_stock > 50 THEN
      v_risk := 'overstock';    -- 滞销积压
      v_reorder := 0;
    ELSE
      v_risk := 'normal';
      v_reorder := 0;
    END IF;

    -- 更新 inventory 表
    UPDATE inventory
    SET
      daily_avg_sales = v_daily_avg,
      days_of_stock = v_days,
      risk_level = v_risk,
      suggested_reorder_qty = v_reorder,
      updated_at = NOW()
    WHERE id = inv.id;

    sku_code := inv.sku_code;
    product_name := inv.product_name;
    risk_level := v_risk;
    days_of_stock := v_days;
    suggested_reorder_qty := v_reorder;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- ──────────────────────────────────────────────
-- 第5步：修复 payment_orders 的 updated_at 触发器
-- 之前 CREATE TRIGGER IF NOT EXISTS 语法错误，改用正确写法
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_orders_updated_at ON payment_orders;
CREATE TRIGGER payment_orders_updated_at
  BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────
-- 第6步：RFM 营销动作建议表（新增）
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfm_marketing_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  segment TEXT NOT NULL,          -- 人群标签：忠诚客户/高价值会员/沉睡客户/流失风险 等
  rfm_level TEXT NOT NULL,        -- RFM等级：高价值会员/潜力会员/一般会员/低频会员/流失预警
  action_type TEXT NOT NULL,      -- 动作类型：sms/coupon/recommend/invite/reminder
  action_name TEXT NOT NULL,      -- 动作名称：发送新品推荐/发放优惠券 等
  action_desc TEXT,               -- 动作描述
  priority INTEGER DEFAULT 5,    -- 优先级 1-10，1最高
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认营销动作
INSERT INTO rfm_marketing_actions (segment, rfm_level, action_type, action_name, action_desc, priority) VALUES
  ('忠诚客户', '高价值会员', 'recommend', '新品首发推荐', '优先推荐最新款，增强忠诚度和连单率', 1),
  ('忠诚客户', '高价值会员', 'invite', 'VIP沙龙邀请', '邀请参加线下搭配沙龙，提升体验', 2),
  ('高价值会员', '高价值会员', 'coupon', '专属折扣券', '发放9折专属折扣，促进复购', 3),
  ('新客/低频', '潜力会员', 'recommend', '风格搭配推荐', '基于色彩季型推荐搭配方案，提高连单率', 2),
  ('新客/低频', '潜力会员', 'coupon', '满减优惠券', '发放满3000减300券，提升客单价', 3),
  ('沉睡客户', '一般会员', 'sms', '唤醒短信', '发送新品+专属优惠，唤醒沉睡客户', 1),
  ('沉睡客户', '一般会员', 'coupon', '回归优惠券', '发放限时8.5折券，制造紧迫感', 2),
  ('流失风险', '流失预警', 'sms', '关怀短信', '发送关怀信息+大额优惠券，挽回流失', 1),
  ('流失风险', '流失预警', 'coupon', '挽回优惠券', '发放8折挽回券，降低流失率', 2),
  ('一般会员', '一般会员', 'recommend', '季节推荐', '按季节推荐当季爆款，提高购买频次', 5),
  ('一般会员', '潜力会员', 'invite', '线上课程邀请', '邀请参加服装搭配知识课程，建立信任', 4),
  ('重点唤醒', '高价值会员', 'sms', '专属回归邀请', '曾经的大客户，发送个性化回归邀请+专属折扣', 1),
  ('重点唤醒', '高价值会员', 'coupon', '大额回归券', '发放7.5折大额回归券，让曾经的大客户回来', 2)
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────
-- 第7步：profiles 表添加会员字段
-- ──────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;

-- ──────────────────────────────────────────────
-- 第8步：RLS 策略
-- ──────────────────────────────────────────────
ALTER TABLE rfm_marketing_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage marketing actions" ON rfm_marketing_actions FOR ALL USING (true);

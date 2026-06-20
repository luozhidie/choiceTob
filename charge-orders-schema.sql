-- 充值订单表
CREATE TABLE IF NOT EXISTS charge_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 订单基本信息
  order_no VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_name VARCHAR(100),
  
  -- 充值信息
  amount DECIMAL(10, 2) NOT NULL,  -- 充值金额
  discount_rate DECIMAL(3, 2),      -- 折扣率（如0.28表示2.8折）
  actual_amount DECIMAL(10, 2),     -- 实际到账金额（根据折扣计算）
  
  -- 支付方式
  payment_method VARCHAR(20) CHECK (payment_method IN ('wechat', 'bank_transfer', 'online')),
  payment_proof TEXT,                -- 支付凭证（图片URL）
  
  -- 订单状态
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'confirmed', 'cancelled')),
  paid_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmed_by UUID REFERENCES auth.users(id),
  
  -- 备注
  remark TEXT,
  admin_remark TEXT,
  
  -- 到账信息
  balance_before DECIMAL(10, 2) DEFAULT 0,  -- 充值前余额
  balance_after DECIMAL(10, 2) DEFAULT 0     -- 充值后余额
);

-- 启用行级安全
ALTER TABLE charge_orders ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的充值订单
CREATE POLICY "Users can view own charge orders" 
  ON charge_orders FOR SELECT 
  USING (auth.uid() = user_id);

-- 用户只能创建自己的充值订单
CREATE POLICY "Users can create own charge orders" 
  ON charge_orders FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 管理员可以查看所有充值订单
CREATE POLICY "Admins can view all charge orders" 
  ON charge_orders FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- 管理员可以更新充值订单（确认充值）
CREATE POLICY "Admins can update charge orders" 
  ON charge_orders FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- 创建索引
CREATE INDEX idx_charge_orders_user_id ON charge_orders(user_id);
CREATE INDEX idx_charge_orders_status ON charge_orders(status);
CREATE INDEX idx_charge_orders_created_at ON charge_orders(created_at DESC);

-- 自动更新 updated_at 的触发器
CREATE OR REPLACE FUNCTION update_charge_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_charge_orders_updated_at
  BEFORE UPDATE ON charge_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_charge_orders_updated_at();

-- 生成充值订单号的触发器
CREATE OR REPLACE FUNCTION generate_charge_order_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_no IS NULL THEN
    NEW.order_no = 'CZ' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(NEXTVAL('charge_order_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建序列（如果不存在）
CREATE SEQUENCE IF NOT EXISTS charge_order_seq;

-- 创建触发器
CREATE TRIGGER trigger_generate_charge_order_no
  BEFORE INSERT ON charge_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_charge_order_no();

-- 充值确认后自动更新用户余额的触发器
CREATE OR REPLACE FUNCTION update_user_balance_after_charge()
RETURNS TRIGGER AS $$
BEGIN
  -- 只有当状态从非confirmed变为confirmed时才执行
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- 记录充值前的余额
    NEW.balance_before = COALESCE(
      (SELECT balance FROM user_profiles WHERE id = NEW.user_id), 
      0
    );
    
    -- 更新用户余额
    UPDATE user_profiles 
    SET 
      balance = COALESCE(balance, 0) + NEW.actual_amount,
      updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- 记录充值后的余额
    NEW.balance_after = COALESCE(
      (SELECT balance FROM user_profiles WHERE id = NEW.user_id), 
      0
    );
    
    -- 记录确认时间和确认人
    NEW.confirmed_at = NOW();
    NEW.confirmed_by = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_balance_after_charge
  BEFORE UPDATE ON charge_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_after_charge();

-- 说明
COMMENT ON TABLE charge_orders IS '充值订单表';
COMMENT ON COLUMN charge_orders.order_no IS '充值订单号，格式：CZ + 日期 + 6位序列号';
COMMENT ON COLUMN charge_orders.amount IS '充值金额（元）';
COMMENT ON COLUMN charge_orders.discount_rate IS '折扣率，如0.28表示2.8折';
COMMENT ON COLUMN charge_orders.actual_amount IS '实际到账金额 = amount * discount_rate';
COMMENT ON COLUMN charge_orders.payment_method IS '支付方式：wechat-微信，bank_transfer-银行转账，online-在线支付';
COMMENT ON COLUMN charge_orders.payment_proof IS '支付凭证图片URL';
COMMENT ON COLUMN charge_orders.status IS '订单状态：pending-待支付，paid-已支付待确认，confirmed-已确认，cancelled-已取消';

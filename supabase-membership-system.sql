-- ============================================================
-- 骆芷蝶智选 · 会员权益系统补充表结构
-- 在 Supabase Dashboard > SQL Editor 中执行
-- ============================================================

-- 【1】profiles 表增加拿货金额统计字段
-- 注意：profiles 表主键是 id（UUID，引用 auth.users.id）
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS total_purchase_amount INTEGER DEFAULT 0,      -- 累计拿货金额（分）
  ADD COLUMN IF NOT EXISTS purchase_upgrade_threshold INTEGER,            -- 当前拿货升级阈值（分）
  ADD COLUMN IF NOT EXISTS membership_expire_at DATE;                     -- 会员到期日（替代 membership_expires_at 的统一字段）

-- 给 total_purchase_amount 加索引
CREATE INDEX IF NOT EXISTS idx_profiles_purchase_amount ON profiles(total_purchase_amount);

COMMENT ON COLUMN profiles.total_purchase_amount IS '累计拿货金额（分），用于拿货升级会员';
COMMENT ON COLUMN profiles.purchase_upgrade_threshold IS '拿货升级当前阈值（分），达到后自动升级';
COMMENT ON COLUMN profiles.membership_expire_at IS '会员到期日，NULL表示永久';


-- 【2】membership_levels 表：会员等级配置（后台可管理）
CREATE TABLE IF NOT EXISTS membership_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_key TEXT UNIQUE NOT NULL,        -- 'view_price', 'deposit_5w', 'deposit_10w', 'deposit_30w'
  level_name TEXT NOT NULL,             -- '价格会员', '拿货会员5万', '拿货会员10万', '拿货会员30万'
  type TEXT NOT NULL CHECK (type IN ('price', 'deposit')),  -- 开通方式
  threshold_amount INTEGER,             -- 拿货升级阈值（分），price类型可为NULL
  discount_rate NUMERIC(5,4),          -- 折扣 0.2800 = 2.8折
  return_rate NUMERIC(5,4),            -- 退换比例 0.05 = 5%
  price_fen INTEGER,                   -- 开通价格（分），deposit类型可为NULL
  duration_days INTEGER DEFAULT 365,    -- 有效期（天）
  benefits JSONB DEFAULT '[]',         -- 权益列表 [{icon, title, desc}]
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE membership_levels IS '会员等级配置表，管理两种开通方式：直接购买或拿货升级';
COMMENT ON COLUMN membership_levels.type IS 'price=直接购买开通, deposit=拿货金额达标升级';
COMMENT ON COLUMN membership_levels.threshold_amount IS '拿货升级阈值（分），例如500000=5000元';
COMMENT ON COLUMN membership_levels.benefits IS '权益列表JSON：[{"icon":"percent","title":"2.8折","desc":"专享批发价2.8折"}]';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_membership_levels_type ON membership_levels(type);
CREATE INDEX IF NOT EXISTS idx_membership_levels_active ON membership_levels(is_active);

-- 插入默认会员等级配置（如果不存在）
DELETE FROM membership_levels WHERE level_key IN ('test_female', 'test_male');  -- 清理测试数据

INSERT INTO membership_levels (level_key, level_name, type, threshold_amount, discount_rate, return_rate, price_fen, duration_days, benefits, sort_order) VALUES
  ('deposit_5w', '拿货会员5万', 'deposit', 500000, 0.2800, 0.0500, NULL, 365, '[{"icon":"percent","title":"2.8折","desc":"专享批发价2.8折"},{"icon":"refreshcw","title":"5%退换","desc":"每月5%商品可退换"},{"icon":"gift","title":"新人礼包","desc":"首单赠送搭配指南"}]'::jsonb, 10),
  ('deposit_10w', '拿货会员10万', 'deposit', 1000000, 0.2800, 0.1000, NULL, 365, '[{"icon":"percent","title":"2.8折","desc":"专享批发价2.8折"},{"icon":"refreshcw","title":"10%退换","desc":"每月10%商品可退换"},{"icon":"star","title":"优先发货","desc":"大货优先安排发货"}]'::jsonb, 11),
  ('deposit_30w', '拿货会员30万', 'deposit', 3000000, 0.2600, 0.2000, NULL, 365, '[{"icon":"percent","title":"2.6折","desc":"专享批发价2.6折"},{"icon":"refreshcw","title":"20%退换","desc":"每月20%商品可退换"},{"icon":"crown","title":"专属客服","desc":"一对一搭配顾问服务"}]'::jsonb, 12)
ON CONFLICT (level_key) DO UPDATE SET
  level_name = EXCLUDED.level_name,
  threshold_amount = EXCLUDED.threshold_amount,
  discount_rate = EXCLUDED.discount_rate,
  return_rate = EXCLUDED.return_rate,
  benefits = EXCLUDED.benefits,
  updated_at = NOW();


-- 【3】coupons 表补充：增加 admin 管理字段
-- 注意：原有 coupons 表 user_id 引用 auth.users(id)
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'general' CHECK (coupon_type IN ('general', 'vip_gift', 'festival', 'invite_reward')),
  ADD COLUMN IF NOT EXISTS batch_id UUID,                              -- 批量发放批次ID
  ADD COLUMN IF NOT EXISTS total_count INTEGER DEFAULT 0,             -- 总发放数量
  ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;              -- 已使用数量

CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_expire ON coupons(expire_at) WHERE status='unused';


-- 【4】red_packets 表补充：增加 admin 管理字段
ALTER TABLE red_packets
  ADD COLUMN IF NOT EXISTS packet_type TEXT DEFAULT 'general' CHECK (packet_type IN ('general', 'vip_gift', 'festival', 'invite_reward')),
  ADD COLUMN IF NOT EXISTS batch_id UUID,
  ADD COLUMN IF NOT EXISTS total_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;


-- 【5】user_membership_logs 表：会员变更记录
CREATE TABLE IF NOT EXISTS user_membership_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_membership TEXT,
  new_membership TEXT NOT NULL,
  upgrade_type TEXT NOT NULL CHECK (upgrade_type IN ('purchase', 'deposit', 'admin')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount_fen INTEGER,                        -- 相关金额（分）
  remark TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_membership_logs_user ON user_membership_logs(user_id);
COMMENT ON TABLE user_membership_logs IS '会员变更历史记录：购买开通/拿货升级/管理员操作';


-- 【6】coupon_batches 表：优惠券批量发放记录（后台管理用）
CREATE TABLE IF NOT EXISTS coupon_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,                      -- 批次名称："双11全量发放"
  coupon_config JSONB NOT NULL,            -- {title, discount_desc, min_amount, discount_amount, expire_days}
  target_type TEXT DEFAULT 'all' CHECK (target_type IN ('all', 'vip_only', 'new_user', 'specific')),
  target_users UUID[],                      -- 指定用户ID数组（target_type='specific'时用）
  total_issued INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'done')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coupon_batches IS '优惠券批量发放批次记录';


-- ============================================================
-- RLS 策略
-- ============================================================

-- membership_levels：所有人可查看活跃等级，只有管理员可修改
ALTER TABLE membership_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "公开查看活跃会员等级" 
  ON membership_levels FOR SELECT 
  USING (is_active = true);

-- user_membership_logs：用户查看自己的记录
ALTER TABLE user_membership_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "用户查看自己会员记录"
  ON user_membership_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- coupon_batches：只有管理员可管理
ALTER TABLE coupon_batches ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- 存储过程：下单后更新拿货金额并自动升级
-- ============================================================
CREATE OR REPLACE FUNCTION update_purchase_amount_and_upgrade()
RETURNS TRIGGER AS $$
DECLARE
  v_total INTEGER;
  v_new_level_key TEXT;
  v_threshold INTEGER;
  v_current_membership TEXT;
BEGIN
  -- 只在订单状态变为已付款/toship 时触发
  IF NEW.status IN ('toship', 'toreceive', 'completed') 
     AND (OLD.status IS NULL OR OLD.status = 'unpaid') THEN
    
    -- 累加拿货金额（profiles.id = auth.users.id = NEW.user_id）
    UPDATE profiles 
    SET total_purchase_amount = COALESCE(total_purchase_amount, 0) + NEW.total_fee
    WHERE id = NEW.user_id;
    
    -- 获取最新累计金额和当前会员类型
    SELECT total_purchase_amount, membership_type 
      INTO v_total, v_current_membership
    FROM profiles 
    WHERE id = NEW.user_id;
    
    -- 判断升级：从低到高检查阈值
    SELECT level_key, threshold_amount 
      INTO v_new_level_key, v_threshold
    FROM membership_levels 
    WHERE type = 'deposit' AND threshold_amount <= v_total
    ORDER BY threshold_amount DESC 
    LIMIT 1;
    
    -- 如果达到升级条件
    IF v_new_level_key IS NOT NULL THEN
      -- 更新会员信息
      UPDATE profiles 
      SET 
        membership_type = v_new_level_key,
        purchase_upgrade_threshold = v_threshold,
        membership_expire_at = CURRENT_DATE + INTERVAL '365 days',
        deposit_amount = COALESCE(total_purchase_amount, 0),
        deposit_discount_rate = (SELECT discount_rate FROM membership_levels WHERE level_key = v_new_level_key),
        deposit_return_rate = (SELECT return_rate FROM membership_levels WHERE level_key = v_new_level_key)
      WHERE id = NEW.user_id 
        AND (membership_type IS NULL OR membership_type != v_new_level_key);
      
      -- 写入升级记录（不在乎重复，用 ON CONFLICT 如果存在就不插入）
      INSERT INTO user_membership_logs (user_id, old_membership, new_membership, upgrade_type, order_id, amount_fen)
      VALUES (NEW.user_id, v_current_membership, v_new_level_key, 'deposit', NEW.id, NEW.total_fee)
      ON CONFLICT DO NOTHING;  -- 如果id主键冲突才不插入，这里用id是UUID所以不会冲突
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器（先删后建）
DROP TRIGGER IF EXISTS trg_update_purchase_amount ON orders;
CREATE TRIGGER trg_update_purchase_amount
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_amount_and_upgrade();


-- ============================================================
-- 完成
-- ============================================================
SELECT '✅ 会员权益系统表结构安装完成' as result;

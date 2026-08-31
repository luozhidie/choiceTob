-- 20260823 新增 998 虚拟试衣代理通道
-- 购买专业版 ¥998 即成为永久代理（与店主认证 store_owner_certified 独立）
-- 折扣：单件 3.3 折；单笔订单满 5 件 2.8 折；无退换额度
-- 在 Supabase Dashboard → SQL Editor 中执行本脚本

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_tryon_agent boolean NOT NULL DEFAULT false;

-- 为已购买过 tryon_pro_998 的用户补打标记（幂等，可重复执行）
-- tryon_orders 以 openid 记录，需经 profiles.wechat_openid / wx_openid 反查 user_id
UPDATE profiles
SET is_tryon_agent = true
WHERE (wechat_openid IN (
  SELECT DISTINCT o.openid
  FROM tryon_orders o
  WHERE o.package_id = 'tryon_pro_998'
    AND o.status = 'paid'
) OR wx_openid IN (
  SELECT DISTINCT o.openid
  FROM tryon_orders o
  WHERE o.package_id = 'tryon_pro_998'
    AND o.status = 'paid'
));

COMMENT ON COLUMN profiles.is_tryon_agent IS '购买专业版¥998成为的虚拟试衣代理（永久），与店主认证独立';

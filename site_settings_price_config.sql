-- ============================================================
-- 价格后台化：充值档位 + 虚拟道具价格 初始种子
-- 执行环境：Supabase Dashboard → SQL Editor → 粘贴执行一次
-- 说明：
--   1) on conflict do nothing —— 仅在 key 不存在时插入，绝不覆盖后台已改价格
--   2) 改价后虚拟支付类（tryon_*/daily_looks_*/articles_*）需同步
--      微信 MP 后台「虚拟支付 → 道具管理」改价并发布，两边价须一致
--   3) 充值档位（wholesale_*）为纯后台自治，改完立即生效、无需重审
-- ============================================================

insert into site_settings (key, value, updated_at) values (
  'wholesale_tiers',
  $$json$$
{
  "wholesale_6k": {
    "name": "会员·首充6000",
    "amountFen": 600000
  },
  "wholesale_5w": {
    "name": "充值会员·5万",
    "amountFen": 5000000
  },
  "wholesale_10w": {
    "name": "充值会员·10万",
    "amountFen": 10000000
  },
  "wholesale_30w": {
    "name": "充值会员·30万",
    "amountFen": 30000000
  }
}
  $$json$$::jsonb,
  now()
)
on conflict (key) do nothing;

insert into site_settings (key, value, updated_at) values (
  'virtual_goods_prices',
  $$json$$
{
  "tryon_first_9_9": 990,
  "tryon_normal_99": 9900,
  "tryon_normal_299": 29900,
  "tryon_pro_998": 99800,
  "tryon_test_cent": 100,
  "daily_looks_monthly": 99900,
  "daily_looks_yearly": 999900,
  "articles_monthly": 13800,
  "articles_yearly": 138000
}
  $$json$$::jsonb,
  now()
)
on conflict (key) do nothing;

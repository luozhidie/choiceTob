-- ============================================================
-- 价格 + 折扣后台化：充值档位(金额/折扣/退换) + 虚拟道具价格 初始种子
-- 执行环境：Supabase Dashboard → SQL Editor → 粘贴执行一次
-- 说明：
--   1) 段A insert on conflict do nothing —— 仅在 key 不存在时插入
--   2) 段B update —— 若之前执行过旧版(wholesale_tiers 缺 discount/returnRate)，补齐字段（幂等，可重复执行）
--   3) 两段都执行一次即可，已存在的数据不会被覆盖（仅补缺失字段）
--   4) 改价后虚拟支付类（tryon_*/daily_looks_*/articles_*）需同步
--      微信 MP 后台「虚拟支付 → 道具管理」改价并发布，两边价须一致
-- ============================================================

-- 段A：插入（key 不存在才插入）
insert into site_settings (key, value, updated_at) values (
  'wholesale_tiers',
  $$json$$
{
  "wholesale_6k": {
    "name": "会员·首充6000",
    "amountFen": 600000,
    "discount": 0.28,
    "returnRate": 0
  },
  "wholesale_5w": {
    "name": "充值会员·5万",
    "amountFen": 5000000,
    "discount": 0.28,
    "returnRate": 0.05
  },
  "wholesale_10w": {
    "name": "充值会员·10万",
    "amountFen": 10000000,
    "discount": 0.28,
    "returnRate": 0.1
  },
  "wholesale_30w": {
    "name": "充值会员·30万",
    "amountFen": 30000000,
    "discount": 0.26,
    "returnRate": 0.2
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

-- 段B：补齐 wholesale_tiers 的 discount / returnRate 字段（已存在则跳过，不会覆盖 name/amountFen）
update site_settings
set value = value
  || jsonb_build_object(
    'wholesale_6k',  (value->'wholesale_6k')  || '{"discount":0.28,"returnRate":0}',
    'wholesale_5w',  (value->'wholesale_5w')  || '{"discount":0.28,"returnRate":0.05}',
    'wholesale_10w', (value->'wholesale_10w') || '{"discount":0.28,"returnRate":0.10}',
    'wholesale_30w', (value->'wholesale_30w') || '{"discount":0.26,"returnRate":0.20}'
  )
where key = 'wholesale_tiers';

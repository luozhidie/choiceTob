-- 修正「¥998 虚拟试衣会员」权益文案：去掉折扣误导，只保留一件代发 + 会员价查看
-- 前提：vip_page_copy 已存在（你之前已执行过 vip_web_defaults 那段）
-- 在 Supabase Dashboard → SQL Editor 逐条粘贴执行（共 2 条）

-- [1/2] 改 tryonPlan（998 套餐卡）
update site_settings set value = jsonb_set(
  jsonb_set(value, '{tryonPlan,features}', '["单件一件代发","会员价拿货","赠专业版100次","无需预存"]'::jsonb),
  '{tryonPlan,discountLabel}', '"会员价拿货"'
) where key='vip_page_copy';

-- [2/2] 改 tryonCard（会员中心/引导区的代理卡）
update site_settings set value = jsonb_set(
  jsonb_set(value, '{tryonCard,features}', '["单件一件代发","会员价拿货","赠100次专属额度"]'::jsonb),
  '{tryonCard,sub}', '"¥998 开通 · 享一件代发与会员价查看"'
) where key='vip_page_copy';

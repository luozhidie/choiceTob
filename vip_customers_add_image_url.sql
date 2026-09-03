-- ============================================================
-- 代理中心「VIP客户形象照」- vip_customers 表补 image_url 列
-- 用途：核心会员 / 风格盘客户上传形象照后，URL 存到 vip_customers.image_url，
--       供「形象照 → 虚拟试衣一键试穿」闭环读取。
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行（幂等，可重复跑）。
-- ============================================================

ALTER TABLE public.vip_customers
  ADD COLUMN IF NOT EXISTS image_url text;

COMMENT ON COLUMN public.vip_customers.image_url IS '客户形象照URL（核心会员/风格盘/形象档案通用）';

SELECT 'vip_customers.image_url added (if not exists)' AS result;

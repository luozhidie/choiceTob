-- ============================================================
-- 代理中心深化：客户管理、虚拟试衣归因、收益明细、物流售后
-- 适用：Supabase SQL Editor 手动执行
-- ============================================================

-- 1. orders 增加物流字段（代理可见自己客户的物流）
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS express_company TEXT,
  ADD COLUMN IF NOT EXISTS tracking_no TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_agent_shipped ON public.orders(agent_id, shipped_at) WHERE agent_id IS NOT NULL;

-- 2. 虚拟试衣记录表（如不存在则创建；已存在则加字段）
CREATE TABLE IF NOT EXISTS public.tryon_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  openid TEXT,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  result_image_url TEXT,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tryon_agent ON public.tryon_records(agent_id, created_at DESC) WHERE agent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tryon_user ON public.tryon_records(user_id, created_at DESC);

-- 3. 代理售后申请表
CREATE TABLE IF NOT EXISTS public.agent_after_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('refund', 'return', 'exchange')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'rejected')),
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_aas_agent ON public.agent_after_sales(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_aas_order ON public.agent_after_sales(order_id);

-- 4. 商品营销素材字段（标题/卖点/文案）
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS marketing_title TEXT,
  ADD COLUMN IF NOT EXISTS marketing_points TEXT[],
  ADD COLUMN IF NOT EXISTS marketing_copy TEXT;

-- 5. RLS
ALTER TABLE public.tryon_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_after_sales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tryon_records' AND policyname = 'svc_tryon_records') THEN
    CREATE POLICY "svc_tryon_records" ON public.tryon_records FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agent_after_sales' AND policyname = 'svc_agent_after_sales') THEN
    CREATE POLICY "svc_agent_after_sales" ON public.agent_after_sales FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END
$$;

COMMENT ON COLUMN public.orders.express_company IS '物流公司';
COMMENT ON COLUMN public.orders.tracking_no IS '物流单号';
COMMENT ON COLUMN public.tryon_records.agent_id IS '试衣归因代理ID';
COMMENT ON COLUMN public.tryon_records.referral_code IS '试衣归因推广码';
COMMENT ON COLUMN public.products.marketing_copy IS '营销文案，代理可一键复制';

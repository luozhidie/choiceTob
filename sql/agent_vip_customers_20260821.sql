-- ============================================================
-- 代理中心「VIP客户资料管理」- vip_customers 表扩展
-- 用途：代理在代理中心新建的 VIP 客户资料，归属到该代理(agent_id)，
--       并带 source='agent' 标记，后台 VIP 管理(admin/vip)可见全部。
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行（幂等，可重复跑）。
-- ============================================================

-- 1. 归属字段：创建该 VIP 客户的代理
ALTER TABLE public.vip_customers
  ADD COLUMN IF NOT EXISTS agent_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. 来源标记：区分后台手动 / 代理新建 / 导入 / 风格测试
ALTER TABLE public.vip_customers
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'agent', 'import', 'style_test'));

-- 2.5 更新时间（代理编辑时写入）
ALTER TABLE public.vip_customers
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. 索引：按代理快速筛选
CREATE INDEX IF NOT EXISTS idx_vip_customers_agent_id
  ON public.vip_customers(agent_id);

-- 4. 备注（方便 Dashboard 查看）
COMMENT ON COLUMN public.vip_customers.agent_id IS '创建该VIP客户的代理UID；NULL=后台/手动录入';
COMMENT ON COLUMN public.vip_customers.source IS '来源：agent=代理在代理中心新建, manual=后台, import=导入, style_test=风格测试';

SELECT 'agent_vip_customers migration applied' AS result;

-- ============================================================
-- 代理中心「核心客户」+ 形象档案「客户画像」同步到 vip_customers
-- 用途：
--   1) 核心客户（agent-center 工作台十二位核心客户）→ source='agent_core'，按 agent_id 归属
--   2) 形象档案（style-profile，买家自选形象）      → source='profile'，  按 owner_id(openid) 归属
--   两者不互相同步：核心客户归代理，形象档案归用户本人；
--   形象档案记录 agent_id 为空，代理按 agent_id 过滤时天然看不到，仅管理员可见。
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行（幂等，可重复跑）。
-- ============================================================

-- 1. 归属字段：形象档案所属用户（与代理 agent_id 区分）
ALTER TABLE public.vip_customers
  ADD COLUMN IF NOT EXISTS owner_id text;

-- 2. 来源标记扩展：新增 agent_core(核心客户) / profile(形象档案)
ALTER TABLE public.vip_customers
  DROP CONSTRAINT IF EXISTS vip_customers_source_check;
ALTER TABLE public.vip_customers
  ADD CONSTRAINT vip_customers_source_check
    CHECK (source IN ('manual', 'agent', 'import', 'style_test', 'agent_core', 'profile'));

-- 3. name 改为可空：形象档案是买家自选形象，未必留姓名，用 notes 记 openid
ALTER TABLE public.vip_customers
  ALTER COLUMN name DROP NOT NULL;

-- 4. 索引：按归属键快速筛选
CREATE INDEX IF NOT EXISTS idx_vip_customers_owner_id
  ON public.vip_customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_vip_customers_source
  ON public.vip_customers(source);

-- 5. 注释
COMMENT ON COLUMN public.vip_customers.owner_id IS '形象档案所属用户 openid/user_id；NULL=代理录入的客户';
COMMENT ON COLUMN public.vip_customers.source IS '来源：agent=代理中心VIP/核心客户新建, agent_core=核心客户, profile=形象档案, manual=后台, import=导入, style_test=风格测试';

SELECT 'agent_vip_customers_sync migration applied' AS result;

-- 虚拟试衣权益表：拆分普通版/专业版次数，并新增试衣记录表（7 天历史）
-- 执行环境：Supabase Dashboard SQL Editor
-- 幂等：可重复执行

-- 1) 给 tryon_entitlements 增加普通版/专业版计数器
ALTER TABLE public.tryon_entitlements
  ADD COLUMN IF NOT EXISTS normal_left INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_left    INTEGER NOT NULL DEFAULT 0;

-- 2) 兼容旧数据：旧套餐均为"普通版"语义，把 tries_left 迁到 normal_left
--    仅当新列为 0 且旧列 >0 时才迁移，避免重复执行时覆盖已更新数据
UPDATE public.tryon_entitlements
SET normal_left = tries_left
WHERE normal_left = 0 AND COALESCE(tries_left, 0) > 0;

-- 3) 新建试衣记录表（7 天历史）
CREATE TABLE IF NOT EXISTS public.tryon_records (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid     TEXT NOT NULL,
  mode       TEXT NOT NULL DEFAULT 'normal',   -- normal | pro
  cloth_urls JSONB NOT NULL DEFAULT '[]'::jsonb, -- 本次试穿所用衣服图 URL 数组
  result_url TEXT,                              -- 合成结果图
  person_url TEXT,                              -- 用户人像（默认不存，留空）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tryon_records_openid  ON public.tryon_records(openid);
CREATE INDEX IF NOT EXISTS idx_tryon_records_created ON public.tryon_records(created_at);

-- 4) 物理清理 7 天前记录的 SQL（可手动执行或配定时任务）
-- DELETE FROM public.tryon_records WHERE created_at < NOW() - INTERVAL '7 days';

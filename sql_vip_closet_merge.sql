-- ============================================================
-- 合并「VIP衣橱（形象设计）」与「云衣橱（消费者自管）」
-- 思路：以 user_closet 为唯一数据源，用 source 字段区分
--   self    = 消费者自己上传（云衣橱）
--   stylist = 形象设计顾问推给客户的推荐款（VIP衣橱）
-- 在 Supabase Dashboard → SQL Editor 粘贴执行即可（幂等）。
-- ============================================================

-- 1. 扩展 user_closet
ALTER TABLE public.user_closet
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'self',
  ADD COLUMN IF NOT EXISTS recommended_by TEXT,
  ADD COLUMN IF NOT EXISTS recommend_note TEXT;

-- 2. 索引：按来源筛选
CREATE INDEX IF NOT EXISTS idx_user_closet_source_openid
  ON public.user_closet(openid, source);
CREATE INDEX IF NOT EXISTS idx_user_closet_source_user
  ON public.user_closet(user_id, source);

-- 3. 备注（方便 Dashboard 查看）
COMMENT ON COLUMN public.user_closet.source IS 'self=消费者自传(云衣橱); stylist=形象设计顾问推荐(VIP衣橱)';
COMMENT ON COLUMN public.user_closet.recommended_by IS '推送顾问标识（微信/后台账号名）';
COMMENT ON COLUMN public.user_closet.recommend_note IS '顾问给客户的推荐说明';

-- 4. 校验：source 只能取这两个值
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_user_closet_source'
  ) THEN
    ALTER TABLE public.user_closet
      ADD CONSTRAINT chk_user_closet_source
      CHECK (source IN ('self', 'stylist'));
  END IF;
END $$;

SELECT 'vip_closet_merge applied' AS result;

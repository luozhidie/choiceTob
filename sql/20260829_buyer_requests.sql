-- 组货/找货需求表：店主与用户提交「想找的货 / 风格 / 色系 / 孤品搭配」等需求
-- 在「时尚买手服务」->「提交需求」入口提交，后台 /admin/buyer-requests 跟进
-- 不 DROP，不与现有表冲突；已在生产库存在同名表时自动跳过。

CREATE TABLE IF NOT EXISTS buyer_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text,                                   -- 提交人标识（小程序 token 解析的 uid / openid）
  contact_name text,                                   -- 称呼（选填）
  contact_info text,                                   -- 联系方式：手机 / 微信 / 邮箱
  category     text,                                   -- 想要的品类/款式（外套/连衣裙/套装…）
  style        text,                                   -- 风格诉求（少女/优雅/自然…）
  color        text,                                   -- 色系诉求（奶杏/深冷…）
  has_orphan   boolean NOT NULL DEFAULT false,          -- 是否有孤品需要搭配
  budget_min   numeric,                                -- 预算下限（元）
  budget_max   numeric,                                -- 预算上限（元）
  note         text,                                   -- 详细描述 / 特殊诉求
  images       text[],                                 -- 参考图 URL 数组
  status       text NOT NULL DEFAULT 'pending',        -- pending/reviewed/matched/contacted/done
  admin_note   text,                                   -- 后台备注
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 索引：按状态与创建时间查询
CREATE INDEX IF NOT EXISTS idx_buyer_requests_status ON buyer_requests (status);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_user   ON buyer_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_buyer_requests_created ON buyer_requests (created_at DESC);

-- 状态枚举约束（可选保护，已有的脏数据若违反需先清洗）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'buyer_requests_status_chk'
  ) THEN
    ALTER TABLE buyer_requests
      ADD CONSTRAINT buyer_requests_status_chk
      CHECK (status IN ('pending','reviewed','matched','contacted','done'));
  END IF;
END $$;

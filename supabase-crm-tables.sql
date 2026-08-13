-- ============================================================
-- 潜客管理系统 (CRM) - Supabase 数据库建表脚本
-- 执行方式：Supabase Dashboard → SQL Editor → 粘贴执行
-- ============================================================

-- 1. 门店表
CREATE TABLE IF NOT EXISTS crm_stores (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  address         TEXT,
  owner_phone     TEXT NOT NULL,          -- 手机号必填
  owner_name      TEXT,                   -- 老板姓名
  industry        TEXT DEFAULT '服装店' CHECK (industry IN ('服装店', '轮胎店', '滋补行', '其他')),
  landline        TEXT,                   -- 座机
  email           TEXT,
  business_hours  TEXT,                   -- 营业时间
  business_scope  TEXT,                   -- 经营范围
  source          TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'scrape')),
  source_detail   TEXT,                   -- 来源详情（如哪个网站、哪个文件）
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  tags            TEXT[] DEFAULT '{}',    -- 标签
  notes           TEXT,                   -- 备注
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ             -- 软删除
);

-- 2. 联系人表
CREATE TABLE IF NOT EXISTS crm_contacts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id        UUID REFERENCES crm_stores(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,          -- 手机号必填
  position        TEXT,                   -- 职位（老板/店长/采购/其他）
  wechat_status   TEXT DEFAULT 'NOT_ADDED' CHECK (wechat_status IN ('NOT_ADDED', 'ADDED', 'DEAL', 'REFUSED', 'INVALID')),
  wechat_id       TEXT,                   -- 微信号
  wechat_added_at TIMESTAMPTZ,           -- 添加微信时间
  is_decision_maker BOOLEAN DEFAULT FALSE, -- 是否决策人
  remark          TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

-- 3. 跟进记录表
CREATE TABLE IF NOT EXISTS crm_follow_ups (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id        UUID REFERENCES crm_stores(id) ON DELETE CASCADE NOT NULL,
  contact_id      UUID REFERENCES crm_contacts(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  follow_time     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method          TEXT NOT NULL CHECK (method IN ('PHONE', 'WECHAT', 'VISIT', 'OTHER')),
  content         TEXT NOT NULL,
  result          TEXT NOT NULL CHECK (result IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'NO_RESPONSE')),
  next_remind_at  TIMESTAMPTZ,           -- 下次跟进提醒
  reminded        BOOLEAN DEFAULT FALSE,  -- 是否已提醒
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 微信话术模板表
CREATE TABLE IF NOT EXISTS crm_wechat_templates (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category        TEXT NOT NULL,          -- 分类：首次添加/节日问候/服务推荐/跟进维护/活动邀请
  industry        TEXT DEFAULT '通用',    -- 适用行业
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,
  is_default      BOOLEAN DEFAULT FALSE,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 通知/提醒表
CREATE TABLE IF NOT EXISTS crm_notifications (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('FOLLOW_UP_REMINDER', 'WECHAT_ADD_REMINDER', 'STORE_STATUS_CHANGE')),
  title           TEXT NOT NULL,
  content         TEXT,
  related_id      UUID,                   -- 关联的跟进记录ID
  related_type    TEXT,                   -- 关联类型：follow_up / contact / store
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_crm_stores_user ON crm_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_stores_deleted ON crm_stores(deleted_at);
CREATE INDEX IF NOT EXISTS idx_crm_stores_source ON crm_stores(source);
CREATE INDEX IF NOT EXISTS idx_crm_stores_industry ON crm_stores(industry);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_store ON crm_contacts(store_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_user ON crm_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_wechat ON crm_contacts(wechat_status);

CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_store ON crm_follow_ups(store_id);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_contact ON crm_follow_ups(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_follow_ups_remind ON crm_follow_ups(next_remind_at) WHERE next_remind_at IS NOT NULL AND reminded = FALSE;

CREATE INDEX IF NOT EXISTS idx_crm_notifications_user ON crm_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_notifications_read ON crm_notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================
-- RLS 策略
-- ============================================================
ALTER TABLE crm_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_wechat_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notifications ENABLE ROW LEVEL SECURITY;

-- crm_stores: 管理员可操作
DROP POLICY IF EXISTS crm_stores_select ON crm_stores;
CREATE POLICY crm_stores_select ON crm_stores FOR SELECT USING (true);
DROP POLICY IF EXISTS crm_stores_insert ON crm_stores;
CREATE POLICY crm_stores_insert ON crm_stores FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS crm_stores_update ON crm_stores;
CREATE POLICY crm_stores_update ON crm_stores FOR UPDATE USING (true);
DROP POLICY IF EXISTS crm_stores_delete ON crm_stores;
CREATE POLICY crm_stores_delete ON crm_stores FOR DELETE USING (true);

-- crm_contacts
DROP POLICY IF EXISTS crm_contacts_select ON crm_contacts;
CREATE POLICY crm_contacts_select ON crm_contacts FOR SELECT USING (true);
DROP POLICY IF EXISTS crm_contacts_insert ON crm_contacts;
CREATE POLICY crm_contacts_insert ON crm_contacts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS crm_contacts_update ON crm_contacts;
CREATE POLICY crm_contacts_update ON crm_contacts FOR UPDATE USING (true);
DROP POLICY IF EXISTS crm_contacts_delete ON crm_contacts;
CREATE POLICY crm_contacts_delete ON crm_contacts FOR DELETE USING (true);

-- crm_follow_ups
DROP POLICY IF EXISTS crm_follow_ups_select ON crm_follow_ups;
CREATE POLICY crm_follow_ups_select ON crm_follow_ups FOR SELECT USING (true);
DROP POLICY IF EXISTS crm_follow_ups_insert ON crm_follow_ups;
CREATE POLICY crm_follow_ups_insert ON crm_follow_ups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS crm_follow_ups_update ON crm_follow_ups;
CREATE POLICY crm_follow_ups_update ON crm_follow_ups FOR UPDATE USING (true);
DROP POLICY IF EXISTS crm_follow_ups_delete ON crm_follow_ups;
CREATE POLICY crm_follow_ups_delete ON crm_follow_ups FOR DELETE USING (true);

-- crm_wechat_templates: 所有人可读，管理员可写
DROP POLICY IF EXISTS crm_wechat_templates_select ON crm_wechat_templates;
CREATE POLICY crm_wechat_templates_select ON crm_wechat_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS crm_wechat_templates_insert ON crm_wechat_templates;
CREATE POLICY crm_wechat_templates_insert ON crm_wechat_templates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS crm_wechat_templates_update ON crm_wechat_templates;
CREATE POLICY crm_wechat_templates_update ON crm_wechat_templates FOR UPDATE USING (true);
DROP POLICY IF EXISTS crm_wechat_templates_delete ON crm_wechat_templates;
CREATE POLICY crm_wechat_templates_delete ON crm_wechat_templates FOR DELETE USING (true);

-- crm_notifications
DROP POLICY IF EXISTS crm_notifications_select ON crm_notifications;
CREATE POLICY crm_notifications_select ON crm_notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS crm_notifications_insert ON crm_notifications;
CREATE POLICY crm_notifications_insert ON crm_notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS crm_notifications_update ON crm_notifications;
CREATE POLICY crm_notifications_update ON crm_notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS crm_notifications_delete ON crm_notifications;
CREATE POLICY crm_notifications_delete ON crm_notifications FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 预置微信话术模板数据
-- ============================================================
INSERT INTO crm_wechat_templates (category, industry, title, content, is_default, sort_order) VALUES

-- ====== 首次添加 ======
('首次添加', '通用', '基础版-自我介绍', '您好！我是色彩智选的[姓名]，专注为门店提供选品、搭配和企划服务。看到您店铺很有品味，想和您交流一下行业心得，方便的话通过一下～', true, 1),
('首次添加', '服装店', '服装店版-专业切入', '您好！我是色彩智选的[姓名]，我们专门帮服装门店做选品优化和搭配方案。最近帮[附近某店]做了春季选品调整，销量提升了30%，想跟您分享一下经验，可以加个微信聊聊吗？', true, 2),
('首次添加', '服装店', '服装店版-服务价值', '老板好！我是做服装门店服务的色彩智选[姓名]，我们提供从选品到陈列的一站式解决方案。了解到您店里的情况后觉得我们的服务很适合您，想加您微信详细聊聊？', false, 3),
('首次添加', '轮胎店', '轮胎店版-专业切入', '老板好！我是色彩智选的[姓名]，我们专门帮轮胎店做库存优化和采购选品。现在很多同行都在用我们的方案降本增效，想跟您聊聊有没有可以帮到您的地方？', true, 4),
('首次添加', '轮胎店', '轮胎店版-服务价值', '您好！我是做轮胎门店服务的色彩智选[姓名]，我们提供轮胎选品、库存管理和客户维护方案。了解过您店的情况，觉得我们能帮到您，方便加个微信吗？', false, 5),
('首次添加', '滋补行', '滋补行版-专业切入', '您好！我是色彩智选的[姓名]，我们专门帮滋补行做选品优化和营销方案。现在很多同行都在用我们的方案提升复购率，想跟您交流一下？', true, 6),
('首次添加', '滋补行', '滋补行版-服务价值', '老板好！我是做滋补行业服务的色彩智选[姓名]，我们提供从选品到客户维护的一站式方案。了解到您店的情况觉得很适合合作，加个微信聊聊？', false, 7),
('首次添加', '通用', '简洁版-直接说明来意', '您好，我是色彩智选的[姓名]，做门店服务的。想跟您聊聊合作可能，方便加个微信吗？', false, 8),

-- ====== 节日问候 ======
('节日问候', '通用', '春节问候', '老板新年好！祝您新的一年生意兴隆、财源广进！新的一年有新的需求，随时找我聊聊～', true, 10),
('节日问候', '通用', '中秋问候', '中秋快乐！祝您阖家团圆、生意红火！有什么需要帮忙的，随时联系我～', true, 11),
('节日问候', '通用', '五一问候', '五一快乐！假期是销售旺季，祝您爆单！有什么需求随时找我～', false, 12),

-- ====== 服务推荐 ======
('服务推荐', '服装店', '选品服务推荐', '老板好！最近我们上了新的服装选品方案，根据您店铺的风格定位和客户画像做精准选品推荐，帮您省去到处找货的时间。感兴趣的话我发您看看？', true, 20),
('服务推荐', '服装店', '搭配方案推荐', '您好！我们最近推出了门店搭配方案服务，根据季节和流行趋势帮您做橱窗搭配和陈列优化，提升进店转化率。要不要了解一下？', true, 21),
('服务推荐', '轮胎店', '库存优化推荐', '老板好！我们最近推出了轮胎库存优化方案，根据您店铺的销量数据做智能补货建议，减少积压提升周转率。感兴趣的话我发您看看？', true, 22),
('服务推荐', '轮胎店', '采购选品推荐', '您好！我们有最新的轮胎品牌和型号选品方案，帮您找到高性价比的货源。要不要了解一下？', false, 23),
('服务推荐', '滋补行', '选品服务推荐', '老板好！最近我们上了新的滋补品选品方案，根据您店铺的客群和季节做精准推荐，帮您选到好卖的好货。感兴趣的话我发您看看？', true, 24),
('服务推荐', '滋补行', '客户维护推荐', '您好！我们推出了滋补行客户维护方案，包括会员管理、复购提醒和节日营销，帮您提升老客户复购率。要不要了解一下？', false, 25),

-- ====== 跟进维护 ======
('跟进维护', '通用', '日常关怀', '老板好！最近生意怎么样？有什么需要帮忙的随时说，我们这边最新的服务和资源都可以给您看看～', true, 30),
('跟进维护', '通用', '回访跟进', '老板好！之前给您推荐的方案考虑得怎么样了？有什么疑问我都可以解答，或者您有什么新的需求也可以告诉我～', true, 31),
('跟进维护', '服装店', '换季提醒', '老板好！换季了，新一季的选品方案出来了，要不要看看？提前规划主推款，不愁旺季没好卖～', false, 32),
('跟进维护', '轮胎店', '库存关怀', '老板好！最近轮胎价格有波动，需要补货的话可以看看我们的选品方案，性价比很高～', false, 33),
('跟进维护', '滋补行', '应季提醒', '老板好！现在是滋补品旺季，我们的应季选品方案出来了，要不要看看？都是好卖的高毛利品～', false, 34),

-- ====== 活动邀请 ======
('活动邀请', '通用', '线下沙龙邀请', '老板好！我们这周末有一个门店经营沙龙，会分享选品技巧和营销方案，名额有限，您有兴趣参加吗？', true, 40),
('活动邀请', '通用', '线上直播邀请', '您好！今晚8点我们有一场线上直播，主题是「门店选品与营销趋势」，干货满满，来看看呗？', true, 41),
('活动邀请', '通用', '优惠活动通知', '老板好！我们本周有服务优惠活动，[具体优惠内容]，有需要的话赶紧联系我～', false, 42);

-- ============================================================
-- 自动更新 updated_at 的触发器函数
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crm_stores_updated ON crm_stores;
CREATE TRIGGER trg_crm_stores_updated BEFORE UPDATE ON crm_stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_contacts_updated ON crm_contacts;
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_crm_wechat_templates_updated ON crm_wechat_templates;
CREATE TRIGGER trg_crm_wechat_templates_updated BEFORE UPDATE ON crm_wechat_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 20260717 店铺级可编辑内容（详情页底部内容块）
-- 用途：拿货指南 / 店主技巧 / 面料洗护 / 店铺介绍 / 发货说明
--       改成后台一处编辑、全店通用（不再写死在代码里）
-- 请在 Supabase SQL Editor 执行（Vercel 不会自动跑迁移）
-- ============================================================

CREATE TABLE IF NOT EXISTS store_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT DEFAULT '骆芷蝶智选',
  intro TEXT,                          -- 店铺介绍
  shipping_note TEXT,                  -- 发货/物流说明
  wholesale_guide JSONB DEFAULT '[]'::jsonb,  -- 拿货指南 [{title, desc}]
  seller_tips JSONB DEFAULT '[]'::jsonb,      -- 店主拿货技巧 [{title, desc}]
  fabric_care TEXT,                    -- 面料洗护指南
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 默认插入一行（全店共用这一行）
INSERT INTO store_content (shop_name)
SELECT '骆芷蝶智选'
WHERE NOT EXISTS (SELECT 1 FROM store_content);

-- 公开可读（详情页前端读取）
ALTER TABLE store_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "公开读取店铺内容" ON store_content;
CREATE POLICY "公开读取店铺内容" ON store_content FOR SELECT USING (true);

-- 初始化默认内容（若 intro 等为空则填充行业通用文案）
UPDATE store_content SET
  intro = COALESCE(intro, '泉州鲤城服装批发 · 一手货源 · 一件起批 · 支持退换'),
  shipping_note = COALESCE(shipping_note, '现货 48 小时内发出，默认顺丰/京东，满额包邮；偏远地区补差价。'),
  wholesale_guide = COALESCE(wholesale_guide, '[
    {"title":"起批规则","desc":"同色同款 3 件起批，支持多色混批；拿货会员享专属拿货价。"},
    {"title":"发货时效","desc":"现货 48 小时内发出，预售款按页面标注天数发货；急单可联系客服备注。"},
    {"title":"退换政策","desc":"非质量问题 7 天内可退换（吊牌完好、未水洗），质量问题运费由本店承担。"},
    {"title":"物流与运费","desc":"默认发顺丰/京东，满额包邮；偏远地区补差价，大货可走物流专线。"}
  ]'::jsonb),
  seller_tips = COALESCE(seller_tips, '[
    {"title":"选码技巧","desc":"版型偏大一码可拍小一码；模特身高 168 穿 M，微胖建议选 L。"},
    {"title":"拿货节奏","desc":"应季款提前 2-3 周上新拿货，换季清仓价最优但尺码易缺。"},
    {"title":"搭配拿货提升连带","desc":"按「一品三搭」思路同批次拿：上装+下装+配饰，客单价更高。"},
    {"title":"质量把控","desc":"到货先抽检车工/走线/印花；首单小批量测款，数据好再追大货。"}
  ]'::jsonb),
  fabric_care = COALESCE(fabric_care, '建议手洗或轻柔机洗，深浅色分开；阴凉通风晾干，避免暴晒；熨烫中温，勿直接接触印花。')
WHERE intro IS NULL OR wholesale_guide = '[]'::jsonb;

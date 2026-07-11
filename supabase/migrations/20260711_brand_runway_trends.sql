-- 品牌发布会/秀场趋势采集表
-- 在 Supabase SQL Editor 中执行（管理员权限）
-- 用途：存储一线品牌各季发布会采集到的主色/风格/廓形/主题，供 AI 企划参考

CREATE TABLE IF NOT EXISTS brand_runway_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season TEXT NOT NULL,                 -- 例如 "2027 春夏"
  year INT NOT NULL,
  brand TEXT NOT NULL,
  source_url TEXT,
  snippet TEXT,
  dominant_colors TEXT[],               -- 秀场主色（中文）
  dominant_styles TEXT[],               -- 主导风格（如 静奢/新中式/运动）
  key_silhouettes TEXT[],               -- 关键廓形/单品（如 阔腿裤/大衣/抹胸）
  themes TEXT[],                        -- 主题关键词
  summary TEXT,                         -- 该品牌本季一句话总结
  collected_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runway_season ON brand_runway_trends(season);
CREATE INDEX IF NOT EXISTS idx_runway_brand ON brand_runway_trends(brand);

-- 仅管理员通过后台 API（service role）读写，关闭 RLS 避免匿名拦截
ALTER TABLE brand_runway_trends DISABLE ROW LEVEL SECURITY;

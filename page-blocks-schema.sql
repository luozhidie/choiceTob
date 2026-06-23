-- page_blocks.sql
-- 网站版块配置表
-- 用于存储首页/各页面的自定义版块（团购、秒杀、商品展示等）

CREATE TABLE IF NOT EXISTS page_blocks (
  id TEXT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,                    -- 版块标题
  type VARCHAR(50) NOT NULL DEFAULT 'products',   -- 版块类型：products|promotion|custom|group_buy|flash_sale|recommendation
  content JSONB DEFAULT '{}',                     -- 版块内容配置（JSON）
  style JSONB DEFAULT '{                          -- 样式配置
    "bgColor": "#ffffff",
    "textColor": "#333333",
    "padding": 16,
    "borderRadius": 12
  }',
  page VARCHAR(50) DEFAULT 'home',                -- 所属页面：home|buyer|members等
  is_published BOOLEAN DEFAULT TRUE,              -- 是否发布
  sort_order INT DEFAULT 0,                       -- 排序权重（越小越靠前）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_page_blocks_page ON page_blocks(page);
CREATE INDEX IF NOT EXISTS idx_page_blocks_type ON page_blocks(type);
CREATE INDEX IF NOT EXISTS idx_page_blocks_published ON page_blocks(is_published);
CREATE INDEX IF NOT EXISTS idx_page_blocks_sort_order ON page_blocks(sort_order);

-- 启用RLS（行级安全）
ALTER TABLE page_blocks ENABLE ROW LEVEL SECURITY;

-- 允许所有认证用户读取版块（用于前台展示）
CREATE POLICY "允许读取已发布版块" ON page_blocks
  FOR SELECT USING (is_published = TRUE);

-- 允许管理员CRUD操作（通过Supabase Auth角色）
-- 注意：实际生产环境应该限制为特定管理员角色

COMMENT ON TABLE page_blocks IS '网站版块配置表 - 存储首页及各页面的可编辑版块';
COMMENT ON COLUMN page_blocks.type IS '版块类型: products=商品展示, promotion=营销活动, custom=自定义, group_buy=团购拼单, flash_sale=限时秒杀, recommendation=智能推荐';
COMMENT ON COLUMN page_blocks.content IS 'JSON格式的版块内容配置，根据type不同结构不同';

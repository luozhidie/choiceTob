-- ============================================
-- 创建 page_blocks 表（版块管理）
-- 在 Supabase Dashboard > SQL Editor 中执行
-- ============================================

CREATE TABLE IF NOT EXISTS public.page_blocks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'products' CHECK (type IN ('products', 'promotion', 'custom', 'group_buy', 'flash_sale', 'recommendation')),
  content JSONB DEFAULT '{}',
  style JSONB DEFAULT '{"bgColor":"#ffffff","textColor":"#333333","padding":16,"borderRadius":12}',
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 启用 RLS
ALTER TABLE public.page_blocks ENABLE ROW LEVEL SECURITY;

-- 允许已登录用户读取（前台展示用）
CREATE POLICY "page_blocks_select_authenticated" ON public.page_blocks
  FOR SELECT USING (auth.role() = 'authenticated');

-- 允许管理员通过 service_role 操作（API端已验证admin身份）
-- 注意：实际写入操作由后端API使用 service_role key 完成，不受此策略限制

-- 添加搜索索引
CREATE INDEX IF NOT EXISTS idx_page_blocks_sort_order ON public.page_blocks(sort_order);
CREATE INDEX IF NOT EXISTS idx_page_blocks_type ON public.page_blocks(type);
CREATE INDEX IF NOT EXISTS idx_page_blocks_published ON public.page_blocks(is_published);

-- 验证表是否创建成功
SELECT count(*) as "版块数量" FROM public.page_blocks;

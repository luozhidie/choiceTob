-- ==========================================
-- buyer_products 表完整补丁
-- 一次性添加供应商提交表单所需的所有列
-- 在 Supabase SQL Editor 中执行此脚本
-- ==========================================

-- 基本信息
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS product_code text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS brand text;

-- 价格
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS original_price integer;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS wholesale_price integer DEFAULT 0;

-- 分类
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS subcategory text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS color_season text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS color_name text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS style_type text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS style_name text;

-- 库存与排序
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 图片
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 商品属性（数组）
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS fabrics text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS seasons text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS occasions text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS fits text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}';
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- 商品参数（单值）
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS elasticity text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS thickness text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS lining text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS weight text;

-- 供应商信息
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_phone text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_wechat text;

-- 来源
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS source text DEFAULT 'platform';

-- 允许供应商提交（INSERT）
DROP POLICY IF EXISTS "Allow anon insert buyer_products" ON buyer_products;
CREATE POLICY "Allow anon insert buyer_products"
  ON buyer_products FOR INSERT TO anon, authenticated
  WITH CHECK (source = 'supplier_submit');

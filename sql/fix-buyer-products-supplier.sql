-- ==========================================
-- 补充 buyer_products 表字段（供应商提交商品）
-- ==========================================

-- 多图URL
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 供应商相关字段
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_name text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_phone text;
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS supplier_wechat text;

-- 商品详细参数
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS product_code text;       -- 货号/款号
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS brand text;              -- 品牌
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS fabrics text[] DEFAULT '{}';     -- 面料成分
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS seasons text[] DEFAULT '{}';     -- 适用季节
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS occasions text[] DEFAULT '{}';   -- 适用场合
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS fits text[] DEFAULT '{}';        -- 版型
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}';       -- 尺码范围
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS wholesale_price integer DEFAULT 0; -- 批发价（分）
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS weight text;             -- 克重
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS elasticity text;         -- 弹力
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS thickness text;          -- 厚薄
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS lining text;             -- 里布
ALTER TABLE buyer_products ADD COLUMN IF NOT EXISTS source text DEFAULT 'platform';  -- 来源: platform / supplier_submit

-- 允许供应商(anon)插入（提交商品）
DROP POLICY IF EXISTS "Allow anon insert buyer_products" ON buyer_products;
CREATE POLICY "Allow anon insert buyer_products"
  ON buyer_products FOR INSERT TO anon, authenticated
  WITH CHECK (source = 'supplier_submit');

-- ==========================================
-- 创建 supplier-products Storage Bucket
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-products', 'supplier-products', true)
ON CONFLICT (id) DO NOTHING;

-- 允许公开读取
DROP POLICY IF EXISTS "Public read supplier-products" ON storage.objects;
CREATE POLICY "Public read supplier-products"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'supplier-products');

-- 允许上传（anon + authenticated）
DROP POLICY IF EXISTS "Allow upload supplier-products" ON storage.objects;
CREATE POLICY "Allow upload supplier-products"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'supplier-products');

-- 允许删除（admin）
DROP POLICY IF EXISTS "Admin delete supplier-products" ON storage.objects;
CREATE POLICY "Admin delete supplier-products"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'supplier-products' AND auth.email() = 'luozhidie@live.cn');

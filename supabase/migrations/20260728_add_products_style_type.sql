-- 修复 admin 商品表单保存报错 "could not find products.style_type"
-- products 表此前仅有 style_conclusion（AI/自动风格结论），缺少人工选择的 style_type 列；
-- 而 src/app/admin/products/page.tsx 保存时会写入 style_type，导致列不存在报错。
-- 此处补齐该列，与 attribute_fabrics/cuts/patterns 及 buyer/display/planning 等表的 style_type 语义一致。

ALTER TABLE products ADD COLUMN IF NOT EXISTS style_type text;

COMMENT ON COLUMN products.style_type IS '人工标注的风格类型：少女型/优雅型/浪漫型/少年型/时尚型/古典型/自然型/戏剧型';

CREATE INDEX IF NOT EXISTS idx_products_style_type ON products(style_type);

-- 刷新 PostgREST 架构缓存，使新列立即对 API 可见
NOTIFY pgrst, 'reload schema';

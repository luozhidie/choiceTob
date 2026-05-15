-- ==========================================
-- 商品品类升级：添加 subcategory 字段
-- ==========================================

-- 添加子分类字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE products ADD COLUMN subcategory text;
  END IF;
END $$;

-- 迁移旧数据：把旧的 category 值映射到新体系
-- 旧: accessory / clothing / tool / book
-- 新: color_tools / clothing / accessory / book / pro_tool
UPDATE products SET category = 'color_tools' WHERE category = 'tool';

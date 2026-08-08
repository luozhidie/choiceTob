-- 20260718 增加商品详细参数（服装规格）JSONB 列
-- 说明：此前表单仅有 material/sizes/origin/care_instructions/weight/brand 6 个通用字段，
--       缺少同行（一手/1688）常见的服装详细规格。这里用 params JSONB 统一收纳，
--       字段顺序与 key 见后台表单「详细参数（服装规格）」分组。
ALTER TABLE products ADD COLUMN IF NOT EXISTS params JSONB;

COMMENT ON COLUMN products.params IS '商品详细参数 JSONB：fabric 面料 / accessories 配件 / lining 里布 / thickness 厚度 / season 季节 / skirt_type 裙型 / silhouette 廓形 / collar 领型 / skirt_length 裙长 / scene 穿着场景 / fit 版型 / placket 门襟 / sleeve_type 袖型 / sleeve_length 袖长 / craft 工艺 / pattern 图案';

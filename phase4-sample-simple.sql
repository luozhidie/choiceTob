-- 补全列 + 插入9件示例商品（最短版本）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='title') THEN ALTER TABLE products ADD COLUMN title text NOT NULL DEFAULT ''; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='description') THEN ALTER TABLE products ADD COLUMN description text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='price') THEN ALTER TABLE products ADD COLUMN price integer NOT NULL DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='original_price') THEN ALTER TABLE products ADD COLUMN original_price integer; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category') THEN ALTER TABLE products ADD COLUMN category text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='subcategory') THEN ALTER TABLE products ADD COLUMN subcategory text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='tags') THEN ALTER TABLE products ADD COLUMN tags text[]; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_published') THEN ALTER TABLE products ADD COLUMN is_published boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock') THEN ALTER TABLE products ADD COLUMN stock integer DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sort_order') THEN ALTER TABLE products ADD COLUMN sort_order integer DEFAULT 0; END IF;
END $$;

INSERT INTO products (title, description, price, original_price, category, subcategory, tags, is_published, stock, sort_order) VALUES
('四季色彩色布套组', '含96色色布，覆盖12季型判色需求', 9900, 12800, 'color_tools', 'color_cloth', ARRAY['热销','专业必备'], true, 50, 10),
('PANTONE色卡（纺织版）', '2625种服装纺织流行色', 19800, 25800, 'color_tools', 'color_card', ARRAY['专业推荐'], true, 30, 20),
('真丝连衣裙（净暖型）', '100%桑蚕丝，净暖型专属色系', 89800, 129800, 'clothing', 'dress', ARRAY['净暖型','真丝'], true, 20, 30),
('高支棉西装外套（浅冷型）', '120支长绒棉，浅冷型专属配色', 65800, 89800, 'clothing', 'outerwear', ARRAY['浅冷型','外套'], true, 15, 40),
('真丝小方巾（12季型）', '60x60cm桑蚕丝，12款季型配色', 29800, 39800, 'accessory', 'scarf', ARRAY['真丝','12季型'], true, 100, 50),
('几何耳饰套装3件', '925银针，冷柔/净冷/深冷三款', 12800, NULL, 'accessory', 'jewelry', ARRAY['925银','冷色调'], true, 200, 60),
('四季色彩理论入门书', '系统讲解四季色彩理论与搭配', 6800, 9800, 'book', 'color_theory', ARRAY['入门必读'], true, 500, 70),
('陈列展示架（可调节）', '高度120-200cm可调，导轨式', 59800, 79800, 'pro_tool', 'display_rack', ARRAY['门店陈列'], true, 10, 80),
('LED服装陈列射灯', 'CRI95，3000K/4000K色温切换', 19800, 25800, 'pro_tool', 'lighting', ARRAY['陈列灯光'], true, 50, 90);

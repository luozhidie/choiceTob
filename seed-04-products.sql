-- 4. 买手选品 buyer_products (8条)
INSERT INTO buyer_products (title, description, price, original_price, category, subcategory, color_season, style_type, stock, tags, is_published, sort_order) VALUES
('莫兰迪色羊毛大衣', '90支澳毛，三色可选', 69800, 129800, 'clothing', 'coat', 'soft_warm', 'you_ya', 25, '{"秋冬","外套","大衣"}', true, 1),
('复古港风灯芯绒西装', '焦糖棕/墨绿两色，宽松廓形', 42800, 79800, 'clothing', 'suit', 'deep_warm', 'shi_shang_f', 35, '{"秋冬","西装","复古"}', true, 2),
('极简通勤直筒西裤', '垂感面料，黑灰藏青', 26800, 49800, 'clothing', 'pants', 'cool_soft', 'shao_nian_f', 60, '{"通勤","裤装","基础款"}', true, 3),
('法式优雅V领针织衫', '羊毛混纺，奶白燕麦雾霾蓝', 19800, 36800, 'clothing', 'tops', 'warm_bright', 'lang_man_f', 45, '{"秋冬","针织","内搭"}', true, 4),
('波西米亚印花长裙', '度假风，红棕姜黄墨绿', 35800, 65800, 'clothing', 'dress', 'clear_warm', 'zi_ran_f', 20, '{"春夏","裙装","度假"}', true, 5),
('新中式盘扣衬衫', '真丝混纺，墨绿香槟藏青', 32800, 59800, 'clothing', 'tops', 'deep_cool', 'gu_dian_f', 30, '{"新中式","衬衫","国风"}', true, 6),
('轻奢极简托特包', '头层牛皮，黑焦糖奶白', 45800, 89800, 'accessory', 'bag', 'clear_cool', 'shi_shang_f', 40, '{"包袋","轻奢","通勤"}', true, 7),
('马卡龙色系羊绒围巾', '山羊绒，粉蓝黄绿四色', 15800, 29800, 'accessory', 'scarf', 'light_warm', 'shao_nv', 80, '{"配饰","围巾","秋冬"}', true, 8);
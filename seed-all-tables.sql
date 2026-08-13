-- ==========================================
-- 骆芷蝶智选 - 全表种子数据 (Seed Data)
-- 执行后所有后台页面立刻有示例内容
-- ==========================================

-- -------- 1. 陈列搭配 display_images --------
INSERT INTO display_images (sort_order, title, label, section, scenario, description, color_season, style_type, image_url, is_published) VALUES
(1, '法式优雅风橱窗陈列', '法式优雅', 'styles', 'date', '以米白、裸粉为主色调，搭配丝绒材质与珍珠配饰，营造浪漫法式氛围', 'warm_soft', 'you_ya', 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&h=600&fit=crop', true),
(2, '极简通勤门店布局', '极简通勤', 'layouts', 'workplace', '冷灰+藏青配色，直线型货架布局，突出高效与专业感', 'cool_soft', 'shao_nian_f', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop', true),
(3, '周末约会场景搭配', '约会场景', 'scenarios', 'date', '浅暖型客户推荐：碎花连衣裙+草编包+裸色单鞋', 'light_warm', 'lang_man_f', 'https://images.unsplash.com/photo-1485968579169-a6b0e58f6d49?w=800&h=600&fit=crop', true),
(4, '新中式国风陈列', '新中式', 'styles', 'party', '墨绿+香槟金配色，搭配盘扣与刺绣元素，适合晚宴社交场景', 'deep_warm', 'gu_dian_f', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop', true),
(5, '韩系清新休闲区', '韩系清新', 'scenarios', 'casual', '马卡龙色系卫衣+牛仔裤+帆布包，明亮轻快', 'light_cool', 'shao_nv', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=600&fit=crop', true),
(6, '轻奢极简VIP专区', '轻奢极简', 'layouts', 'workplace', '黑白灰主调，点缀玫瑰金道具，营造高端购物体验', 'clear_cool', 'shi_shang_f', 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&h=600&fit=crop', true);

-- -------- 2. 选品功能 buyer_features --------
INSERT INTO buyer_features (sort_order, title, description, image_url, is_published) VALUES
(0, 'AI智能风格诊断', '上传客户照片，AI自动分析色彩季型与风格类型，精准推荐适配商品', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop', true),
(1, '爆款数据分析', '实时追踪平台热销款式、颜色与价格带，帮助买手把握市场脉搏', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', true),
(2, '四步精准选品', '需求分析→风格匹配→色彩搭配→价格带筛选，系统化降低选品风险', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', true),
(3, 'VIP专属货源', '充值解锁2.6折起拿货价，支持5%-20%退换比例，降低库存压力', 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop', true);

-- -------- 3. 选品步骤 buyer_steps --------
INSERT INTO buyer_steps (step_number, title, description, detail_content, image_url, is_published) VALUES
(1, '需求分析', '明确客户群体、店铺定位与季节需求，建立选品基准', '详细步骤：1) 收集客户基础信息（年龄/职业/消费力）；2) 分析店铺所在商圈与竞品；3) 确定当季主推力与利润款比例；4) 制定初步预算与品类结构。', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop', true),
(2, '风格匹配', '基于CMB风格诊断结果，筛选符合目标客户风格类型的商品', '详细步骤：1) 回顾客户风格测试结果；2) 从款式库中筛选对应风格标签商品；3) 检查版型、面料与工艺是否符合风格特征；4) 剔除风格冲突单品。', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', true),
(3, '色彩搭配', '根据色彩季型理论，确保选品色彩与客户肤色、季节趋势协调', '详细步骤：1) 确认目标客户的色彩季型；2) 筛选该季型的主色、辅助色与点缀色；3) 检查色彩与当季流行色卡的契合度；4) 避免色彩冲突与过度饱和。', 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&h=600&fit=crop', true),
(4, '价格带筛选', '结合客户预算与市场价格敏感度，确定最优价格组合', '详细步骤：1) 分析客户历史客单价与价格敏感度；2) 设定引流款/利润款/形象款的价格梯度；3) 对比供应商拿货价与市场零售价；4) 计算毛利率与周转率预期。', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop', true);

-- -------- 4. 买手选品 buyer_products (补充示例) --------
INSERT INTO buyer_products (title, description, price, original_price, category, subcategory, color_season, style_type, stock, tags, is_published, sort_order) VALUES
('莫兰迪色羊毛大衣', '90支澳毛，莫兰迪粉/灰/驼三色，适合柔暖型/柔冷型', 69800, 129800, 'clothing', 'coat', 'soft_warm', 'you_ya', 25, '{"秋冬","外套","大衣"}', true, 1),
('复古港风灯芯绒西装', '深暖型专属，焦糖棕/墨绿两色，宽松廓形', 42800, 79800, 'clothing', 'suit', 'deep_warm', 'shi_shang_f', 35, '{"秋冬","西装","复古"}', true, 2),
('极简通勤直筒西裤', '冷柔型/净冷型推荐，垂感面料，黑/灰/藏青', 26800, 49800, 'clothing', 'pants', 'cool_soft', 'shao_nian_f', 60, '{"通勤","裤装","基础款"}', true, 3),
('法式优雅V领针织衫', '暖亮型/浅暖型推荐，羊毛混纺，奶白/燕麦/雾霾蓝', 19800, 36800, 'clothing', 'tops', 'warm_bright', 'lang_man_f', 45, '{"秋冬","针织","内搭"}', true, 4),
('波西米亚印花长裙', '净暖型/深暖型推荐，度假风，红棕/姜黄/墨绿', 35800, 65800, 'clothing', 'dress', 'clear_warm', 'zi_ran_f', 20, '{"春夏","裙装","度假"}', true, 5),
('新中式盘扣衬衫', '古典型/优雅型，真丝混纺，墨绿/香槟/藏青', 32800, 59800, 'clothing', 'tops', 'deep_cool', 'gu_dian_f', 30, '{"新中式","衬衫","国风"}', true, 6),
('轻奢极简托特包', '全季型通用，头层牛皮，黑/焦糖/奶白', 45800, 89800, 'accessory', 'bag', 'clear_cool', 'shi_shang_f', 40, '{"包袋","轻奢","通勤"}', true, 7),
('马卡龙色系羊绒围巾', '浅暖型/浅冷型推荐，山羊绒，粉/蓝/黄/绿四色', 15800, 29800, 'accessory', 'scarf', 'light_warm', 'shao_nv', 80, '{"配饰","围巾","秋冬"}', true, 8);

-- 给已有示例商品补上封面图
UPDATE buyer_products SET cover_image = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop' WHERE title = '桑蚕丝提花连衣裙 A2024';
UPDATE buyer_products SET cover_image = 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop' WHERE title = '高支棉休闲西装套装';
UPDATE buyer_products SET cover_image = 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa33?w=400&h=400&fit=crop' WHERE title = '真丝印花围巾 90x90';
UPDATE buyer_products SET cover_image = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop' WHERE title = '925银简约耳饰套装';
UPDATE buyer_products SET cover_image = 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop' WHERE title = '春季轻薄针织开衫';

-- -------- 5. VIP客户 vip_customers --------
INSERT INTO vip_customers (name, phone, wechat, company, gender, color_season, main_style, sub_style, vip_level, notes, is_active) VALUES
('林雅婷', '13800138001', 'linyating88', '杭州雅致女装', '女', '浅春', '优雅型', '浪漫型', 'V3', '四季青档口客户，主营轻熟女装，月采购额15万+', true),
('王美琪', '13900139002', 'wangmeiqi2024', '苏州米兰衣橱', '女', '深秋', '自然型', '时尚型', 'V2', '社区店模式，客群30-45岁，注重性价比', true),
('陈雪莉', '13700137003', 'chenxueli_design', '上海雪莉工作室', '女', '净冬', '戏剧型', '古典型', 'V3', '高端定制路线，客单价2000+，对品质要求极高', true),
('张晓彤', '13600136004', 'zhangxiaotong', '成都潮流驿站', '女', '浅夏', '少女型', '时尚型', 'V1', '刚开业3个月，需要全案商品企划支持', true),
('刘慧敏', '13500135005', 'liuhuimin_vip', '深圳慧敏买手店', '女', '柔秋', '古典型', '优雅型', 'V2', '南油市场资深买手，风格稳定，复购率高', true),
('赵晓芸', '13300133006', 'zhaoxiaoyun_shop', '武汉芸裳服饰', '女', '暖春', '浪漫型', '自然型', 'V1', '转型期客户，从韩风转向法式优雅', true);

-- -------- 6. 线上课程 courses --------
INSERT INTO courses (title, description, cover_image, price, is_free, category, level, duration_minutes, content, is_published, sort_order) VALUES
('CMB色彩诊断入门', '12季型理论基础+真人案例解析，快速掌握色彩诊断核心方法', 'https://images.unsplash.com/photo-1525909002-1b05e0c869d8?w=600&h=400&fit=crop', 9800, false, 'cmb_color', 'beginner', 120, '课程大纲：1) 色彩基础理论 2) 12季型分类体系 3) 肤色诊断实操 4) 季型与服饰配色 5) 客户案例解析', true, 1),
('服装店搭配技巧实战', '从单品到整套，教你为不同客户快速搭配出高转化造型', 'https://images.unsplash.com/photo-1558618047-f4b511c9d107?w=600&h=400&fit=crop', 12800, false, 'styling', 'intermediate', 180, '课程大纲：1) 风格诊断回顾 2) 单品风格属性分析 3) 搭配比例与层次 4) 场景化搭配方案 5) 客户搭配档案管理', true, 2),
('高效衣橱管理术', '帮助客户建立精简高效的衣橱体系，提升单品利用率', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=400&fit=crop', 6800, false, 'wardrobe', 'beginner', 90, '课程大纲：1) 衣橱诊断方法 2) 基础款与趋势款配比 3) 色彩衣橱构建 4) 断舍离策略 5) 衣橱维护与更新', true, 3),
('B端买手选品方法论', '从市场分析到下单决策，系统化的买手选品全流程', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', 19800, false, 'image', 'advanced', 240, '课程大纲：1) 市场趋势分析 2) 客户画像与需求拆解 3) 供应商评估 4) 价格带与利润率计算 5) 库存周转优化', true, 4);

-- -------- 7. 商品企划订单 planning_orders (示例) --------
INSERT INTO planning_orders (plan_type, color_season, style_type, brand_name, target_age, price_range, notes, amount, status, admin_notes) VALUES
('全案企划', 'light_warm', 'french_elegant', '雅致女装', '25-35岁', '200-500元', '春夏换季，需要完整商品结构方案', 59800, 'pending', '已联系客户，预约周三视频会议'),
('色彩企划', 'cool_soft', 'minimal_commute', '简一服饰', '30-40岁', '300-800元', '主打职场通勤，需要色彩组合建议', 29800, 'processing', '初稿已完成，等待客户反馈'),
('风格企划', 'deep_warm', 'chinese_style', '墨染轩', '35-50岁', '500-1500元', '新中式风格定位，高端路线', 39800, 'completed', '方案已交付，客户满意度高');

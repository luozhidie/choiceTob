-- 7. 商品企划订单 planning_orders
INSERT INTO planning_orders (plan_type, color_season, style_type, brand_name, target_age, price_range, notes, amount, status, admin_notes) VALUES
('全案企划', 'light_warm', 'french_elegant', '雅致女装', '25-35岁', '200-500元', '春夏换季需完整商品结构方案', 59800, 'pending', '已联系客户，预约周三视频会议'),
('色彩企划', 'cool_soft', 'minimal_commute', '简一服饰', '30-40岁', '300-800元', '主打职场通勤需色彩组合建议', 29800, 'processing', '初稿已完成，等待客户反馈'),
('风格企划', 'deep_warm', 'chinese_style', '墨染轩', '35-50岁', '500-1500元', '新中式风格定位高端路线', 39800, 'completed', '方案已交付，客户满意度高');
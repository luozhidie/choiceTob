-- 3. 选品步骤 buyer_steps
INSERT INTO buyer_steps (step_number, title, description, detail_content, image_url, is_published) VALUES
(1, '需求分析', '明确客户群体、店铺定位与季节需求', '步骤：1)收集客户信息 2)分析商圈竞品 3)确定主推比例 4)制定预算结构', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop', true),
(2, '风格匹配', '基于CMB风格诊断筛选对应商品', '步骤：1)回顾测试结果 2)筛选风格标签商品 3)检查版型面料 4)剔除冲突单品', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop', true),
(3, '色彩搭配', '确保选品色彩与客户肤色协调', '步骤：1)确认色彩季型 2)筛选主辅色 3)检查流行色契合 4)避免色彩冲突', 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&h=600&fit=crop', true),
(4, '价格带筛选', '结合预算与市场敏感度确定价格', '步骤：1)分析客单价 2)设定价格梯度 3)对比拿货价 4)计算毛利率', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop', true);
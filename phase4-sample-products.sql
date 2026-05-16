-- ==========================================
-- 示例商品数据（覆盖全部5个主分类）
-- 在 Supabase SQL Editor 中执行
-- ==========================================

-- 先清掉可能的测试数据（如果遇到id冲突可取消注释下面这行）
-- DELETE FROM products WHERE title LIKE '%[示例]%';

INSERT INTO products (title, description, cover_image, price, original_price, category, subcategory, tags, is_published, stock, sort_order)
VALUES

-- ===== 色彩工具 =====
(
  '四季色彩诊断色布套组（标准版）',
  '专业四季色彩诊断工具，含96色色布，覆盖12季型判色需求。采用行业标准色号，精准判定客户色彩季型，是色彩顾问必备诊断工具。',
  'https://placehold.co/600x600/1ab3a4/ffffff?text=色布套组',
  9900,  -- ¥99
  12800, -- ¥128
  'color_tools',
  'color_cloth',
  ARRAY['热销', '专业必备', '四季色彩'],
  true,
  50,
  10
),
(
  '便携式PANTONE色卡（服装纺织版）',
  'Fashion, Home + Interiors 色卡，含2625种服装纺织流行色，附色彩编号对照表，方便选品和供应链沟通。',
  'https://placehold.co/600x600/1ab3a4/ffffff?text=PANTONE色卡',
  19800, -- ¥198
  25800, -- ¥258
  'color_tools',
  'color_card',
  ARRAY['专业推荐', '供应链必备'],
  true,
  30,
  20
),

-- ===== 服装 =====
(
  '真丝提花连衣裙（净暖型推荐款）',
  '100%桑蚕丝材质，净暖型专属推荐色系。印花采用暖调珊瑚粉与金黄渐变，突显净暖型明亮艳丽的特质。S/XS/M/L/XL 共5个尺码。',
  'https://placehold.co/600x600/ec4899/ffffff?text=真丝连衣裙',
  89800, -- ¥898
  129800,-- ¥1298
  'clothing',
  'dress',
  ARRAY['净暖型', '真丝', '连衣裙', '新品'],
  true,
  20,
  30
),
(
  '高支棉休闲西装外套（浅冷型推荐）',
  '120支长绒棉，浅冷型专属雾霾蓝+雾粉配色。版型修身不紧身，适合商务休闲场景。可搭配同系列西裤。',
  'https://placehold.co/600x600/1ab3a4/ffffff?text=休闲西装',
  65800, -- ¥658
  89800, -- ¥898
  'clothing',
  'outerwear',
  ARRAY['浅冷型', '棉质', '外套', '商务'],
  true,
  15,
  40
),

-- ===== 配饰 =====
(
  '真丝小方巾（12季型适配款）',
  '100%桑蚕丝，60×60cm经典方巾。提供12款对应各季型专属配色，可作为服装搭配的点睛之笔。独立礼盒包装。',
  'https://placehold.co/600x600/ec4899/ffffff?text=真丝方巾',
  29800, -- ¥298
  39800, -- ¥398
  'accessory',
  'scarf',
  ARRAY['真丝', '12季型', '礼品', '热销'],
  true,
  100,
  50
),
(
  '极简几何耳饰套装（3件）',
  '包含冷柔型/净冷型/深冷型三款适配耳饰。925银针，低敏防过敏。独立包装，适合作为客户搭配方案赠品。',
  'https://placehold.co/600x600/1ab3a4/ffffff?text=几何耳饰',
  12800, -- ¥128
  NULL,
  'accessory',
  'jewelry',
  ARRAY['925银', '冷色调', '套装'],
  true,
  200,
  60
),

-- ===== 书籍资料 =====
(
  '《四季色彩理论：从入门到精通》（签名版）',
  '骆芷蝶老师亲笔签名版。系统讲解四季色彩理论、12季型判断方法、各季型专属色板与搭配逻辑。附100+真实客户案例分析，是色彩顾问进阶必读。',
  'https://placehold.co/600x600/1ab3a4/ffffff?text=四季色彩理论',
  6800,  -- ¥68
  9800,  -- ¥98
  'book',
  'color_theory',
  ARRAY['签名版', '入门必读', '专业教材'],
  true,
  500,
  70
),

-- ===== 专业工具 =====
(
  '服装店陈列组合展示架（可调节）',
  '适用于服装门店陈列展示，高度可调节（120-200cm），含360°旋转挂钩×12 + 层板×3。哑光白/哑光黑双色可选，提升门店陈列专业度。',
  'https://placehold.co/600x600/ec4899/ffffff?text=陈列展示架',
  59800, -- ¥598
  79800, -- ¥798
  'pro_tool',
  'display_rack',
  ARRAY['门店陈列', '可调节', 'B端专用'],
  true,
  10,
  80
),
(
  'LED服装陈列射灯（3000K/4000K可调）',
  '专业服装陈列用射灯，CRI≥95，真实还原服装色彩。支持3000K/4000K色温切换，适配不同风格定位的服装门店。导轨式安装，含安装说明书。',
  'https://placehold.co/600x600/1ab3a4/ffffff?text=LED射灯',
  19800, -- ¥198
  25800, -- ¥258
  'pro_tool',
  'lighting',
  ARRAY['陈列灯光', '高显色', '导轨式'],
  true,
  50,
  90
);

-- 确认插入结果
SELECT title, category, subcategory, price, is_published
FROM products
WHERE is_published = true
ORDER BY sort_order;

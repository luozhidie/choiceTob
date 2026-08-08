import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';


// 种子数据：面料 F01-F08
const fabrics = [
  { code: 'F01', style_type: '少女型', suitable_fabrics: ['细棉', '软质毛料', '细呢料', '窄灯芯绒', '平绒', '丝绒', '苏格兰呢', '真丝', '纱'], avoid_fabrics: ['硬皮装', '粗毛线', '粗毛线衣等带有粗糙感的面料'], description: '少女型适合轻柔细腻的面料，回避粗糙硬挺的材质' },
  { code: 'F02', style_type: '优雅型', suitable_fabrics: ['纱', '真丝', '丝绒', '羊绒', '细呢', '细毛料', '兔毛', '裘皮'], avoid_fabrics: ['卡其布', '粗麻', '粗灯芯绒等粗糙厚重的面料'], description: '优雅型追求细腻精致，适合有垂感的高级面料' },
  { code: 'F03', style_type: '浪漫型', suitable_fabrics: ['有光泽的丝缎', '羊绒', '细呢', '兔毛等有华丽感的、高级的面料'], avoid_fabrics: ['土布', '粗麻织物'], description: '浪漫型适合一切有华丽感、高级感的面料' },
  { code: 'F04', style_type: '少年型', suitable_fabrics: ['棉类', '灯芯绒', '薄毛料', '中粗呢料', '咔叽布（斜纹棉布）', '毛绒布', '编织细毛衣', '各种皮装'], avoid_fabrics: ['过于女性化、柔软的面料'], description: '少年型适合干净利落的棉质和轻薄毛料，回避过于女性化、柔软的面料' },
  { code: 'F05', style_type: '时尚型', suitable_fabrics: ['细、薄薄的织物', '皮装'], avoid_fabrics: ['粗糙质地', '自然质地'], description: '时尚型适合精细、有现代感的面料' },
  { code: 'F06', style_type: '古典型', suitable_fabrics: ['丝', '缎', '天鹅绒', '羊绒', '精细羊毛', '纯毛', '细毛料', '精纺呢', '裘皮'], avoid_fabrics: ['土布', '粗麻等粗糙的东西'], description: '古典型追求精致高级，面料必须细腻' },
  { code: 'F07', style_type: '自然型', suitable_fabrics: ['无光泽感的丝绸', '缎类', '棉', '麻', '粗毛线', '混纺', '晴纶', '尼龙', '布围巾', '软棉绒布', '灯芯绒', '粗呢', '粗毛料', '人字呢', '翻毛的', '磨砂皮', '鹿皮', '鸵鸟皮', '猪皮'], avoid_fabrics: ['过于精致、拘束、有光泽的面料'], description: '自然型适合天然质朴的面料，有手工感最佳，回避过于精致、拘束、有光泽的面料' },
  { code: 'F08', style_type: '戏剧型', suitable_fabrics: ['丝类', '缎类', '纱类', '平绒', '羊绒', '棉制品', '哔叽', '毛料', '呢料', '羊皮', '裘皮', '鳄鱼皮', '麻', '厚呢', '粗棉', '灯芯绒', '金/银丝织物', '亮片织物', '闪亮的、有金属感觉的', '高科技感觉的', '粗皮类', '磨砂皮', '粗毛线'], avoid_fabrics: ['小孩子气', '小气', '中庸的面料'], description: '戏剧型适合一切夸张、有存在感的面料，回避小孩子气、小气、中庸的面料' },
];

// 种子数据：图案 P01-P08
const patterns = [
  { code: 'P01', style_type: '少女型', suitable_patterns: ['小圆点', '可爱的小花朵', '细条纹', '细格', '中格', '小碎花', '小动物', '卡通图案'], avoid_patterns: ['成熟感', '大人化', '浓重', '粗糙的图案'], description: '少女型图案：可爱、小巧、柔美，回避成熟感、大人化、浓重、粗糙的图案' },
  { code: 'P02', style_type: '优雅型', suitable_patterns: ['水彩画式温柔、朦胧的图案', '中等大小的花朵', '稍大的水点', '排列不均匀的', '有凹凸感的', '曲线型的'], avoid_patterns: ['粗糙', '生硬', '粗犷豪放的图案'], description: '优雅型图案：柔和、朦胧、曲线，回避粗糙、生硬、粗犷豪放的图案' },
  { code: 'P03', style_type: '浪漫型', suitable_patterns: ['华美的装饰图案', '大花', '花边装饰', '曲线感强的'], avoid_patterns: ['男性化', '小孩子气', '硬朗的图案'], description: '浪漫型图案：华丽、大气、女性化，回避男性化、小孩子气、硬朗的图案' },
  { code: 'P04', style_type: '少年型', suitable_patterns: ['清晰明朗的竖条', '细格', '有个性的图案', '当季流行的', '抽象的图案'], avoid_patterns: ['花朵图案', '女性化', '成熟', '端庄', '柔软的图案'], description: '少年型图案：清晰明朗、个性、抽象，回避花朵、女性化、成熟、柔软的图案' },
  { code: 'P05', style_type: '时尚型', suitable_patterns: ['紧跟时尚当年流行的图案', '有个性', '造型独特', '异想天开的', '图案切割清晰'], avoid_patterns: ['过时的', '土气的', '过于端庄保守的图案'], description: '时尚型图案：个性、前卫、多变，回避过时、土气、端庄保守的图案' },
  { code: 'P06', style_type: '古典型', suitable_patterns: ['小而细腻的几何图案', '小条纹', '小格子', '大牙格', '千鸟纹', '人字呢纹'], avoid_patterns: ['怪异的', '粗糙的', '厚重的', '过于女性化', '孩子气的图案'], description: '古典型图案：低调、精致、经典，回避怪异、粗糙、厚重、过于女性化/孩子气的图案' },
  { code: 'P07', style_type: '自然型', suitable_patterns: ['大格子', '条纹', '大宽条', '豹纹', '野兽皮纹', '民族风情的', '腊染', '扎染', '大印花', '铜钱花纹', '来自大自然的图纹（如叶子、山脉肌理等）'], avoid_patterns: ['拘束的', '古板的', '前卫的', '豪华的图案'], description: '自然型图案：自然、质朴、民族感，回避拘束、古板、前卫、豪华的图案' },
  { code: 'P08', style_type: '戏剧型', suitable_patterns: ['大胆', '分明', '对比强烈', '几何图案', '块面分割的', '等距的', '宽条纹的', '大格子的', '大绣花图案'], avoid_patterns: ['小孩子气的', '可爱的', '小气的', '中庸的', '小家子气的图案'], description: '戏剧型图案：夸张、强对比、存在感，回避小孩子气、小气、中庸的图案' },
];

// 种子数据：剪裁 B01-B08 + C01-C13 + CA1-CA8 + EA1-EA8
const cuts = [
  { code: 'B01', category: '日常剪裁', style_type: '少女型', suitable_cuts: ['曲线版型', '曲线款型', '长度到小腿的连衣裙', '喇叭裙', '百褶裙（褶不能太大）', '大圆领', '荷叶边', '飘带', '窄边装饰（要曲线的）', '精致小花边', '蕾丝边', '裙装比裤装更合适'], description: '少女型日常：曲线版型，追求轻柔感，裙装比裤装更合适' },
  { code: 'B02', category: '日常剪裁', style_type: '优雅型', suitable_cuts: ['曲线剪裁', '收腰', '领襟边缘呈曲线型', '回避直角', '皱褶装饰', '膨松袖子', '垂吊感连衣长裙', '飘逸长裙', '身材丰满可穿包身收口裙'], avoid_cuts: ['宽平垫肩'], description: '优雅型日常：曲线剪裁，收腰，飘逸，回避宽平垫肩' },
  { code: 'B03', category: '日常剪裁', style_type: '浪漫型', suitable_cuts: ['曲线版型', 'X型剪裁', '包身裙', '收腰多皱连衣裙', '鱼尾裙', '喇叭裙', '大领子', '大领口', '垂吊大领', '肩部可膨松', '灯笼袖', '荷叶边衬衣', '裤子不带裤线'], avoid_cuts: ['直筒裙', 'A字裙'], description: '浪漫型日常：X型剪裁，曲线，华丽，回避直筒裙、A字裙' },
  { code: 'B04', category: '日常剪裁', style_type: '少年型', suitable_cuts: ['直版型', '直线剪裁', '短上衣', '夹克衫', '小皮装', '短裤', '短裙', '裤装比裙装更漂亮', '拉链', '明兜', '立领', '多扣', '明线做工'], description: '少年型日常：直版型，直线剪裁，利落中性，裤装比裙装更漂亮' },
  { code: 'B05', category: '日常剪裁', style_type: '时尚型', suitable_cuts: ['直线打扮比曲线好', '剪裁锋利有棱角', '符合当年流行趋势', '裤装（直筒裤、喇叭裤等，不适合西裤）', '可带钉饰、流苏、磨破等装饰', '短夹克衫', '强调民族感的', '复杂', '有变化', '不规则', '不对称'], avoid_cuts: ['西裤'], description: '时尚型日常：锋利棱角，前卫个性，紧跟流行，不适合西裤' },
  { code: 'B06', category: '日常剪裁', style_type: '古典型', suitable_cuts: ['合体的直线剪裁', '腰必须收但不能过分紧', '都市化', '华贵', '精致', '高级的感觉'], avoid_cuts: ['太夸张'], description: '古典型日常：合体直线剪裁，严谨高级，不能太夸张' },
  { code: 'B07', category: '日常剪裁', style_type: '自然型', suitable_cuts: ['直线剪裁', '几何型造型', '细节越简单越好', '衣服可比身材大一号', '领口不要严谨', '大西装领', '大V字领', '两粒扣', '方的/尖的翻领', '拉链衫', '腰不能收得过于曲线', '直筒裤', '宽腿裤', 'A字长裙', '直筒/乡村吊带长裙', '喇叭长裙', '中长裙'], description: '自然型日常：直线剪裁，几何造型，随意舒适，腰不能过于曲线' },
  { code: 'B08', category: '日常剪裁', style_type: '戏剧型', suitable_cuts: ['直线版型', '细节处直线、曲线剪裁都适合', '线条笔直、锋利的外套', '紧身衣', '皱褶很多的连衣裙', '大枪驳头西装', '大V字领', '特大领', '一粒扣的服装', '可穿比型号大一号、大两号的', '束腰', '泡泡袖', '荷叶袖', '大方领', '大蝴蝶结', '带垫肩', '高裙衩', '宽腰带', '宽腿裤', '大喇叭裤', '紧腿裤'], description: '戏剧型日常：直线版型，夸张华丽，可穿比型号大一号甚至两号的' },
  { code: 'C01', category: '职业装剪裁', style_type: '少女型', suitable_cuts: ['曲线款型的小套装', '圆领', '圆襟', '兜袋边缘线为曲线型', '袖/领口有蝴蝶结装饰', '喇叭裙', '百褶裙', '可穿毛衣、开衫上班'], description: '少女型职业：曲线款型小套装，圆领圆襟，蝴蝶结装饰' },
  { code: 'C02', category: '职业装剪裁', style_type: '优雅型', suitable_cuts: ['合身的西式套裙', '领襟兜处边缘线为曲线', '西服驳头呈圆形', '小圆领', '无领套装', '短裙包身收口或鱼尾短裙', '上下面料质地可不同（上硬下软）', '可穿连衣裙加外套上班', '方领/尖领套装要配丝巾破其尖锐感'], description: '优雅型职业：合身西式套裙，曲线边缘，方领/尖领配丝巾' },
  { code: 'C03', category: '职业装剪裁', style_type: '浪漫型', suitable_cuts: ['强调曲线感', '面料华丽', '领襟兜处边缘线为曲线形', '西服驳头呈圆形', '圆领', '无领套装', '领口最好有荷叶边等装饰', '短裙包身收口', '方/尖领套装要配丝巾', '丝绸衬衣', '连衣裙都可'], avoid_cuts: ['毛衣不适合'], description: '浪漫型职业：强调曲线感，面料华丽，毛衣不适合' },
  { code: 'C04', category: '职业装剪裁', style_type: '少年型', suitable_cuts: ['多扣', '小立领', '小开领', '短小精干的西式套装', '可以是裤套装'], description: '少年型职业：短小精干的西式套装，多扣小立领，裤套装' },
  { code: 'C05', category: '职业装剪裁', style_type: '时尚型', suitable_cuts: ['短小精干的套装', '领子衣襟兜袋等处一定要有变化', '小小的西装领', '翻领', '配A字裙'], description: '时尚型职业：短小精干但有变化的设计，配A字裙' },
  { code: 'C06', category: '职业装剪裁', style_type: '古典型', suitable_cuts: ['合体的套装', '小西装领', '无领（领口不要太圆，一字形或略方）', '配围巾或项链等装饰', '双排扣上衣（不能太长）', '直身收腰连衣裙加外衣', '西装裙', '一步短裙/长裙', '方领/尖领衬衫', '小V领', '挺括有裤线的西裤', '直筒裤', '窄边装饰（夏奈尔风格）'], avoid_cuts: ['青果领', '荷叶边'], description: '古典型职业：合体套装，精致高级，回避青果领、荷叶边' },
  { code: 'C07', category: '职业装剪裁', style_type: '自然型', suitable_cuts: ['两粒扣直线领或V字领的西装', '配西装短裙', '尺寸可稍宽松', '西装宜敞开扣子穿', '西式套装配衬衣', '领口结丝巾很漂亮', '裤套装也合适', '宽腿的麻料/细呢料长裤把衬衣束在裤腰里'], description: '自然型职业：直线领/V字领西装，尺寸可宽松，敞开扣子穿' },
  { code: 'C08', category: '职业装剪裁', style_type: '戏剧型', suitable_cuts: ['大西装领', '双排扣', '大V字领', '一粒扣', '无扣的上装', '裙套装', '直线剪裁衬衣', '男式衬衣', '男式T恤', '背带西裤套装', '男装裤套装'], description: '戏剧型职业：大西装领、双排扣，夸张大气，男式元素' },
  { code: 'C09', category: '职业装剪裁', style_type: '男士时尚型', suitable_cuts: ['待补充'], description: '男士时尚型职业装（文档中仅占位，未提供具体描述）' },
  { code: 'C10', category: '职业装剪裁', style_type: '男士浪漫型', suitable_cuts: ['待补充'], description: '男士浪漫型职业装（文档中仅占位，未提供具体描述）' },
  { code: 'C11', category: '职业装剪裁', style_type: '男士古典型', suitable_cuts: ['待补充'], description: '男士古典型职业装（文档中仅占位，未提供具体描述）' },
  { code: 'C12', category: '职业装剪裁', style_type: '男士自然型', suitable_cuts: ['待补充'], description: '男士自然型职业装（文档中仅占位，未提供具体描述）' },
  { code: 'C13', category: '职业装剪裁', style_type: '男士戏剧型', suitable_cuts: ['待补充'], description: '男士戏剧型职业装（文档中仅占位，未提供具体描述）' },
  { code: 'CA1', category: '休闲装剪裁', style_type: '少女型', suitable_cuts: ['小花布衣裙', '圆领衬衣', '碎花裙', '有蕾丝装饰的轻柔小毛衫', '绣花小连衣裙', '中老年人可穿丝质小碎花裙'], description: '少女型休闲：小花布衣裙，蕾丝装饰，轻柔可爱' },
  { code: 'CA2', category: '休闲装剪裁', style_type: '优雅型', suitable_cuts: ['有垂感的裤子（无线裤）', '两件套针织衫配长裙', '重磅真丝料很合适', '多用真丝类', '薄纱面料'], description: '优雅型休闲：有垂感的裤子，针织衫配长裙，真丝薄纱' },
  { code: 'CA3', category: '休闲装剪裁', style_type: '浪漫型', suitable_cuts: ['毛衣配长裙会非常漂亮', '大花朵的九分裤', '大领口针织衫'], description: '浪漫型休闲：毛衣配长裙，大花朵九分裤，大领口针织衫' },
  { code: 'CA4', category: '休闲装剪裁', style_type: '少年型', suitable_cuts: ['拉链衫', '牛仔裤', '运动装', '多袢', '多装饰', '尤其是金属装饰', '可用男式当睡衣穿'], description: '少年型休闲：拉链衫、牛仔裤、运动装，金属装饰' },
  { code: 'CA5', category: '休闲装剪裁', style_type: '时尚型', suitable_cuts: ['当年流行休闲款式'], description: '时尚型休闲：当前流行什么就穿什么，紧跟时尚风潮' },
  { code: 'CA6', category: '休闲装剪裁', style_type: '古典型', suitable_cuts: ['简洁连衣裙', '有扣翻领T恤', '小方领/小尖领男式衬衫', '有领T恤', '有垂感西裤', '多借鉴当季流行元素'], avoid_cuts: ['拉链运动衫等太过随意的衣服'], description: '古典型休闲：简洁连衣裙，有领T恤，不适合太随意' },
  { code: 'CA7', category: '休闲装剪裁', style_type: '自然型', suitable_cuts: ['长裙', '短裙都可', '喇叭裙', '七分裤', '牛仔裤', '短裤', '紧腿裤', '套头衫', '圆领衫', 'T恤衫', '运动衫', '男式衬衫', '棒针编织衫', '具有民族风情的', '带大明兜的服装'], avoid_cuts: ['总体不能太夸张、华丽'], description: '自然型休闲：随意自然，民族风情，不能太夸张华丽' },
  { code: 'CA8', category: '休闲装剪裁', style_type: '戏剧型', suitable_cuts: ['小超短裙', '长裙', '大喇叭裙', '紧腿裤', '棉质衬衫', '丝质衬衫', '可很厚或很薄', '棒针编织衫', '可以打扮得很出众', '质地或款式至少有一个是夸张的'], description: '戏剧型休闲：出众打扮，质地或款式至少一个夸张' },
  { code: 'EA1', category: '晚装剪裁', style_type: '优雅型', suitable_cuts: ['纱', '丝质长裙', '蕾丝', '荷叶边装饰', '柔软的披肩', '配饰花', '细高跟鞋'], description: '优雅型晚装：纱、丝质长裙，蕾丝荷叶边，柔软披肩' },
  { code: 'EA2', category: '晚装剪裁', style_type: '浪漫型', suitable_cuts: ['裙摆上可以有很多装饰的长裙', '拖地长裙', '鱼尾长裙', '可多暴露皮肤', '低胸露背'], description: '浪漫型晚装：拖地长裙、鱼尾长裙，低胸露背，华丽装饰' },
  { code: 'EA3', category: '晚装剪裁', style_type: '少年型', suitable_cuts: ['简洁利落的吊带裙', '非正式晚装可穿小马裤', '衬衣配长领带'], avoid_cuts: ['暴露过多的刻意的性感'], description: '少年型晚装：简洁利落吊带裙，回避刻意性感' },
  { code: 'EA4', category: '晚装剪裁', style_type: '时尚型', suitable_cuts: ['较紧身的衣裙', '吊带长裙就很好', '要有闪光点', '亮片等装饰', '带有高科技感的'], description: '时尚型晚装：紧身衣裙，闪光点装饰，高科技感' },
  { code: 'EA5', category: '晚装剪裁', style_type: '古典型', suitable_cuts: ['面料不能太软', '高档', '精致', '简洁', '可用披肩', '外套'], avoid_cuts: ['过于性感暴露'], description: '古典型晚装：高档精致简洁，面料不能太软，不适合过于暴露' },
  { code: 'EA6', category: '晚装剪裁', style_type: '自然型', suitable_cuts: ['线条简洁的吊带长裙', '身材偏丰满可加长条披肩'], description: '自然型晚装：线条简洁的吊带长裙，偏丰满可加披肩' },
  { code: 'EA7', category: '晚装剪裁', style_type: '戏剧型', suitable_cuts: ['华丽的晚礼服', '袒胸露臂的长裙', '紧身鱼尾裙', '蓬松的多层次长裙', '大量首饰', '式样夸张的饰品', '大珠子项链', '大耳环'], description: '戏剧型晚装：华丽晚礼服，夸张饰品，大量首饰' },
  { code: 'EA8', category: '晚装剪裁', style_type: '少女型', suitable_cuts: ['待补充'], description: '少女型晚装（文档中未描述）' },
];

// 种子数据：色彩季型 S01-S12
const colorSeasons = [
  { code: 'S01', season_name_cn: '浅暖型', season_name_en: 'Light Warm', brightness: '高', saturation: '高', temperature: '暖', category_group: '浅色型', matrix_position: '浅（明度高）+ 亮（艳度高）', color_principle: '遵循"浅、亮、暖"的原则', test_colors: '桃色 + 浅苔绿', suitable_accessories: 'K金为主，透明晶莹宝石', ideal_colors: ['奶油色', '桃色', '浅苔绿', '珊瑚粉', '亮鲑肉色', '天青蓝', '正黄'], classic_hex_colors: ['#FFF8DC', '#FFB6C1', '#98FB98', '#FF7F7F', '#FA8072', '#87CEEB', '#FFD700'], description: '浅暖型：明度高、艳度高、暖调，适合明亮温暖的浅色调' },
  { code: 'S02', season_name_cn: '浅冷型', season_name_en: 'Light Cool', brightness: '高', saturation: '低', temperature: '冷', category_group: '浅色型', matrix_position: '浅（明度高）+ 柔（艳度低）', color_principle: '遵循"浅、柔、冷"的原则', test_colors: '雾粉 + 海绿', suitable_accessories: '磨砂哑光白金，浅色K金，淡雅宝石', ideal_colors: ['铃兰色', '雾粉', '海绿', '水晶紫', '玫瑰红', '冰紫', '薰衣草紫'], classic_hex_colors: ['#E8E0F0', '#FFB6C1', '#66CDAA', '#DDA0DD', '#FF1493', '#E6E6FA', '#9B59B6'], description: '浅冷型：明度高、艳度低、冷调，适合明亮清冷的柔和色调' },
  { code: 'S03', season_name_cn: '深暖型', season_name_en: 'Deep Warm', brightness: '低', saturation: '低', temperature: '暖', category_group: '深色型', matrix_position: '深（明度低）+ 柔（艳度低）', color_principle: '遵循"深、柔、暖"的原则', test_colors: '鲑肉色 + 橄榄绿', suitable_accessories: '浓重的黄金类饰品', ideal_colors: ['驼色', '咖啡棕', '橄榄绿', '南瓜色', '铁绣红', '金棕', '鲑肉色'], classic_hex_colors: ['#8B7355', '#6B4226', '#556B2F', '#FF7518', '#B7410E', '#B8860B', '#FA8072'], description: '深暖型：明度低、艳度低、暖调，适合深沉温暖的柔和色调' },
  { code: 'S04', season_name_cn: '深冷型', season_name_en: 'Deep Cool', brightness: '低', saturation: '高', temperature: '冷', category_group: '深色型', matrix_position: '深（明度低）+ 亮（艳度高）', color_principle: '遵循"深、亮、冷"的原则', test_colors: '倒挂金钟紫 + 深凫色', suitable_accessories: '白金类饰品，色泽浓郁的宝石', ideal_colors: ['深凫色', '梅紫', '倒挂金钟紫', '正绿', '青椒绿', '樱桃色', '粉蓝'], classic_hex_colors: ['#003153', '#9370DB', '#C154C1', '#008000', '#4CAF50', '#DE3163', '#ADD8E6'], description: '深冷型：明度低、艳度高、冷调，适合深沉冷艳的鲜亮色调' },
  { code: 'S05', season_name_cn: '暖亮型', season_name_en: 'Warm Bright', brightness: '高', saturation: '高', temperature: '暖', category_group: '暖色型', matrix_position: '浅（明度高）+ 亮（艳度高）', color_principle: '遵循"暖、浅、亮"的原则', test_colors: '浅桃色 + 浅苔绿', suitable_accessories: '黄金类，琥珀黄玉，松石，浅色珍珠', ideal_colors: ['浅桃色', '浅苔绿', '珊瑚色', '亮鲑肉色', '天青蓝', '琥珀色', '鲜黄'], classic_hex_colors: ['#FFDAB9', '#98FB98', '#FF7F50', '#FA8072', '#87CEEB', '#FFBF00', '#FFD700'], description: '暖亮型：明度高、艳度高、暖调，适合温暖鲜亮的色调' },
  { code: 'S06', season_name_cn: '暖柔型', season_name_en: 'Warm Soft', brightness: '低', saturation: '低', temperature: '暖', category_group: '暖色型', matrix_position: '深（明度低）+ 柔（艳度低）', color_principle: '遵循"暖、柔、深"的原则', test_colors: '南瓜色 + 橄榄绿', suitable_accessories: '黄金、琥珀、玛瑙、黄玉、绿松石', ideal_colors: ['南瓜色', '橄榄绿', '苔绿', '铁绣红', '金棕', '鲑肉粉', '咖啡棕'], classic_hex_colors: ['#FF7518', '#556B2F', '#6B8E23', '#B7410E', '#B8860B', '#FFA07A', '#6B4226'], description: '暖柔型：明度低、艳度低、暖调，适合温暖柔和的深色调' },
  { code: 'S07', season_name_cn: '冷亮型', season_name_en: 'Cool Bright', brightness: '低', saturation: '高', temperature: '冷', category_group: '冷色型', matrix_position: '深（明度低）+ 亮（艳度高）', color_principle: '遵循"冷、深、亮"的原则', test_colors: '倒挂金钟紫 + 梅紫', suitable_accessories: '有光泽感的白金，回避黄金', ideal_colors: ['木莓红', '梅紫', '倒挂金钟紫', '正绿', '青椒绿', '长春花蓝', '樱桃色'], classic_hex_colors: ['#E30B5C', '#9370DB', '#C154C1', '#008000', '#4CAF50', '#CCCCFF', '#DE3163'], description: '冷亮型：明度低、艳度高、冷调，适合冷艳鲜亮的深色调' },
  { code: 'S08', season_name_cn: '冷柔型', season_name_en: 'Cool Soft', brightness: '高', saturation: '低', temperature: '冷', category_group: '冷色型', matrix_position: '浅（明度高）+ 柔（艳度低）', color_principle: '遵循"冷、浅、柔"的原则', test_colors: '薰衣草紫 + 水晶紫', suitable_accessories: '哑光磨砂白金，柔和宝石', ideal_colors: ['薰衣草紫', '水晶紫', '雾粉', '铃兰色', '海绿', '玫瑰红', '兰花紫'], classic_hex_colors: ['#9B59B6', '#DDA0DD', '#FFB6C1', '#E8E0F0', '#66CDAA', '#FF1493', '#DA70D6'], description: '冷柔型：明度高、艳度低、冷调，适合冷峻柔和的浅色调' },
  { code: 'S09', season_name_cn: '净暖型', season_name_en: 'Clear Warm', brightness: '高', saturation: '高', temperature: '暖', category_group: '净色型', matrix_position: '浅（明度高）+ 亮（艳度高）', color_principle: '遵循"亮、浅、暖"的原则', test_colors: '亮鲑肉色 + 鲜黄', suitable_accessories: '抛光黄金，光泽好的宝石', ideal_colors: ['亮鲑肉色', '鲜黄', '珊瑚粉', '西瓜红', '天青蓝', '柠檬黄', '亮粉'], classic_hex_colors: ['#FA8072', '#FFD700', '#FF7F7F', '#FC6C85', '#87CEEB', '#FFF44F', '#FF69B4'], description: '净暖型：明度高、艳度高、暖调，适合纯净温暖的鲜亮色调' },
  { code: 'S10', season_name_cn: '净冷型', season_name_en: 'Clear Cool', brightness: '低', saturation: '高', temperature: '冷', category_group: '净色型', matrix_position: '深（明度低）+ 亮（艳度高）', color_principle: '遵循"亮、深、冷"的原则', test_colors: '樱桃色 + 深凫色', suitable_accessories: '黄金或铂金珠宝', ideal_colors: ['樱桃色', '深凫色', '鲜红', '正绿', '倒挂金钟紫', '粉蓝', '纯白'], classic_hex_colors: ['#DE3163', '#003153', '#FF0000', '#008000', '#C154C1', '#ADD8E6', '#FFFFFF'], description: '净冷型：明度低、艳度高、冷调，适合纯净冷艳的深色调' },
  { code: 'S11', season_name_cn: '柔暖型', season_name_en: 'Soft Warm', brightness: '低', saturation: '低', temperature: '暖', category_group: '柔色型', matrix_position: '深（明度低）+ 柔（艳度低）', color_principle: '遵循"柔、深、暖"的原则', test_colors: '桃色 + 橄榄绿', suitable_accessories: '磨砂哑光黄金，琥珀，玛瑙，暖珍珠', ideal_colors: ['桃色', '橄榄绿', '苔绿', '铁绣红', '鲑肉粉', '金棕', '可可色', '贝壳粉'], classic_hex_colors: ['#FFB6C1', '#556B2F', '#6B8E23', '#B7410E', '#FFA07A', '#B8860B', '#6B4226', '#F4A460'], description: '柔暖型：明度低、艳度低、暖调，适合灰暖柔和的深色调' },
  { code: 'S12', season_name_cn: '柔冷型', season_name_en: 'Soft Cool', brightness: '高', saturation: '低', temperature: '冷', category_group: '柔色型', matrix_position: '浅（明度高）+ 柔（艳度低）', color_principle: '遵循"冷、浅、柔"的原则', test_colors: '兰花紫 + 海绿', suitable_accessories: '哑光磨砂白金，柔和宝石', ideal_colors: ['兰花紫', '海绿', '水晶紫', '雾粉', '可可色', '玫瑰棕', '铃兰色', '冰灰'], classic_hex_colors: ['#DA70D6', '#66CDAA', '#DDA0DD', '#FFB6C1', '#6B4226', '#BC8F8F', '#E8E0F0', '#C0C0C0'], description: '柔冷型：明度高、艳度低、冷调，适合灰冷柔和的浅色调' },
];

// 种子数据：搭配规则 R01-R07
const matchRules = [
  { code: 'R01', rule_name_cn: '色调配色', rule_name_en: 'Tone Match', description: '色彩总倾向相同（明度/艳度/调子中一项相同）的配色，色相越多越好，至少3种', applicable_seasons: ['S01','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11','S12'], applicable_styles: null, rule_logic: {type:'tone_match',fields:['brightness','saturation','temperature']} },
  { code: 'R02', rule_name_cn: '近似配色', rule_name_en: 'Analogous Match', description: '相邻或相近色相搭配，含有共同原色，协调稳定', applicable_seasons: ['S01','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11','S12'], applicable_styles: null, rule_logic: {type:'analogous',min_hue_diff:30,max_hue_diff:90} },
  { code: 'R03', rule_name_cn: '渐进配色', rule_name_en: 'Gradient Match', description: '按色相/明度/艳度三要素之一的程度高低依次排列，色调沉稳醒目', applicable_seasons: ['S01','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11','S12'], applicable_styles: null, rule_logic: {type:'gradient',sort_field:'brightness'} },
  { code: 'R04', rule_name_cn: '对比配色', rule_name_en: 'Contrast Match', description: '用色相/明度/艳度的反差进行搭配，鲜明强对比。只要有明度对比就不会太差', applicable_seasons: ['S01','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11','S12'], applicable_styles: null, rule_logic: {type:'contrast',fields:['hue','brightness','saturation']} },
  { code: 'R05', rule_name_cn: '单重点配色', rule_name_en: 'Spot Match', description: '两种颜色形成面积大反差，"万绿丛中一点红"', applicable_seasons: ['S01','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11','S12'], applicable_styles: null, rule_logic: {type:'spot',area_ratio:0.1} },
  { code: 'R06', rule_name_cn: '分离式配色', rule_name_en: 'Separation Match', description: '两种颜色接近不分明时，靠对比色（无色系/米色等中性色）加在中间增加强度', applicable_seasons: ['S01','S02','S03','S04','S05','S06','S07','S08','S09','S10','S11','S12'], applicable_styles: null, rule_logic: {type:'separation',separator_colors:['#FFFFFF','#000000','#F5F5DC']} },
  { code: 'R07', rule_name_cn: '夜配色', rule_name_en: 'Night Match', description: '高明度/鲜亮冷色与低明度暖色配在一起，神秘、异国情调', applicable_seasons: ['S03','S04','S07','S09'], applicable_styles: null, rule_logic: {type:'night',cool_bright:'high',warm_dark:'low'} },
];

/* ── 表配置 ── */
const TABLE_CONFIGS: Record<string, { items: any[]; pk: string }> = {
  attribute_fabrics: { items: fabrics, pk: 'code' },
  attribute_patterns: { items: patterns, pk: 'code' },
  attribute_cuts: { items: cuts, pk: 'code' },
  attribute_color_seasons: { items: colorSeasons, pk: 'code' },
  attribute_match_rules: { items: matchRules, pk: 'code' },
};

/* ── 尝试插入单条数据，自动过滤不存在的列 ── */
async function tryInsert(
  supabase: any,
  tableName: string,
  item: any,
  pk: string,
  excludedColumns: Set<string>
): Promise<{ success: boolean; newExcluded?: string; error?: string }> {
  // 过滤掉已知不存在的列
  const filtered: any = {};
  for (const [key, val] of Object.entries(item)) {
    if (!excludedColumns.has(key)) {
      filtered[key] = val;
    }
  }

  const { error } = await supabase.from(tableName).upsert(filtered, { onConflict: pk });

  if (!error) {
    return { success: true };
  }

  // 分析错误：是否是列不存在？
  const msg = error.message || '';
  const match = msg.match(/Could not find the '([^']+)' column/);
  if (match) {
    const missingCol = match[1];
    // 递归重试，排除这个列
    excludedColumns.add(missingCol);
    return tryInsert(supabase, tableName, item, pk, excludedColumns);
  }

  // RLS 错误
  if (msg.includes('row-level security')) {
    return { success: false, error: 'RLS 阻止写入，请关闭表的 Row Level Security' };
  }

  // 其他错误
  return { success: false, error: msg };
}

export async function POST(request: NextRequest) {
  try {
    // 检查用户是否是管理员
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: '未配置 Supabase 环境变量' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    
    // 检查用户是否是管理员
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 检查用户角色 - 从 profiles 表查询
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const results: Record<string, { inserted: number; excludedColumns?: string[]; error?: string }> = {};

    for (const [tableName, config] of Object.entries(TABLE_CONFIGS)) {
      let inserted = 0;
      let lastError = '';
      const excludedColumns = new Set<string>();

      for (const item of config.items) {
        const res = await tryInsert(supabase, tableName, item, config.pk, excludedColumns);
        if (res.success) {
          inserted++;
        } else {
          lastError = res.error || '未知错误';
        }
      }

      const excludedArr = Array.from(excludedColumns);
      if (inserted === config.items.length) {
        results[tableName] = {
          inserted,
          excludedColumns: excludedArr.length > 0 ? excludedArr : undefined,
        };
      } else {
        results[tableName] = { inserted, error: lastError };
      }
    }

    const hasError = Object.values(results).some(r => r.error);
    if (hasError) {
      return NextResponse.json({ error: '部分数据插入失败', details: results }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '属性编码种子数据导入完成',
      counts: {
        fabrics: fabrics.length,
        patterns: patterns.length,
        cuts: cuts.length,
        color_seasons: colorSeasons.length,
        match_rules: matchRules.length,
      },
      details: results,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message || '导入失败' }, { status: 500 });
  }
}

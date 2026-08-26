var app = getApp();
var BASE = 'https://colour-choice.art';

// 8 种风格固定顺序（与原版 action2.js data 数组顺序一致，分数并列时取靠前者）
var ORDER = ['少女型', '优雅型', '浪漫型', '少年型', '时尚型', '古典型', '自然型', '戏剧型'];

// 题目与打分规则完全复刻原版 nv.html + action2.js：
// 每个选项 value 是一串以「、」分隔的风格名，选中则该风格 weight +1，最后取最高分。
var QUESTIONS = [
  {
    id: 'q1',
    text: '你的视觉身高看起来比实际身高（都是在不穿鞋的状态下）：',
    options: [
      { v: 'A', l: '显高', styles: ['戏剧型'] },
      { v: 'B', l: '显矮', styles: ['自然型'] },
      { v: 'C', l: '不显高也不显矮', styles: ['少女型', '优雅型', '浪漫型', '少年型', '时尚型', '古典型'] },
    ],
  },
  {
    id: 'q2',
    text: '你是否有擅长的运动项目？（舞蹈、瑜伽等各种肢体运动都算。注意是擅长，小范围内比赛会得奖的！）',
    options: [
      { v: 'A', l: '有', styles: ['自然型'] },
      { v: 'B', l: '没有', styles: ['少女型', '优雅型', '浪漫型', '少年型', '时尚型', '古典型', '戏剧型'] },
    ],
  },
  {
    id: 'q3',
    text: '你穿正装好看还是运动休闲装好看？',
    options: [
      { v: 'A', l: '正装', styles: ['古典型'] },
      { v: 'B', l: '运动休闲装', styles: ['自然型'] },
      { v: 'C', l: '都差不多，没有什么区别', styles: ['少女型', '优雅型', '浪漫型', '少年型', '时尚型', '戏剧型'] },
    ],
  },
  {
    id: 'q4',
    text: '你的身形是？',
    options: [
      { v: 'A', l: '平肩扁腰', styles: ['少年型', '时尚型', '古典型', '自然型', '戏剧型'] },
      { v: 'B', l: '溜肩圆腰', styles: ['少女型', '优雅型', '浪漫型'] },
      { v: 'C', l: '好像区别不大', styles: ['戏剧型'] },
    ],
  },
  {
    id: 'q5',
    text: '你是否有这种现象：穿的衣服如果面料看上去品质感好、价值感高你看起来就好看，面料看起来品质感差、价值感低就不好看？',
    options: [
      { v: 'A', l: '有', styles: ['古典型'] },
      { v: 'B', l: '没有', styles: ['少女型', '优雅型', '浪漫型', '少年型', '时尚型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q6',
    text: '你穿裤装好看还是裙装好看？（注意是好看，而不是觉得舒服、方便）',
    options: [
      { v: 'A', l: '裤装', styles: ['少年型'] },
      { v: 'B', l: '裙装', styles: ['古典型', '少女型', '优雅型', '浪漫型'] },
      { v: 'C', l: '没区别', styles: ['戏剧型', '时尚型', '自然型'] },
    ],
  },
  {
    id: 'q7',
    text: '你穿连衣裙好看还是上下分开的半裙好看？',
    options: [
      { v: 'A', l: '连衣裙', styles: ['少女型', '古典型'] },
      { v: 'B', l: '分开的裙装', styles: ['时尚型'] },
      { v: 'C', l: '没区别', styles: ['优雅型', '浪漫型', '少年型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q8',
    text: '你穿上衣的长度到哪个位置好看？（注意是上衣，不是风衣或大衣）',
    options: [
      { v: 'A', l: '到臀部大腿根的长款', styles: ['戏剧型', '自然型'] },
      { v: 'B', l: '到胯的中款', styles: ['古典型'] },
      { v: 'C', l: '到腰的短款', styles: ['少年型'] },
      { v: 'D', l: '都差不多，没太大区别', styles: ['时尚型'] },
      { v: 'E', l: '要么长款、要么短款，中款不好看', styles: ['戏剧型'] },
    ],
  },
  {
    id: 'q9',
    text: '你小时候是否像男孩子一样淘气、调皮？',
    options: [
      { v: 'A', l: '是', styles: ['少年型'] },
      { v: 'B', l: '否', styles: ['少女型', '优雅型', '浪漫型', '时尚型', '古典型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q10',
    text: '你穿衣服是敞开扣子好看还是把扣子都扣上穿好看？（注意是好看，不是指舒适程度）',
    options: [
      { v: 'A', l: '敞开好看', styles: ['自然型'] },
      { v: 'B', l: '扣上好看', styles: ['古典型'] },
    ],
  },
  {
    id: 'q11',
    text: '你青春年少的时候是否看起来就比同龄人显老、显成熟，但成年以后这个现象就不存在了？',
    options: [
      { v: 'A', l: '是', styles: ['自然型', '浪漫型'] },
      { v: 'B', l: '否', styles: ['少女型', '优雅型', '少年型', '时尚型', '古典型', '戏剧型'] },
    ],
  },
  {
    id: 'q12',
    text: '你青春期时身形发育是否比同龄人早？（注意：仅指胸、腰、臀、身材曲线的发育，与是否来月经、思想为人处事是否成熟无关）',
    options: [
      { v: 'A', l: '是', styles: ['浪漫型'] },
      { v: 'B', l: '否', styles: ['少女型', '优雅型', '少年型', '时尚型', '古典型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q13',
    text: '你是否一直看起来都比同龄人显小？',
    options: [
      { v: 'A', l: '是', styles: ['少年型', '少女型'] },
      { v: 'B', l: '否', styles: ['浪漫型', '优雅型', '时尚型', '古典型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q14',
    text: '你是否长着一张娃娃脸？',
    options: [
      { v: 'A', l: '是', styles: ['少女型'] },
      { v: 'B', l: '否', styles: ['浪漫型', '优雅型', '少年型', '时尚型', '古典型', '自然型', '戏剧型'] },
    ],
  },
];

// 8 种风格描述（复刻 action2.js desc，修正原版个别错字以便对外展示）
var RESULTS = {
  少女型: {
    emoji: '🎀',
    desc: '善良、可爱，比实际年龄看上去要年轻很多。带有某种纯真的特点，强调精巧、细腻的感觉。适合曲线版型、曲线款型，适合长度到小腿的连衣裙、喇叭裙、百褶裙（褶不能太大）、大圆领、荷叶边、飘带、窄边装饰（要曲线的）、精致小花边、蕾丝边，追求轻柔感。裙装比裤装更适合。即使进入中老年依然要借鉴上述一些元素。回避成熟感、大人化、浓重、粗糙的东西。',
    tags: ['善良可爱', '纯真精巧', '年轻显小', '曲线柔美'],
  },
  优雅型: {
    emoji: '💐',
    desc: '带有较浓郁的女人味，温柔、雅致飘逸、文静、柔弱、精致。曲线剪裁，收腰领、襟处边缘都呈曲线型，回避直角出现。不要用宽平的垫肩。适合有皱褶的装饰、膨松的袖子、垂吊感的连衣长裙、飘逸的长裙（身材较丰满的人穿包身收口的连衣裙），即使身材不高也可以穿长裙，裙型最好包身收口（类似旗袍裙）。回避粗糙、生硬、粗犷豪放的感觉。',
    tags: ['温柔知性', '气质出众', '柔美含蓄', '温婉大方'],
  },
  浪漫型: {
    emoji: '🌹',
    desc: '妩媚、华丽妖娆、有风情，有成熟女人的魅力。曲线版型 X 型剪裁。适合包身裙、收腰多皱连衣裙、鱼尾裙、喇叭裙（穿着者臀围要小）、大领子、大领口、垂吊大领、肩部可以膨松、灯笼袖口、荷叶边衬衣、裤子不带裤线。回避直筒裙、A 字裙，穿线条硬朗的服装会显得很壮。回避男性化、小孩子气、硬朗的感觉。',
    tags: ['华丽妩媚', '曲线玲珑', '成熟迷人', '风情万种'],
  },
  少年型: {
    emoji: '🧢',
    desc: '活泼、帅气、干练、洒脱、简洁、清爽，作男性化打扮反而能衬托女性的魅力。直版型、直线剪裁，适合短上衣、夹克衫、小皮装、短裤、短裙，裤装比裙装更漂亮，衣服上可有许多拉链、明兜、立领、多扣、明线做工。回避女性化、成熟、端庄、柔软的感觉。',
    tags: ['帅气利落', '中性干练', '清爽活泼', '简洁大方'],
  },
  时尚型: {
    emoji: '✨',
    desc: '时尚、摩登、特别、标新立异、高科技感、奇特、酷、生机勃勃，整体强调时尚独特，极具个性魅力的风格。直线打扮比曲线的好。剪裁锋利有棱角。符合当年流行趋势，很适合裤装（直筒裤、喇叭裤等，但不适合西裤，带有钉饰、流苏或磨破等装饰的）、短夹克衫、强调民族感的、复杂、有变化、不规则、不对称的。回避过时的、土气的、过于端庄保守的东西，回避过分女人味和端庄成熟感。',
    tags: ['时尚摩登', '标新立异', '个性独特', '酷感十足'],
  },
  古典型: {
    emoji: '💼',
    desc: '端庄、稳重、精致、严谨、高贵、脱俗、传统、上品。所有穿戴都要体现一种都市化、华贵、精致、高级的感觉，但又不能太夸张。合体的直线剪裁，腰不要收得过分紧，但必须收腰。回避怪异的、粗糙的、厚重的、过于女性化、小孩子气的东西。',
    tags: ['高级端庄', '品质至上', '正统得体', '精致合体'],
  },
  自然型: {
    emoji: '🌿',
    desc: '大方、洒脱、亲切、干练、纯朴、随和，可以把休闲装穿得很潇洒。直线剪裁、几何型造型，细节越简单越好，衣服可比自己的身材大一号，领口不要严谨，适合大西装领、大 V 字领、两粒扣、方的尖的翻领、拉链衫、腰不能收得过于曲线，适合穿直筒裤、宽腿裤（不夸张的）、A 字长裙、直筒吊带长裙、自然乡村风格长裙、喇叭长裙、中长裙，总体说长裙比短裙好，但不能过于女性化。越简洁、越中性的服装越能体现自然型女士的女性味道。回避过分可爱的女人味的、曲线的、拘束的、古板的、前卫豪华的感觉。',
    tags: ['潇洒随性', '亲和自然', '宽松舒适', '不刻意打扮'],
  },
  戏剧型: {
    emoji: '👑',
    desc: '气派、夸张、华丽、醒目、张扬、大气磅礴、视觉冲击力强、存在感强。直线版型的衣服，但细节处直线、曲线裁剪都适合。宜穿线条笔直、锋利的外套、紧身衣、皱褶很多的连衣裙、大枪驳头西装、大 V 字领、特大领、一粒扣的服装，比自己的型号大 1 号、大 2 号的都行，束腰的、泡泡袖（肩）、荷叶袖、大方领、大蝴蝶结、带垫肩、高裙衩、宽腰带、宽腿裤、大喇叭裤、紧腿裤等夸张、华丽的打扮都非常能衬托戏剧型人出众的气质。总体来说直曲对于戏剧型人要求并不严格。回避小孩子气的、可爱的小气的、中庸的、小家子气的感觉。',
    tags: ['气场强大', '存在感强', '视觉冲击', '夸张大气'],
  },
};

function calculateResult(answers) {
  var scores = {};
  ORDER.forEach(function (s) { scores[s] = 0; });
  QUESTIONS.forEach(function (q) {
    var ans = answers[q.id];
    if (!ans) return;
    var opt = q.options.find(function (o) { return o.v === ans; });
    if (!opt) return;
    opt.styles.forEach(function (s) {
      if (scores[s] !== undefined) scores[s] += 1;
    });
  });
  // 分数降序；分数并列时保持 ORDER 顺序（与原版 data 数组一致）
  var sorted = ORDER.slice().sort(function (a, b) { return scores[b] - scores[a]; });
  var main = sorted[0];
  var sub = sorted[1];
  return { name: main, subStyle: sub, detail: RESULTS[main], scores: scores };
}

Page({
  data: {
    questions: QUESTIONS,
    answers: {},
    started: false,
    showResult: false,
    result: null,
    currentIndex: 0,
    progress: 0,
    scrollInto: '',
    submitting: false,
  },

  onLoad: function () {
    wx.setNavigationBarTitle({ title: '女士风格测试' });
  },

  start: function () {
    this.setData({ started: true, currentIndex: 0, scrollInto: 'q-0' });
  },

  select: function (e) {
    var qid = e.currentTarget.dataset.qid;
    var val = e.currentTarget.dataset.val;
    var idx = e.currentTarget.dataset.idx;
    var answers = this.data.answers;
    answers[qid] = val;
    var next = Math.min(idx + 1, QUESTIONS.length - 1);
    var progress = Math.round((Object.keys(answers).length / QUESTIONS.length) * 100);
    this.setData({
      answers: answers,
      currentIndex: next,
      progress: progress,
      scrollInto: 'q-' + next,
    });
  },

  scrollChange: function (e) {
    var idx = e.detail.current;
    this.setData({ currentIndex: idx });
  },

  prev: function () {
    var idx = Math.max(0, this.data.currentIndex - 1);
    this.setData({ currentIndex: idx, scrollInto: 'q-' + idx });
  },

  submit: function () {
    var answered = Object.keys(this.data.answers).length;
    if (answered < QUESTIONS.length) {
      wx.showToast({ title: '还有 ' + (QUESTIONS.length - answered) + ' 题未答', icon: 'none' });
      var firstMiss = 0;
      for (var i = 0; i < QUESTIONS.length; i++) {
        if (!this.data.answers[QUESTIONS[i].id]) { firstMiss = i; break; }
      }
      this.setData({ currentIndex: firstMiss, scrollInto: 'q-' + firstMiss });
      return;
    }
    var result = calculateResult(this.data.answers);
    this.setData({ showResult: true, result: result, progress: 100 });
    this.saveResult(result);
  },

  saveResult: function (result) {
    var t = this;
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/style-test/save-mini',
        method: 'POST',
        data: { openid: openid, gender: 'female', answers: t.data.answers, main_style: result.name },
        success: function () {},
        fail: function () {},
      });
    }).catch(function () {});
  },

  goTryon: function () {
    wx.navigateTo({ url: '/pages/style-tryon/index' });
  },

  retry: function () {
    this.setData({ answers: {}, started: false, showResult: false, result: null, currentIndex: 0, progress: 0, scrollInto: '' });
  },

  goBack: function () {
    wx.navigateBack({ delta: 1 });
  },
});

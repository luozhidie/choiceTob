var app = getApp();
var BASE = 'https://colour-choice.art';

// 男版 5 种主风格（与 nan.html / action.js 一致）
var ORDER = ['戏剧型', '自然型', '古典型', '浪漫型', '时尚型'];

// 18 道题完全复刻原版 nan.html；选项 value 里的错误标点已在下方修正为「、」
var QUESTIONS = [
  {
    id: 'q1',
    text: '你的视觉身高看起来比实际身高（都是在不穿鞋的状态下）：',
    options: [
      { v: 'A', l: '显高', styles: ['戏剧型'] },
      { v: 'B', l: '显矮', styles: ['自然型'] },
      { v: 'C', l: '不显高也不显矮', styles: ['浪漫型', '时尚型', '古典型'] },
    ],
  },
  {
    id: 'q2',
    text: '你是否有擅长的运动项目？（舞蹈、瑜伽等各种肢体运动都算。注意是擅长，小范围内比赛会得奖的！）',
    options: [
      { v: 'A', l: '有', styles: ['自然型'] },
      { v: 'B', l: '没有', styles: ['浪漫型', '时尚型', '古典型', '戏剧型'] },
    ],
  },
  {
    id: 'q3',
    text: '你穿正装好看还是运动休闲装好看？',
    options: [
      { v: 'A', l: '正装', styles: ['古典型'] },
      { v: 'B', l: '运动休闲装', styles: ['自然型'] },
      { v: 'C', l: '没区别，都好看', styles: ['浪漫型', '时尚型', '戏剧型'] },
    ],
  },
  {
    id: 'q4',
    text: '你青春年少的时候是否看起来就比同龄人显老、显成熟，但成年以后这个现象就不存在了？',
    options: [
      { v: 'A', l: '是', styles: ['自然型'] },
      { v: 'B', l: '否', styles: ['时尚型', '古典型', '戏剧型', '浪漫型'] },
    ],
  },
  {
    id: 'q5',
    text: '你是否有这种现象：穿的衣服如果面料看上去品质感好、价值感高你看起来就好看，面料看起来品质感差、价值感低就不好看？',
    options: [
      { v: 'A', l: '有', styles: ['古典型'] },
      { v: 'B', l: '没有', styles: ['浪漫型', '时尚型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q6',
    text: '你穿西装紧身、合体、宽松哪个好看？（如果没穿过西装可考虑夹克或外套）',
    options: [
      { v: 'A', l: '合体', styles: ['古典型', '浪漫型'] },
      { v: 'B', l: '宽松', styles: ['自然型', '戏剧型'] },
      { v: 'C', l: '紧身', styles: ['时尚型'] },
    ],
  },
  {
    id: 'q7',
    text: '你穿西装是单排扣的好看还是双排扣的好看？',
    options: [
      { v: 'A', l: '单排', styles: ['时尚型', '古典型', '自然型'] },
      { v: 'B', l: '双排', styles: ['浪漫型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q8',
    text: '如果是单排扣西装你是穿（）好看？',
    options: [
      { v: 'A', l: '单排三粒扣', styles: ['古典型'] },
      { v: 'B', l: '单排四粒扣', styles: ['时尚型'] },
    ],
  },
  {
    id: 'q9',
    text: '你穿西装是敞开扣子好看还是把扣子都扣上穿好看？（注意是好看，不是指舒适程度）',
    options: [
      { v: 'A', l: '扣上好看', styles: ['古典型'] },
      { v: 'B', l: '敞开好看', styles: ['自然型'] },
      { v: 'C', l: '扣上和敞开没区别', styles: ['浪漫型', '时尚型', '戏剧型'] },
    ],
  },
  {
    id: 'q10',
    text: '你穿衬衫是平滑的好看还是有肌理的好看？（肌理是指面料表面的状态，表面看起来光滑平整是无肌理，凹凸不平是有肌理。）',
    options: [
      { v: 'A', l: '平滑的好看', styles: ['古典型', '时尚型'] },
      { v: 'B', l: '有肌理的好看', styles: ['戏剧型', '自然型', '浪漫型', '时尚型'] },
    ],
  },
  {
    id: 'q11',
    text: '你穿有图案的衣服好看，还是没有图案的衣服好看？',
    options: [
      { v: 'A', l: '没图案的好看', styles: ['古典型'] },
      { v: 'B', l: '有图案的好看', styles: ['浪漫型'] },
      { v: 'C', l: '都差不多，没有什么区别', styles: ['时尚型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q12',
    text: '你穿衣服的图案，下列哪种好看？（注意是好看，不是指喜欢。）',
    options: [
      { v: 'A', l: '宽大条纹、大格子的图案', styles: ['自然型', '戏剧型'] },
      { v: 'B', l: '窄小条纹、小格子的图案', styles: ['浪漫型', '时尚型'] },
      { v: 'C', l: '花朵图案好看', styles: ['浪漫型'] },
      { v: 'D', l: '素色比有图案的好看', styles: ['古典型'] },
    ],
  },
  {
    id: 'q13',
    text: '你衣服上的图案、戴的眼镜、手表等的大小是下列哪种情况好看？',
    options: [
      { v: 'A', l: '很大的好看', styles: ['自然型', '戏剧型'] },
      { v: 'B', l: '中等的、不夸张也不小气的好看', styles: ['古典型'] },
      { v: 'C', l: '中等或小一点的好看', styles: ['浪漫型', '时尚型'] },
    ],
  },
  {
    id: 'q14',
    text: '你的皮鞋是哪种款式好看？',
    options: [
      { v: 'A', l: '一脚蹬的款式', styles: ['自然型'] },
      { v: 'B', l: '系带的款式', styles: ['古典型'] },
    ],
  },
  {
    id: 'q15',
    text: '你皮鞋的材质，下列哪种好看？',
    options: [
      { v: 'A', l: '磨砂皮', styles: ['自然型'] },
      { v: 'B', l: '漆皮', styles: ['浪漫型', '时尚型', '戏剧型'] },
      { v: 'C', l: '细腻精良的皮质', styles: ['古典型'] },
      { v: 'D', l: '以上三个没区别，都好看，看款式', styles: ['浪漫型', '时尚型', '戏剧型'] },
    ],
  },
  {
    id: 'q16',
    text: '你皮鞋鞋头的形状是下列哪种好看？',
    options: [
      { v: 'A', l: '大、长的尖头', styles: ['戏剧型'] },
      { v: 'B', l: '窄、小的尖头', styles: ['时尚型'] },
      { v: 'C', l: '圆头', styles: ['浪漫型'] },
      { v: 'D', l: '不尖也不圆', styles: ['古典型'] },
    ],
  },
  {
    id: 'q17',
    text: '你是否很有才情且异性缘很好？',
    options: [
      { v: 'A', l: '是', styles: ['浪漫型'] },
      { v: 'B', l: '否', styles: ['古典型', '时尚型', '自然型', '戏剧型'] },
    ],
  },
  {
    id: 'q18',
    text: '你的发型适合下列哪种？',
    options: [
      { v: 'A', l: '有气势的背头', styles: ['戏剧型'] },
      { v: 'B', l: '平头、寸头、松散随意的发型，可不用精心打理', styles: ['自然型'] },
      { v: 'C', l: '标准的三七分，一丝不苟，不能凌乱', styles: ['古典型'] },
      { v: 'D', l: '可以很百变，各种烫染', styles: ['时尚型'] },
      { v: 'E', l: '柔和的发型、长发', styles: ['浪漫型'] },
    ],
  },
];

// 5 种风格描述（复刻 action.js desc，修正错字）
var RESULTS = {
  戏剧型: {
    emoji: '👑',
    star: '周润发',
    desc: '服装选择上要质地硬挺，气派华丽，图案夸张，整体妆扮要对比鲜明大气。避免穿小气、古板、随意的东西。',
    tags: ['气场强大', '对比鲜明', '夸张大气', '存在感强'],
    image: BASE + '/style-test/male/dramatic.jpg',
  },
  自然型: {
    emoji: '🌿',
    star: '黎明',
    desc: '着装选择上随意、洒脱，棉、麻面料。格子、条纹都是自然型人理想之选。回避光泽感强、小气、做作夸张的东西。',
    tags: ['随意洒脱', '棉麻亲和', '格子条纹', '自然舒适'],
    image: BASE + '/style-test/male/natural.jpg',
  },
  古典型: {
    emoji: '💼',
    star: '陈道明',
    desc: '着装选择面料高档、上品，素色无图案，尽量回避前卫、时髦、古怪、随意夸张的东西。',
    tags: ['高档上品', '素色无图案', '正统得体', '精致合体'],
    image: BASE + '/style-test/male/classic.jpg',
  },
  浪漫型: {
    emoji: '🌹',
    star: '梁朝伟',
    desc: '选择面料不能过于硬朗，要柔和、华丽，适合驾驭花朵的衣着。回避无修饰感、破烂、古板生硬的东西。',
    tags: ['柔和华丽', '有情调', '异性缘好', '不硬朗'],
    image: BASE + '/style-test/male/romantic.jpg',
  },
  时尚型: {
    emoji: '✨',
    star: '谢霆锋',
    desc: '突出个性，紧跟时尚，多装饰，发光、金属面料都很适合。回避古板、过于气派的东西。',
    tags: ['个性独特', '紧跟时尚', '多装饰', '金属发光'],
    image: BASE + '/style-test/male/fashion.jpg',
  },
};

function parseStyles(raw) {
  // 兼容原版可能混用的「、」「,」「，」分隔；过滤不在 ORDER 里的词
  if (!raw) return [];
  return String(raw)
    .split(/[,，、]/)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return ORDER.indexOf(s) >= 0; });
}

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
  // 分数降序；同分按 ORDER 顺序
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
    wx.setNavigationBarTitle({ title: '男士风格测试' });
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
        data: { openid: openid, gender: 'male', answers: t.data.answers, main_style: result.name },
        success: function () {},
        fail: function () {},
      });
    }).catch(function () {});
  },

  retry: function () {
    this.setData({ answers: {}, started: false, showResult: false, result: null, currentIndex: 0, progress: 0, scrollInto: '' });
  },

  goBack: function () {
    wx.navigateBack({ delta: 1 });
  },
});

var app = getApp();
var BASE = 'https://colour-choice.art';

var QUESTIONS = [
  { id: 'q1', text: '你的视觉身高看起来比实际身高', options: [{ v: 'A', l: '显高' }, { v: 'B', l: '显矮' }, { v: 'C', l: '不显高也不显矮' }] },
  { id: 'q2', text: '你是否有擅长的运动项目', options: [{ v: 'A', l: '有' }, { v: 'B', l: '没有' }] },
  { id: 'q3', text: '你穿正装好看还是运动休闲装好看', options: [{ v: 'A', l: '正装' }, { v: 'B', l: '运动休闲装' }, { v: 'C', l: '都差不多' }] },
  { id: 'q4', text: '你的身形是', options: [{ v: 'A', l: '平肩扁腰' }, { v: 'B', l: '溜肩圆腰' }, { v: 'C', l: '好像区别不大' }] },
  { id: 'q5', text: '你穿的衣服面料品质感好你就好看', options: [{ v: 'A', l: '有' }, { v: 'B', l: '没有' }] },
  { id: 'q6', text: '你穿裤装好看还是裙装好看', options: [{ v: 'A', l: '裤装' }, { v: 'B', l: '裙装' }, { v: 'C', l: '没区别' }] },
  { id: 'q7', text: '你穿连衣裙好看还是上下分开的半裙好看', options: [{ v: 'A', l: '连衣裙' }, { v: 'B', l: '分开的裙装' }, { v: 'C', l: '没区别' }] },
  { id: 'q8', text: '你穿上衣的长度到哪个位置好看', options: [{ v: 'A', l: '到臀部大腿根的长款' }, { v: 'B', l: '到胯的中款' }, { v: 'C', l: '到腰的短款' }, { v: 'D', l: '都差不多' }, { v: 'E', l: '要么长款要么短款，中款不好看' }] },
  { id: 'q9', text: '你小时候是否像男孩子一样淘气调皮', options: [{ v: 'A', l: '是' }, { v: 'B', l: '否' }] },
  { id: 'q10', text: '你穿衣服敞开扣子好看还是扣上好看', options: [{ v: 'A', l: '敞开好看' }, { v: 'B', l: '扣上好看' }] },
  { id: 'q11', text: '你青春年少时是否看起来比同龄人显老显成熟', options: [{ v: 'A', l: '是' }, { v: 'B', l: '否' }] },
  { id: 'q12', text: '你青春期时身形发育是否比同龄人早', options: [{ v: 'A', l: '是' }, { v: 'B', l: '否' }] },
  { id: 'q13', text: '你是否一直看起来都比同龄人显小', options: [{ v: 'A', l: '是' }, { v: 'B', l: '否' }] },
  { id: 'q14', text: '你是否长着一张娃娃脸', options: [{ v: 'A', l: '是' }, { v: 'B', l: '否' }] },
];

var SCORES = {
  q1: { A: { 戏剧: 2, 前卫: 1 }, B: { 少女: 2, 少年: 1 }, C: { 自然: 1 } },
  q2: { A: { 少年: 2, 自然: 1 }, B: { 优雅: 1, 浪漫: 1 } },
  q3: { A: { 古典: 2, 戏剧: 1 }, B: { 少年: 2, 自然: 1 }, C: { 优雅: 1, 前卫: 1 } },
  q4: { A: { 少年: 2, 戏剧: 1 }, B: { 浪漫: 2, 优雅: 1 }, C: { 自然: 1 } },
  q5: { A: { 古典: 2, 戏剧: 1 }, B: { 少女: 1, 自然: 1 } },
  q6: { A: { 少年: 2, 戏剧: 1 }, B: { 浪漫: 2, 优雅: 1 }, C: { 自然: 1 } },
  q7: { A: { 浪漫: 2, 优雅: 1 }, B: { 少年: 2, 前卫: 1 }, C: { 自然: 1 } },
  q8: { A: { 戏剧: 2, 浪漫: 1 }, B: { 古典: 1, 自然: 1 }, C: { 少年: 2, 前卫: 1 }, D: { 自然: 1 }, E: { 前卫: 1, 戏剧: 1 } },
  q9: { A: { 少年: 2, 前卫: 1 }, B: { 优雅: 1, 浪漫: 1 } },
  q10: { A: { 戏剧: 2, 前卫: 1 }, B: { 古典: 2, 优雅: 1 } },
  q11: { A: { 古典: 2, 戏剧: 1 }, B: { 少女: 1, 少年: 1 } },
  q12: { A: { 浪漫: 2, 优雅: 1 }, B: { 少女: 1, 少年: 1 } },
  q13: { A: { 少女: 2, 少年: 1 }, B: { 古典: 1, 戏剧: 1 } },
  q14: { A: { 少女: 3 }, B: { 优雅: 1, 浪漫: 1 } },
};

var RESULTS = {
  少女型: { desc: '可爱甜美、青春活泼、小巧灵动、乖巧精致', tags: ['可爱甜美', '青春活泼', '小巧灵动', '乖巧精致'], emoji: '🎀' },
  少年型: { desc: '帅气利落、中性干练、清爽活泼、简洁大方', tags: ['帅气利落', '中性干练', '清爽活泼', '简洁大方'], emoji: '🧢' },
  优雅型: { desc: '温柔知性、气质出众、柔美含蓄、温婉大方', tags: ['温柔知性', '气质出众', '柔美含蓄', '温婉大方'], emoji: '💐' },
  浪漫型: { desc: '华丽妩媚、曲线玲珑、成熟迷人、风情万种', tags: ['华丽妩媚', '曲线玲珑', '成熟迷人', '风情万种'], emoji: '🌹' },
  戏剧型: { desc: '气场强大、存在感强、视觉冲击、夸张大气', tags: ['气场强大', '存在感强', '视觉冲击', '夸张大气'], emoji: '👑' },
  古典型: { desc: '高级端庄、品质至上、正统得体、精致合体', tags: ['高级端庄', '品质至上', '正统得体', '精致合体'], emoji: '💼' },
  自然型: { desc: '潇洒随性、亲和自然、宽松舒适、不刻意打扮', tags: ['潇洒随性', '亲和自然', '宽松舒适', '不刻意打扮'], emoji: '🌿' },
  前卫型: { desc: '个性独特、潮流时尚、百变造型、打破常规', tags: ['个性独特', '潮流时尚', '百变造型', '打破常规'], emoji: '⚡' },
};

function calculateResult(answers) {
  var scores = { 少女: 0, 少年: 0, 优雅: 0, 浪漫: 0, 戏剧: 0, 古典: 0, 自然: 0, 前卫: 0 };
  for (var qid in SCORES) {
    var ans = answers[qid];
    if (!ans) continue;
    var map = SCORES[qid][ans];
    if (!map) continue;
    for (var style in map) {
      if (scores[style] !== undefined) scores[style] += map[style];
    }
  }
  var maxScore = -Infinity;
  var main = '自然';
  for (var k in scores) {
    if (scores[k] > maxScore) { maxScore = scores[k]; main = k; }
  }
  return { name: main + '型', detail: RESULTS[main + '型'] || RESULTS['自然型'], scores: scores };
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

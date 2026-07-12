Page({
  data: {
    id: '',
    course: null,
    loading: true,
    fallback: {
      title: 'AI赋能·服装精英销售特训营',
      price: 190,
      description: '专为服装店主、搭配师、买手打造。AI选款 + 搭配公式 + 私域销售话术，让你学会用人工智能高效拿货、组货、卖货。',
      outline: [
        'AI 时尚趋势预测与爆款拆解',
        '色彩搭配公式与身材扬长避短',
        'VIP客户形象诊断与连带销售',
        '私域朋友圈美学内容批量产出',
        '线下陪购流程与逼单话术',
        '结业考核与 1v1 答疑'
      ],
      tags: ['AI赋能', '销售特训', '形象美学'],
      duration: '2天1夜 · 线下集训',
      location: '深圳·南油服装批发市场'
    }
  },
  onLoad: function (options) {
    var id = options.id || '';
    var title = options.title || '';
    this.setData({ id: id });
    if (id) this.loadCourse(id);
    else if (title) this.matchByTitle(title);
    else this.setData({ loading: false });
  },
  loadCourse: function (id) {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/courses?id=' + id,
      success: function (r) {
        var d = r.data || {};
        var c = (d.data && d.data[0]) || d.data || null;
        if (!c && Array.isArray(d)) c = d.find(function (x) { return x.id === id; });
        t.setData({ course: c, loading: false });
      },
      fail: function () { t.setData({ loading: false }); }
    });
  },
  matchByTitle: function (title) {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/courses?limit=50',
      success: function (r) {
        var list = (r.data && r.data.data) || (Array.isArray(r.data) ? r.data : []);
        var hit = list.filter(function (c) { return (c.title || '').indexOf(title) > -1; })[0] || null;
        t.setData({ course: hit, loading: false });
      },
      fail: function () { t.setData({ loading: false }); }
    });
  },
  goBook: function () {
    wx.showModal({
      title: '预约课程',
      content: '请添加客服微信：luozhidie\n备注「课程预约」即可锁定名额。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});

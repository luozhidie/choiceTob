Page({
  data: {
    activeTab: 'course',
    catLabel: '全部分类',
    diffLabel: '全部难度',
    courses: [],
    tools: [],
    loading: true,
    campTitle: 'AI赋能·服装精英销售特训营'
  },

  onLoad: function () { this.loadCourses(); this.loadTools(); },

  swTab: function (e) { this.setData({ activeTab: e.currentTarget.dataset.t }); },

  loadCourses: function () {
    var t = this;
    t.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/courses?limit=50',
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data || [];
        list.forEach(function (c) {
          var p = c.price || 0; if (p >= 100) p = Math.round(p / 100);
          c.price = p;
        });
        t.setData({ courses: list, loading: false });
      },
      fail: function () { t.setData({ courses: [], loading: false }); }
    });
  },

  loadTools: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/products?category=工具&limit=20',
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data || [];
        list.forEach(function (p) {
          var n = Number(p.price) || 0; if (n >= 100) n = Math.round(n / 100);
          p.price = n;
        });
        t.setData({ tools: list });
      }
    });
  },

  // Hub 入口
  goCourseBooking: function () {
    var target = this.data.campTitle;
    var list = this.data.courses || [];
    var hit = list.filter(function (c) { return (c.title || '').indexOf(target) > -1; })[0];
    var url = '/pages/courses/detail/index?title=' + encodeURIComponent(target);
    if (hit && hit.id) url += '&id=' + hit.id;
    wx.navigateTo({ url: url });
  },
  goStyling: function () { wx.navigateTo({ url: '/pages/wardrobe/styling-request/index' }); },
  goQuiz: function () { wx.showModal({ title: '试题练习', content: '试题练习开发中，敬请期待', showCancel: false, confirmText: '知道了' }); },
  goColor: function () { wx.showModal({ title: '配色练习', content: '配色练习开发中，敬请期待', showCancel: false, confirmText: '知道了' }); },
  goActivity: function (e) {
    var t = e.currentTarget.dataset.type;
    if (t === 'free') wx.navigateTo({ url: '/pages/style-test/index?scene=personal' });
    else if (t === 'tools') this.setData({ activeTab: 'tool' });
    else {
      var target = this.data.campTitle;
      var list = this.data.courses || [];
      var hit = list.filter(function (c) { return (c.title || '').indexOf(target) > -1; })[0];
      var url = '/pages/courses/detail/index?title=' + encodeURIComponent(target);
      if (hit && hit.id) url += '&id=' + hit.id;
      wx.navigateTo({ url: url });
    }
  },

  playCourse: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/courses/detail/index?id=' + id });
  },
  goTool: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/shop/index?id=' + id });
  }
});

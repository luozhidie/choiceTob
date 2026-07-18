/* 档口市场选择页：圆形市场头像网格（对标同行底部市场导航） */
Page({
  data: {
    markets: [],
    loading: true
  },

  onLoad: function () {
    this.loadMarkets();
  },

  loadMarkets: function () {
    var t = this;
    t.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/markets',
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) {
          var list = d.data.map(function (m) {
            m.initial = (m.name || '档').charAt(0);
            return m;
          });
          t.setData({ markets: list, loading: false });
        } else {
          t.setData({ markets: [], loading: false });
        }
      },
      fail: function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
        t.setData({ loading: false });
      }
    });
  },

  goList: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name || '';
    wx.navigateTo({ url: '/pages/stall/index/index?id=' + id + '&name=' + encodeURIComponent(name) });
  },

  goSubscribed: function () {
    wx.navigateTo({ url: '/pages/stall/subscribed/index' });
  },

  goBack: function () {
    wx.navigateBack({ delta: 1, fail: function () { wx.switchTab({ url: '/pages/home/index' }); } });
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/home/index' });
  }
});

/* 我订阅的档口：从本地 subscribed_stalls 读取（与收藏模式一致，v1 不上服务端） */
Page({
  data: {
    stalls: [],
    loading: true,
    subscribed: [],
    isPriceMember: false
  },

  onLoad: function () {
    var app = getApp();
    this.setData({
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner')
    });
  },

  onShow: function () {
    this.load();
  },

  load: function () {
    var t = this;
    var subs = wx.getStorageSync('subscribed_stalls') || [];
    t.setData({ subscribed: subs, loading: true });
    if (subs.length === 0) {
      t.setData({ stalls: [], loading: false });
      return;
    }
    wx.request({
      url: 'https://colour-choice.art/api/public/stalls?limit=300',
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) {
          var set = {};
          subs.forEach(function (id) { set[id] = 1; });
          var list = d.data
            .filter(function (s) { return set[s.id]; })
            .map(function (s) { return t.formatStall(s, subs); });
          t.setData({ stalls: list, loading: false });
        } else {
          t.setData({ stalls: [], loading: false });
        }
      },
      fail: function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
        t.setData({ loading: false });
      }
    });
  },

  formatStall: function (s, subs) {
    var t = this;
    s.initial = (s.name || '档').charAt(0);
    s.tags = s.tags || [];
    s.reorder_rate = s.reorder_rate || 0;
    s.fan_count = s.fan_count || 0;
    s.delivery_rate = s.delivery_rate || 0;
    s.rating = s.rating || 0;
    s.subscribed = (subs || []).indexOf(s.id) >= 0;
    s.previewProducts = (s.previewProducts || []).map(function (p) { return t.formatProduct(p); });
    return s;
  },

  formatProduct: function (p) {
    var n = Number(p.price) || 0;
    if (n >= 100) n = Math.round(n / 100);
    var wp = Number(p.wholesale_price) || 0;
    if (wp >= 100) wp = Math.round(wp / 100);
    if (this.data.isPriceMember && wp > 0) {
      p.priceText = '¥' + (wp % 1 === 0 ? wp : wp.toFixed(2));
      p.wholesalePriceText = '';
    } else {
      p.priceText = '¥' + (n % 1 === 0 ? n : n.toFixed(2));
      p.wholesalePriceText = wp > 0 ? '¥???' : '';
    }
    return p;
  },

  toggleSub: function (e) {
    var id = e.currentTarget.dataset.id;
    var subs = this.data.subscribed.slice();
    var idx = subs.indexOf(id);
    if (idx >= 0) subs.splice(idx, 1);
    wx.setStorageSync('subscribed_stalls', subs);
    var stalls = this.data.stalls.filter(function (s) { return s.id !== id; });
    this.setData({ subscribed: subs, stalls: stalls });
    wx.showToast({ title: '已取消订阅', icon: 'none' });
  },

  goDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/stall/detail/index?id=' + id });
  },

  goMarkets: function () {
    wx.navigateTo({ url: '/pages/stall/markets/index' });
  },

  goBack: function () {
    wx.navigateBack({ delta: 1, fail: function () { wx.switchTab({ url: '/pages/home/index' }); } });
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/home/index' });
  }
});

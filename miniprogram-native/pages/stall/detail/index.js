/* 档口详情页：头像/订阅/粉丝/返单率/简介/评价/商品列表 */
Page({
  data: {
    stallId: '',
    stall: null,
    reviews: [],
    loading: true,
    subscribed: false,
    isPriceMember: false
  },

  onLoad: function (opt) {
    var app = getApp();
    var id = opt.id || '';
    this.setData({
      stallId: id,
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner'),
      subscribed: (wx.getStorageSync('subscribed_stalls') || []).indexOf(id) >= 0
    });
    if (id) {
      this.loadStall();
      this.loadReviews();
    } else {
      this.setData({ loading: false });
    }
  },

  onShow: function () {
    var sub = (wx.getStorageSync('subscribed_stalls') || []).indexOf(this.data.stallId) >= 0;
    this.setData({ subscribed: sub });
  },

  loadStall: function () {
    var t = this;
    t.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/stalls?id=' + encodeURIComponent(t.data.stallId),
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) {
          var s = d.data;
          s.initial = (s.name || '档').charAt(0);
          s.tags = s.tags || [];
          s.reorder_rate = s.reorder_rate || 0;
          s.fan_count = s.fan_count || 0;
          s.delivery_rate = s.delivery_rate || 0;
          s.rating = s.rating || 0;
          s.products = (s.products || []).map(function (p) { return t.formatProduct(p); });
          t.setData({ stall: s, loading: false });
        } else {
          wx.showToast({ title: '档口不存在', icon: 'none' });
          t.setData({ loading: false });
        }
      },
      fail: function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
        t.setData({ loading: false });
      }
    });
  },

  loadReviews: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/stall-reviews?stall_id=' + encodeURIComponent(t.data.stallId) + '&limit=20',
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) {
          var list = d.data.map(function (rv) {
            rv.initial = (rv.user_name || '匿').charAt(0);
            rv.date = (rv.created_at || '').slice(0, 10);
            return rv;
          });
          t.setData({ reviews: list });
        }
      }
    });
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

  toggleSub: function () {
    var id = this.data.stallId;
    var subs = wx.getStorageSync('subscribed_stalls') || [];
    var idx = subs.indexOf(id);
    var nowSub = idx < 0;
    if (nowSub) subs.push(id); else subs.splice(idx, 1);
    wx.setStorageSync('subscribed_stalls', subs);
    this.setData({ subscribed: nowSub });
    wx.showToast({ title: nowSub ? '已订阅' : '已取消订阅', icon: 'none' });
  },

  goShop: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/shop/index?id=' + id });
  },

  goBack: function () {
    wx.navigateBack({ delta: 1, fail: function () { wx.switchTab({ url: '/pages/home/index' }); } });
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/home/index' });
  }
});

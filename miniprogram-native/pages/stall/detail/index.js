/* 档口详情页：头像/订阅/粉丝/返单率/简介/评价/商品列表 */
var sub = require('../../utils/stallSubscribe.js');

Page({
  data: {
    stallId: '',
    stall: null,
    reviews: [],
    loading: true,
    subscribed: false,
    isPriceMember: false,
    // 写评价弹窗
    showReview: false,
    reviewRating: 5,
    reviewName: '',
    reviewContent: '',
    submitting: false
  },

  onLoad: function (opt) {
    var app = getApp();
    var id = opt.id || '';
    var ui = wx.getStorageSync('user_info') || {};
    this.setData({
      stallId: id,
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner'),
      subscribed: (wx.getStorageSync('subscribed_stalls') || []).indexOf(id) >= 0,
      reviewName: ui.nickName || ''
    });
    if (id) {
      this.loadStall();
      this.loadReviews();
      this.syncSubscribe();
    } else {
      this.setData({ loading: false });
    }
  },

  onShow: function () {
    this.syncSubscribe();
  },

  // 以服务端订阅为准，本地作兜底
  syncSubscribe: function () {
    var t = this;
    var id = t.data.stallId;
    var locals = sub.localIds();
    var localSub = locals.indexOf(id) >= 0;
    sub.getOpenid().then(function (openid) {
      sub.fetchSubscribedIds(openid).then(function (ids) {
        if (ids && Array.isArray(ids)) {
          t.setData({ subscribed: ids.indexOf(id) >= 0 });
        } else {
          t.setData({ subscribed: localSub });
        }
      }).catch(function () { t.setData({ subscribed: localSub }); });
    }).catch(function () { t.setData({ subscribed: localSub }); });
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
    var t = this;
    var id = t.data.stallId;
    var nowSub = !t.data.subscribed;
    t.setData({ subscribed: nowSub });
    // 本地兜底
    var locals = sub.localIds();
    var li = locals.indexOf(id);
    if (nowSub && li < 0) locals.push(id);
    if (!nowSub && li >= 0) locals.splice(li, 1);
    sub.saveLocal(locals);
    // 服务端（openid）
    sub.getOpenid().then(function (openid) {
      sub.toggleSubscribe(openid, id, nowSub).catch(function () {});
    }).catch(function () {});
    wx.showToast({ title: nowSub ? '已订阅' : '已取消订阅', icon: 'none' });
  },

  /* ===== 写评价 ===== */
  openReview: function () {
    var ui = wx.getStorageSync('user_info') || {};
    this.setData({ showReview: true, reviewRating: 5, reviewName: ui.nickName || '', reviewContent: '' });
  },
  closeReview: function () {
    this.setData({ showReview: false });
  },
  setRating: function (e) {
    this.setData({ reviewRating: Number(e.currentTarget.dataset.n) });
  },
  onReviewName: function (e) {
    this.setData({ reviewName: e.detail.value });
  },
  onReviewContent: function (e) {
    this.setData({ reviewContent: e.detail.value });
  },
  submitReview: function () {
    var t = this;
    var content = (t.data.reviewContent || '').trim();
    if (!content) { wx.showToast({ title: '请输入评价内容', icon: 'none' }); return; }
    t.setData({ submitting: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/stall-reviews',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        stall_id: t.data.stallId,
        user_name: t.data.reviewName || '',
        content: content,
        rating: t.data.reviewRating
      },
      success: function (r) {
        var d = r.data || {};
        if (d.success) {
          wx.showToast({ title: '评价已提交', icon: 'success' });
          t.setData({ showReview: false });
          t.loadReviews();
        } else {
          wx.showToast({ title: d.error || '提交失败', icon: 'none' });
        }
      },
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
      complete: function () {
        t.setData({ submitting: false });
      }
    });
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

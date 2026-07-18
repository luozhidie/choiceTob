/* 档口列表页：某个市场的档口（头图+筛选+档口卡片） */
var sub = require('../../utils/stallSubscribe.js');

Page({
  data: {
    marketId: '',
    marketName: '',
    market: null,
    stalls: [],
    filtered: [],
    loading: true,
    activeTab: 'all',
    activeSort: 'default',
    subscribed: [],
    isPriceMember: false,
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'mysub', label: '我订阅的' },
      { key: 'selected', label: '严选品牌' },
      { key: 'fast', label: '24h发货' }
    ],
    sorts: [
      { key: 'default', label: '默认' },
      { key: 'rating', label: '评分' },
      { key: 'fans', label: '粉丝' },
      { key: 'reorder', label: '返单率' }
    ]
  },

  onLoad: function (opt) {
    var app = getApp();
    var id = opt.id || '';
    var name = decodeURIComponent(opt.name || '');
    this.setData({
      marketId: id,
      marketName: name,
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner'),
      subscribed: sub.localIds()
    });
    if (id) {
      this.loadMarket();
      this.loadStalls();
      this.syncSubscribe();
    } else {
      this.setData({ loading: false });
    }
  },

  onShow: function () {
    var t = this;
    this.syncSubscribe(function () {
      var subs = t.data.subscribed;
      var stalls = t.data.stalls.map(function (s) {
        s.subscribed = subs.indexOf(s.id) >= 0;
        return s;
      });
      t.setData({ stalls: stalls });
      t.applyFilter();
    });
  },

  // 以服务端订阅为准，合并本地兜底；after(subs) 回调
  syncSubscribe: function (after) {
    var t = this;
    var locals = sub.localIds();
    sub.getOpenid().then(function (openid) {
      sub.fetchSubscribedIds(openid).then(function (ids) {
        var merged = locals.slice();
        if (ids && Array.isArray(ids)) {
          ids.forEach(function (i) { if (merged.indexOf(i) < 0) merged.push(i); });
        }
        sub.saveLocal(merged); // 服务端订阅回写本地，兜底一致
        t.setData({ subscribed: merged });
        if (after) after();
      }).catch(function () { t.setData({ subscribed: locals }); if (after) after(); });
    }).catch(function () { t.setData({ subscribed: locals }); if (after) after(); });
  },

  loadMarket: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/markets?id=' + encodeURIComponent(t.data.marketId),
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) t.setData({ market: d.data });
      }
    });
  },

  loadStalls: function () {
    var t = this;
    t.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/stalls?market_id=' + encodeURIComponent(t.data.marketId) + '&limit=100',
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) {
          var subs = t.data.subscribed;
          var list = d.data.map(function (s) {
            return t.formatStall(s, subs);
          });
          t.setData({ stalls: list, loading: false }, function () { t.applyFilter(); });
        } else {
          t.setData({ stalls: [], filtered: [], loading: false });
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

  onTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.key });
    this.applyFilter();
  },

  onSort: function (e) {
    this.setData({ activeSort: e.currentTarget.dataset.key });
    this.applyFilter();
  },

  applyFilter: function () {
    var t = this;
    var list = t.data.stalls.slice();
    var tab = t.data.activeTab;
    var sort = t.data.activeSort;
    if (tab === 'mysub') list = list.filter(function (s) { return s.subscribed; });
    else if (tab === 'selected') list = list.filter(function (s) { return (s.tags || []).indexOf('严选品牌') >= 0; });
    else if (tab === 'fast') list = list.filter(function (s) { return Number(s.delivery_rate || 0) >= 90; });

    if (sort === 'rating') list.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); });
    else if (sort === 'fans') list.sort(function (a, b) { return (b.fan_count || 0) - (a.fan_count || 0); });
    else if (sort === 'reorder') list.sort(function (a, b) { return (b.reorder_rate || 0) - (a.reorder_rate || 0); });

    t.setData({ filtered: list });
  },

  toggleSub: function (e) {
    var t = this;
    var id = e.currentTarget.dataset.id;
    var subs = t.data.subscribed.slice();
    var idx = subs.indexOf(id);
    var nowSub = idx < 0;
    if (nowSub) subs.push(id); else subs.splice(idx, 1);
    t.setData({ subscribed: subs });
    var stalls = t.data.stalls.map(function (s) { if (s.id === id) s.subscribed = nowSub; return s; });
    t.setData({ stalls: stalls });
    t.applyFilter();
    wx.showToast({ title: nowSub ? '已订阅' : '已取消订阅', icon: 'none' });
    // 本地兜底
    sub.saveLocal(subs);
    // 服务端（openid）
    sub.getOpenid().then(function (openid) {
      sub.toggleSubscribe(openid, id, nowSub).catch(function () {});
    }).catch(function () {});
  },

  goDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/stall/detail/index?id=' + id });
  },

  goSubEntry: function () {
    wx.navigateTo({ url: '/pages/stall/subscribed/index' });
  },

  goBack: function () {
    wx.navigateBack({ delta: 1, fail: function () { wx.switchTab({ url: '/pages/home/index' }); } });
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/home/index' });
  }
});

Page({
  data: {
    keyword: '',
    results: [],
    loading: false,
    history: [],
    hots: ['穿搭', '护肤', '连衣裙', '拿货', '新品'],
    isPriceMember: false,
  },

  onLoad: function () {
    var app = getApp();
    var isPriceMember = !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner');
    this.setData({ isPriceMember: isPriceMember });
    var h = wx.getStorageSync('search_history') || [];
    this.setData({ history: h });
  },

  onInput: function (e) {
    this.setData({ keyword: e.detail.value });
  },

  clearKeyword: function () {
    this.setData({ keyword: '', results: [], loading: false });
  },

  onSearch: function () {
    var kw = this.data.keyword.trim();
    if (!kw) return;
    this.doSearch(kw);
  },

  doSearch: function (kw) {
    var that = this;
    that.setData({ keyword: kw, loading: true, results: [] });
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=50',
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data || [];
        var k = kw.toLowerCase();
        var filtered = list.filter(function (p) {
          return (p.name && p.name.toLowerCase().indexOf(k) >= 0) ||
                 (p.title && p.title.toLowerCase().indexOf(k) >= 0) ||
                 (p.description && p.description.toLowerCase().indexOf(k) >= 0);
        });
        // 格式化价格：会员（含认证店主）显示批发价，非会员显示零售价
        var isPriceMember = that.data.isPriceMember;
        var results = filtered.map(function (p) {
          var price = Number(p.price) || 0;
          if (price >= 100) price = Math.round(price / 100);
          var wp = Number(p.wholesale_price) || 0;
          if (wp >= 100) wp = Math.round(wp / 100);
          var mainPrice = (isPriceMember && wp > 0) ? wp : price;
          return {
            id: p.id,
            name: p.name || p.title,
            image_url: p.image_url || p.cover_image,
            price: mainPrice,
            priceLabel: mainPrice ? '¥' + (mainPrice % 1 === 0 ? mainPrice : mainPrice.toFixed(2)) : '¥0',
          };
        });
        that.setData({ results: results, loading: false });
        // 保存搜索历史
        var h = that.data.history;
        var idx = h.indexOf(kw);
        if (idx >= 0) h.splice(idx, 1);
        h.unshift(kw);
        if (h.length > 10) h = h.slice(0, 10);
        that.setData({ history: h });
        wx.setStorageSync('search_history', h);
      },
      fail: function () {
        that.setData({ loading: false });
        wx.showToast({ title: '搜索失败', icon: 'none' });
      }
    });
  },

  useHistory: function (e) {
    var kw = e.currentTarget.dataset.kw;
    this.doSearch(kw);
  },

  clearHistory: function () {
    this.setData({ history: [] });
    wx.removeStorageSync('search_history');
  },

  goBack: function () {
    wx.navigateBack();
  },

  goDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/shop/index?id=' + id });
  },
});

Page({
  data: {
    keyword: '',
    tabs: ['全部', '上装', '下装', '连衣裙', '外套', '配饰', '鞋履'],
    activeTab: '全部',
    sortType: 'default',
    products: [],
    loading: true,
    hasMore: true,
    page: 1
  },

  onLoad: function() { this.loadProducts(); },

  onPullDownRefresh: function() {
    this.setData({ page: 1, hasMore: true });
    this.loadProducts(function() { wx.stopPullDownRefresh(); });
  },

  onReachBottom: function() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.loadMore();
  },

  loadProducts: function(callback) {
    var that = this;
    that.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=20',
      method: 'GET',
      success: function(res) {
        var list = [];
        if (res.data && res.data.success && res.data.data) list = res.data.data;
        else if (Array.isArray(res.data)) list = res.data;

        list.forEach(function(p) {
          var priceNum = Number(p.price) || 0;
          if (priceNum >= 100) priceNum = Math.round(priceNum / 100);
          p.priceText = '\u00A5' + (priceNum % 1 === 0 ? priceNum : priceNum.toFixed(2));
        });

        that.setData({ products: list, hasMore: list.length >= 20 });
      },
      fail: function() { console.error('加载失败'); },
      complete: function() {
        that.setData({ loading: false });
        if (callback) callback();
      }
    });
  },

  loadMore: function() {
    var that = this;
    that.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=10&offset=' + (that.data.page * 10),
      success: function(res) {
        var list = [];
        if (res.data && res.data.success && res.data.data) list = res.data.data;

        list.forEach(function(p) {
          var priceNum = Number(p.price) || 0;
          if (priceNum >= 100) priceNum = Math.round(priceNum / 100);
          p.priceText = '\u00A5' + (priceNum % 1 === 0 ? priceNum : priceNum.toFixed(2));
        });

        that.setData({
          products: that.data.products.concat(list),
          hasMore: list.length >= 10
        });
      },
      complete: function() { that.setData({ loading: false }); }
    });
  },

  onSearchInput: function(e) { this.setData({ keyword: e.detail.value }); },

  doSearch: function() {
    // TODO: 带关键词搜索
    this.loadProducts();
  },

  clearSearch: function() {
    this.setData({ keyword: '' });
    this.loadProducts();
  },

  switchTab: function(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.setData({ page: 1 });
    this.loadProducts();
  },

  setSort: function(e) {
    var sort = e.currentTarget.dataset.sort;
    if (sort === 'price_asc' && this.data.sortType === 'price_asc') {
      sort = 'price_desc';
    }
    this.setData({ sortType: sort });
    // TODO: 实际排序逻辑
  },

  goShop: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: '/pages/shop/index?id=' + id,
        fail: function() { wx.showToast({ title: '详情开发中', icon: 'none' }); }
      });
    }
  },

  addToCart: function(e) {
    var product = e.currentTarget.dataset.product;
    // 获取购物车数据
    var cart = wx.getStorageSync('cart') || [];
    var exist = cart.find(function(c) { return c.id === product.id; });
    if (exist) {
      exist.quantity += 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.priceText, image: product.image_url || product.cover_image, quantity: 1 });
    }
    wx.setStorageSync('cart', cart);
    wx.showToast({ title: '已加购', icon: 'success', duration: 800 });
  },

  buyNow: function(e) {
    var id = e.currentTarget.dataset.product.id;
    wx.navigateTo({
      url: '/pages/shop/index?id=' + id + '&mode=buy_now',
      fail: function() { wx.showToast({ title: '下单功能开发中', icon: 'none' }); }
    });
  }
})

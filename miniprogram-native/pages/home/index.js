Page({
  data: {
    banners: [
      { id: 1, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&q=80', title: '', subtitle: '' },
      { id: 2, image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&q=80', title: '爆款选品 · 拿货精选', subtitle: '' },
      { id: 3, image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=900&q=80', title: 'VIP会员专享价', subtitle: '' }
    ],
    currentBanner: 0,
    categories: ['全部', '穿搭', '护肤', '彩妆', '养生', '食品', '家居', '文创', '艺术'],
    activeCategory: '全部',
    products: [],
    loading: true,
    menuOpen: false,
    userInfoName: '',
    isLoggedIn: false
  },

  onLoad: function() {
    this.loadProducts();
    this.loadBanners();
    this.checkLoginStatus();
  },

  onPullDownRefresh: function() {
    var that = this;
    that.loadProducts(function() { wx.stopPullDownRefresh(); });
  },

  onBannerChange: function(e) {
    this.setData({ currentBanner: e.detail.current });
  },

  /* ===== 汉堡菜单 ===== */
  toggleMenu: function() {
    this.setData({ menuOpen: !this.data.menuOpen });
  },

  closeMenu: function() {
    this.setData({ menuOpen: false });
  },

  preventClose: function() {}, /* 阻止点击穿透 */

  checkLoginStatus: function() {
    var that = this;
    wx.getSetting({
      success: function(res) {
        if (res.authSetting['scope.userInfo']) {
          that.setData({ isLoggedIn: true, userInfoName: '已登录' });
        }
      }
    });
  },

  doLogin: function() {
    var that = this;
    wx.getUserProfile({
      desc: '完善会员资料',
      success: function(res) {
        that.setData({ userInfoName: res.userInfo.nickName || '已登录', isLoggedIn: true, menuOpen: false });
        wx.showToast({ title: '登录成功', icon: 'success' });
      },
      fail: function() { wx.showToast({ title: '取消登录', icon: 'none' }); }
    });
  },

  goVip: function() {
    this.setData({ menuOpen: false });
    wx.showToast({ title: 'VIP开发中', icon: 'none' });
  },

  goContact: function() {
    this.setData({ menuOpen: false });
    wx.showModal({
      title: '联系客服',
      content: '微信：luozhidie\n工作时间 9:00-18:00',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  /* ===== Banner ===== */
  loadBanners: function() {
    var that = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/banners',
      method: 'GET',
      success: function(res) {
        if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          that.setData({ banners: res.data.data });
        }
      }
    });
  },

  /* ===== 商品 ===== */
  loadProducts: function(callback) {
    var that = this;
    that.setData({ loading: true });

    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=20',
      method: 'GET',
      success: function(res) {
        var list = [];
        if (res.data && res.data.success && res.data.data) list = res.data.data || [];
        else if (Array.isArray(res.data)) list = res.data;

        list.forEach(function(p) {
          var priceNum = Number(p.price) || 0;
          if (priceNum >= 100) priceNum = Math.round(priceNum / 100);
          p.priceText = '\u00A5' + (priceNum % 1 === 0 ? priceNum.toString() : priceNum.toFixed(2));
          p.is_hot = p.is_hot || false;
          p.is_new = p.is_new || false;
        });

        that.setData({ products: list, loading: false });
      },
      fail: function() { that.setData({ loading: false }); },
      complete: function() { if (callback) callback(); }
    });
  },

  switchCategory: function(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.cat });
  },

  goBuyer: function(e) {
    if (e && e.currentTarget && e.currentTarget.dataset.from === 'menu') {
      this.setData({ menuOpen: false });
    }
    wx.switchTab({ url: '/pages/buyer/index' });
  },
  goCourses: function() {
    this.setData({ menuOpen: false });
    wx.showToast({ title: '课程开发中', icon: 'none' });
  },
  goLooks: function() {
    this.setData({ menuOpen: false });
    wx.showToast({ title: '搭配开发中', icon: 'none' });
  },
  goMy: function() {
    this.setData({ menuOpen: false });
    wx.switchTab({ url: '/pages/my/index' });
  },

  goShop: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: '/pages/shop/index?id=' + id,
        fail: function() { wx.showToast({ title: '详情开发中', icon: 'none' }); }
      });
    }
  }
});

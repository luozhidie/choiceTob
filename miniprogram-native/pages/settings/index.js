// 设置
Page({
  data: {
    isLoggedIn: false,
    groups: [
      {
        title: '账户设置',
        items: [
          { key: 'profile', label: '个人信息', url: '/pages/my/index' },
          { key: 'security', label: '账户与安全', url: '/pages/my/index' },
          { key: 'address', label: '收货地址', url: '/pages/address/index' },
        ],
      },
      {
        title: '协议与规则',
        items: [
          { key: 'privacy', label: '隐私政策', url: '/pages/privacy/index' },
          { key: 'terms', label: '平台服务协议', url: '/pages/terms/index' },
          { key: 'rules', label: '平台规则', url: '/pages/rules/index' },
          { key: 'about', label: '关于我们', url: '/pages/about/index' },
        ],
      },
    ],
  },

  onShow: function () {
    this.setData({ isLoggedIn: !!wx.getStorageSync('token') });
  },

  goItem: function (e) {
    var url = e.currentTarget.dataset.url;
    wx.navigateTo({ url: url });
  },

  goLogin: function () {
    wx.navigateTo({ url: '/pages/login/index' });
  },

  logout: function () {
    var that = this;
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      confirmText: '退出',
      confirmColor: '#e11d48',
      success: function (res) {
        if (!res.confirm) return;
        wx.removeStorageSync('token');
        wx.removeStorageSync('user_info');
        wx.removeStorageSync('vip_status');
        wx.removeStorageSync('member_type');
        wx.removeStorageSync('vip_level');
        wx.removeStorageSync('vip_expire');
        wx.removeStorageSync('is_price_member');
        wx.removeStorageSync('is_certified_store_owner');
        wx.removeStorageSync('certified_style');
        wx.removeStorageSync('certified_monthly_sales');
        var app = getApp();
        if (app && app.globalData) {
          app.globalData.isPriceMember = false;
          app.globalData.isCertifiedStoreOwner = false;
        }
        that.setData({ isLoggedIn: false });
        wx.showToast({ title: '已退出登录', icon: 'success' });
      },
    });
  },
});

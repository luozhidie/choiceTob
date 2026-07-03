App({
  globalData: {
    userInfo: null,
    isVip: false
  },

  onLaunch: function() {
    // 检查本地VIP状态
    var vipStatus = wx.getStorageSync('vip_status');
    if (vipStatus === 'active') {
      this.globalData.isVip = true;
    }
  },

  // 检查登录状态
  checkLogin: function() {
    return new Promise(function(resolve) {
      wx.getSetting({
        success: function(res) {
          resolve(res.authSetting['scope.userInfo'] || false);
        },
        fail: function() { resolve(false); }
      });
    });
  },

  // 更新购物车角标数量
  updateCartBadge: function() {
    var cart = wx.getStorageSync('cart') || [];
    var count = 0;
    cart.forEach(function(item) { count += item.quantity || 1; });
    if (count > 0) {
      wx.setTabBarBadge({ index: 2, text: String(count > 99 ? '99+' : count) }).catch(function(){});
    } else {
      wx.removeTabBarBadge({ index: 2 }).catch(function(){});
    }
  }
});

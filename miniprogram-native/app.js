App({
  globalData: {
    userInfo: null,
    isVip: false,
    isPriceMember: false,  // 价格会员（可查看批发价）
  },

  onLaunch: function() {
    // 检查本地VIP状态
    var vipStatus = wx.getStorageSync('vip_status');
    if (vipStatus === 'active') {
      this.globalData.isVip = true;
    }
    // 恢复价格会员状态
    var isPriceMember = wx.getStorageSync('is_price_member');
    if (isPriceMember === true) {
      this.globalData.isPriceMember = true;
    }
  },

  // 获取微信openid（带缓存）
  getOpenid: function() {
    return new Promise(function(resolve, reject) {
      var cached = wx.getStorageSync('wx_openid');
      if (cached) { resolve(cached); return; }

      wx.login({
        success: function(loginRes) {
          if (!loginRes.code) {
            reject(new Error('wx.login 失败'));
            return;
          }
          // 用 code 换 openid（调用后端接口）
          wx.request({
            url: 'https://colour-choice.art/api/wechat-pay/jsapi-signature',
            method: 'POST',
            data: { code: loginRes.code },
            success: function(res) {
              var d = res.data || {};
              if (d.openid) {
                wx.setStorageSync('wx_openid', d.openid);
                resolve(d.openid);
              } else {
                reject(new Error(d.error || '获取openid失败'));
              }
            },
            fail: function() { reject(new Error('网络错误')); }
          });
        },
        fail: function() { reject(new Error('wx.login失败')); }
      });
    });
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

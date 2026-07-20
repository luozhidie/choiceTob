/* ============================================================
   全局接管 Page：每页 onLoad 时把窗口底色设为后台配置的全局色
   （= 首页第一个板块的 bgColor）。后台改这一个色 → 全站（含小程序每一页）
   底色自动跟随，无需改代码、无需重新上传，用户自己在后台即可调。
   ============================================================ */
var _originalPage = Page;
Page = function(options) {
  var _onLoad = options.onLoad;
  options.onLoad = function(query) {
    var app = getApp();
    var bg = (app && app.globalData && app.globalData.pageBg) || '#00BE5A';
    try { wx.setBackgroundColor({ backgroundColor: bg }); } catch (e) {}
    if (typeof _onLoad === 'function') { _onLoad.call(this, query); }
  };
  return _originalPage(options);
};

App({
  globalData: {
    userInfo: null,
    isVip: false,
    isPriceMember: false,       // 价格会员（可查看批发价）
    isCertifiedStoreOwner: false, // 认证店主
    pageBg: '#00BE5A',          // 全局页面底色（后台「首页第一个板块」bgColor，启动时拉取）
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
    // 恢复认证店主状态
    var isCertified = wx.getStorageSync('is_certified_store_owner');
    if (isCertified === true) {
      this.globalData.isCertifiedStoreOwner = true;
    }
    // 拉取全局底色（首页第一个板块的 bgColor，后台可改 → 全站跟随）
    var self = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/blocks',
      method: 'GET',
      success: function(r) {
        var d = r.data;
        if (!d || !d.success) return;
        var all = d.data || [];
        var heroTop = all.filter(function(x){ return x.content && x.content.position === 'hero_top'; });
        var rest = all.filter(function(x){ return !(x.content && x.content.position === 'hero_top'); });
        var first = heroTop[0] || rest[0];
        var bg = (first && first.style && first.style.bgColor) || '#00BE5A';
        self.globalData.pageBg = bg;
        try { wx.setBackgroundColor({ backgroundColor: bg }); } catch (e) {}
      }
    });
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
    var cart = wx.getStorageSync('cart_v2') || [];
    var count = 0;
    cart.forEach(function(item) { count += item.quantity || 1; });
    if (count > 0) {
      wx.setTabBarBadge({ index: 2, text: String(count > 99 ? '99+' : count) }).catch(function(){});
    } else {
      wx.removeTabBarBadge({ index: 2 }).catch(function(){});
    }
  }
});

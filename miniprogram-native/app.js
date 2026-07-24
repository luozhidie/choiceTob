App({
  globalData: {
    userInfo: null,
    isVip: false,
    isPriceMember: false,       // 价格会员（可查看批发价）
    isCertifiedStoreOwner: false, // 认证店主
    isAdmin: false,             // 管理员预览模式（控制灰度功能是否可见）
  },

  onLaunch: function() {
    // ===== 图片域名代理：把 Supabase 存储图片改写到本站已白名单的 colour-choice.art 域名 =====
    // 微信小程序要求图片域名（downloadFile 合法域名）单独配置；本站域名 colour-choice.art 已配置，
    // 故将所有 Supabase 图片 URL 改写为 https://colour-choice.art/simg/... 由 Next.js 转发，
    // 这样小程序无需再为 Supabase 域名配置白名单。一处拦截覆盖全部页面的接口返回。
    (function() {
      function proxyUrl(u) {
        if (typeof u !== 'string') return u;
        u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
        u = u.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
        return u;
      }
      function walk(o) {
        if (o == null || typeof o !== 'object') {
          return typeof o === 'string' ? proxyUrl(o) : o;
        }
        if (Array.isArray(o)) {
          for (var i = 0; i < o.length; i++) o[i] = walk(o[i]);
          return o;
        }
        for (var k in o) {
          if (Object.prototype.hasOwnProperty.call(o, k)) o[k] = walk(o[k]);
        }
        return o;
      }
      var origRequest = wx.request.bind(wx);
      wx.request = function(opts) {
        if (opts && typeof opts.success === 'function') {
          var us = opts.success;
          opts.success = function(res) {
            try { if (res && res.data) res.data = walk(res.data); } catch (e) {}
            return us(res);
          };
        }
        return origRequest(opts);
      };
      if (wx.downloadFile) {
        var origDownload = wx.downloadFile.bind(wx);
        wx.downloadFile = function(opts) {
          if (opts && opts.url) opts.url = proxyUrl(opts.url);
          return origDownload(opts);
        };
      }
    })();

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
    // 恢复管理员状态
    var isAdmin = wx.getStorageSync('is_admin');
    if (isAdmin === true) {
      this.globalData.isAdmin = true;
    }
  },

  // 同步管理员状态（登录后调用）
  setAdminStatus: function(isAdmin) {
    this.globalData.isAdmin = !!isAdmin;
    wx.setStorageSync('is_admin', !!isAdmin);
  },

  // 检查是否拥有管理员预览权限（页面 onLoad 调用）
  checkAdminAccess: function() {
    var isAdmin = this.globalData.isAdmin || wx.getStorageSync('is_admin');
    if (!isAdmin) {
      wx.showToast({ title: '功能暂未开放', icon: 'none' });
      setTimeout(function() {
        wx.switchTab({ url: '/pages/home/index' });
      }, 1200);
      return false;
    }
    return true;
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

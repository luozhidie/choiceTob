Page({
  data: {
    userInfo: {},
    isVip: false
  },

  onShow: function() {
    this.checkLogin();
    this.checkVip();
  },

  checkLogin: function() {
    var that = this;
    wx.getSetting({
      success: function(res) {
        if (res.authSetting['scope.userInfo']) {
          // 已授权，获取用户信息
          wx.getUserInfo({
            success: function(userRes) {
              that.setData({ userInfo: userRes.userInfo || {} });
            }
          });
        } else {
          that.setData({ userInfo: {} });
        }
      },
      fail: function() {
        that.setData({ userInfo: {} });
      }
    });
  },

  checkVip: function() {
    var vip = wx.getStorageSync('vip_status') === 'active';
    this.setData({ isVip: vip });
  },

  doLogin: function() {
    var that = this;
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: function(res) {
        that.setData({ userInfo: res.userInfo });
        wx.showToast({ title: '登录成功', icon: 'success' });
        // TODO: 发送code到后端换取session
      },
      fail: function() {
        wx.showToast({ title: '取消登录', icon: 'none' });
      }
    });
  },

  goVip: function() { wx.showToast({ title: 'VIP功能开发中', icon: 'none' }); },

  goOrders: function(e) {
    var status = e.currentTarget.dataset.status;
    if (status) {
      wx.navigateTo({ url: '/pages/orders/index?status=' + status });
    } else {
      wx.navigateTo({
        url: '/pages/orders/index',
        fail: function() { wx.showToast({ title: '订单页开发中', icon: 'none' }); }
      });
    }
  },

  goFavorites: function() { wx.showToast({ title: '开发中', icon: 'none' }); },
  goHistory: function() { wx.showToast({ title: '开发中', icon: 'none' }); },
  goAddress: function() { wx.showToast({ title: '开发中', icon: 'none' }); },
  goContact: function() { wx.showModal({ title: '客服', content: '微信：luozhidie\n工作时间 9:00-18:00', showCancel: false, confirmText: '知道了' }); },
  goAbout: function() { wx.showModal({ title: '骆芷蝶智选', content: '版本 1.0.0\n服装门店一站式赋能平台', showCancel: false, confirmText: '知道了' }); }
})

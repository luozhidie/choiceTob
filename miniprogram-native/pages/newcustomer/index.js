var mp = require('../../utils/mp-page-copy.js');

Page({
  data: {
    pageCopy: {}
  },

  onLoad: function () {
    var self = this;
    mp.loadMpSection('newcustomer', function (copy) { self.setData({ pageCopy: copy }); });
  },

  claimRedPacket: function () {
    wx.showToast({ title: this.data.pageCopy.toast || '新客红包已放入卡券包', icon: 'success' });
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/home/index' });
  }
});

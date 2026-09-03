var app = getApp();
var guard = require('../../utils/agent-guard.js');
var mp = require('../../utils/mp-page-copy.js');

Page({
  data: {
    tryon: {}
  },

  onLoad: function () {
    if (!guard.guardAgentOnly()) return;
    var self = this;
    mp.loadMpSection('tryon', function (copy) { self.setData({ tryon: copy }); });
  },

  goLookStudio: function () {
    wx.navigateTo({ url: '/pages/look-studio/index' });
  },
});

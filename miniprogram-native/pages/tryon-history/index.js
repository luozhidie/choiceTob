var app = getApp();
var guard = require('../../utils/agent-guard.js');
var BASE = 'https://colour-choice.art';

Page({
  onLoad: function () {
  if (!guard.guardAgentOnly()) return;
  },

  data: { records: [], loading: true },

  onShow: function () { this.loadRecords(); },

  loadRecords: function () {
    var t = this;
    t.setData({ loading: true });
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/tryon/records?openid=' + encodeURIComponent(openid),
        success: function (r) {
          var d = r.data || {};
          var list = (d.records || []).map(function (x) {
            var dt = new Date(x.created_at);
            return {
              id: x.id,
              mode: x.mode,
              cloth_urls: x.cloth_urls || [],
              result_url: x.result_url,
              dateText: (dt.getMonth() + 1) + '月' + dt.getDate() + '日 ' +
                        String(dt.getHours()).padStart(2, '0') + ':' +
                        String(dt.getMinutes()).padStart(2, '0')
            };
          });
          t.setData({ records: list, loading: false });
        },
        fail: function () { t.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }); }
      });
    }).catch(function () {
      t.setData({ loading: false });
      wx.showToast({ title: '请先登录', icon: 'none' });
    });
  },

  preview: function (e) {
    var url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ urls: [url], current: url });
  }
});

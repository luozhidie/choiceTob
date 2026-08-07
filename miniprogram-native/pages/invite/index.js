var app = getApp();

Page({
  data: {
    loading: true,
    notLogin: false,
    invite_code: '',
    invite_link: '',
    invited_count: 0,
    rewards: []
  },

  onShow: function () { this.load(); },

  load: function () {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    if (!token) { t.setData({ loading: false, notLogin: true }); return; }
    t.setData({ loading: true, notLogin: false });
    wx.request({
      url: 'https://colour-choice.art/api/invite',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: function (r) {
        var d = (r.data || {}).data || {};
        t.setData({
          loading: false,
          invite_code: d.invite_code || '',
          invite_link: d.invite_link || '',
          invited_count: d.invited_count || 0,
          rewards: d.rewards || []
        });
      },
      fail: function () { t.setData({ loading: false }); }
    });
  },

  copyCode: function () {
    var code = this.data.invite_code;
    if (!code) return;
    wx.setClipboardData({
      data: code,
      success: function () { wx.showToast({ title: '邀请码已复制', icon: 'none' }); }
    });
  },

  copyLink: function () {
    var link = this.data.invite_link;
    if (!link) return;
    wx.setClipboardData({
      data: link,
      success: function () { wx.showToast({ title: '邀请链接已复制', icon: 'none' }); }
    });
  },

  sharePoster: function () {
    wx.showToast({ title: '点击右上角「···」转发给好友', icon: 'none' });
  },

  goLogin: function () { wx.navigateTo({ url: '/pages/login/index' }); },

  onPullDownRefresh: function () { this.load(); wx.stopPullDownRefresh(); }
});

var app = getApp();

// 群二维码在后台「站点图片管理」中编辑（site_assets.key = owner_group_qr），不在前端写死
Page({
  data: {
    qrUrl: '',
    qrError: false,
    claimed: false,
    notLogin: false,
    benefits: [
      { icon: '🍂', t: '秋冬上新预告', d: '新款提前看，抢先组货不上架' },
      { icon: '💰', t: '专属批发价', d: '认证店主解锁批发价与分级退换额度' },
      { icon: '🎁', t: '集财运任务', d: '进群即领 50 财运值，兑运费券' },
      { icon: '📣', t: '活动提前知', d: '平台活动与福利第一时间推送' }
    ]
  },

  onShow: function () {
    this.loadQr();
    var token = wx.getStorageSync('token') || '';
    if (!token) { this.setData({ notLogin: true }); }
  },

  // 从后台 site_assets 读取群二维码（owner_group_qr）
  loadQr: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/site-assets?keys=owner_group_qr',
      method: 'GET',
      success: function (r) {
        var map = (r.data || {}).data || {};
        var url = map.owner_group_qr || '';
        t.setData({ qrUrl: url, qrError: !url });
      },
      fail: function () {
        t.setData({ qrUrl: '', qrError: true });
      }
    });
  },

  onQrError: function () {
    this.setData({ qrError: true });
  },

  previewQr: function () {
    if (this.data.qrError || !this.data.qrUrl) return;
    wx.previewImage({ urls: [this.data.qrUrl] });
  },

  claim: function () {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    if (!token) { t.setData({ notLogin: true }); return; }
    wx.request({
      url: 'https://colour-choice.art/api/fortune',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token, 'content-type': 'application/json' },
      data: { action: 'complete-task', task_key: 'official_group' },
      success: function (r) {
        if (r.data && r.data.success) {
          t.setData({ claimed: true });
          wx.showToast({ title: '+50 财运值已到账', icon: 'none' });
          setTimeout(function () {
            if (getCurrentPages().length > 1) wx.navigateBack();
            else wx.switchTab({ url: '/pages/my/index' });
          }, 1200);
        } else if (r.data && r.data.already) {
          t.setData({ claimed: true });
          wx.showToast({ title: '已领取过', icon: 'none' });
        } else {
          wx.showToast({ title: (r.data && r.data.error) || '领取失败', icon: 'none' });
        }
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },

  goLogin: function () { wx.navigateTo({ url: '/pages/login/index' }); }
});

var app = getApp();
var BASE = 'https://colour-choice.art';

Page({
  data: {
    include: ['普通版全部功能', '21 题穿衣风格诊断', 'AI 按风格自动生成造型', '风格匹配 + 场合搭配建议'],
    toast: '',
  },

  onLoad: function () {
    app.getOpenid().catch(function () {});
  },

  showToast: function (txt) {
    this.setData({ toast: txt });
    var self = this;
    setTimeout(function () { self.setData({ toast: '' }); }, 2200);
  },

  buyPackage: function (e) {
    var id = e.currentTarget.dataset.id;
    var self = this;
    wx.showLoading({ title: '调起支付...' });
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/tryon/create',
        method: 'POST',
        data: { package_id: id, openid: openid },
        success: function (r) {
          wx.hideLoading();
          var d = r.data || {};
          if (d.error) { wx.showModal({ title: '下单失败', content: d.error, showCancel: false }); return; }
          wx.requestPayment({
            timeStamp: d.timeStamp, nonceStr: d.nonceStr, package: d.package,
            signType: d.signType || 'MD5', paySign: d.paySign,
            success: function () {
              wx.showToast({ title: '开通成功', icon: 'success' });
              setTimeout(function () { wx.redirectTo({ url: '/pages/look-studio/index?promo=1' }); }, 900);
            },
            fail: function (err) {
              if (err && err.errMsg && err.errMsg.indexOf('cancel') > -1) return;
              self.showToast('支付失败，请重试');
            }
          });
        },
        fail: function () { wx.hideLoading(); self.showToast('网络错误'); }
      });
    }).catch(function (e) {
      wx.hideLoading();
      wx.showModal({ title: '无法支付', content: e && e.message ? e.message : '获取登录态失败，请退出重试', showCancel: false });
    });
  },
});

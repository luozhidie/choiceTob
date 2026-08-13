var app = getApp();
var BASE = 'https://colour-choice.art';

// 与 look-studio /api/tryon/create 服务端定价保持一致
var PACKAGES = [
  { id: 'tryon_first_1yuan', name: '首单体验', price: 1, unit: '次', desc: '新人专享 1 次整体造型', type: 'first', days: 365, tries: 1, highlight: true },
  { id: 'tryon_monthly_99', name: '包月畅试', price: 99, unit: '月', desc: '30 天 150 次试穿 + 高清下载', type: 'month', days: 30, tries: 150 },
  { id: 'tryon_quarter_199', name: '季卡', price: 199, unit: '季', desc: '90 天 400 次 + 优先新款', type: 'quarter', days: 90, tries: 400 },
  { id: 'tryon_year_699', name: '年卡', price: 699, unit: '年', desc: '365 天 1000 次 + 专属顾问', type: 'year', days: 365, tries: 1000 },
];

function findPkg(id) {
  for (var i = 0; i < PACKAGES.length; i++) {
    if (PACKAGES[i].id === id) return PACKAGES[i];
  }
  return null;
}

Page({
  data: {
    packages: PACKAGES,
    toast: '',
  },

  onLoad: function () {
    // 静默预热 openid，提升后续支付响应速度
    app.getOpenid().catch(function () {});
  },

  showToast: function (txt) {
    this.setData({ toast: txt });
    var self = this;
    setTimeout(function () { self.setData({ toast: '' }); }, 2200);
  },

  // 新人首单 ¥1
  onFirstTry: function () {
    this.buyPackageById('tryon_first_1yuan');
  },

  // 开通专业版：默认包月
  onOpenPro: function () {
    this.buyPackageById('tryon_monthly_99');
  },

  // 点击套餐列表
  buyPackage: function (e) {
    var id = e.currentTarget.dataset.id;
    this.buyPackageById(id);
  },

  buyPackageById: function (id) {
    var pkg = findPkg(id);
    if (!pkg) return;
    var self = this;
    wx.showLoading({ title: '调起支付...' });
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/tryon/create',
        method: 'POST',
        data: { package_id: pkg.id, openid: openid },
        success: function (r) {
          wx.hideLoading();
          var d = r.data || {};
          if (d.error) { wx.showModal({ title: '下单失败', content: d.error, showCancel: false }); return; }
          wx.requestPayment({
            timeStamp: d.timeStamp,
            nonceStr: d.nonceStr,
            package: d.package,
            signType: d.signType || 'MD5',
            paySign: d.paySign,
            success: function () {
              wx.showToast({ title: '开通成功', icon: 'success' });
              // 支付成功后进入试衣间使用权益
              setTimeout(function () {
                wx.redirectTo({ url: '/pages/look-studio/index?promo=1' });
              }, 900);
            },
            fail: function (err) {
              if (err && err.errMsg && err.errMsg.indexOf('cancel') > -1) return;
              self.showToast('支付失败，请重试');
            }
          });
        },
        fail: function () {
          wx.hideLoading();
          self.showToast('网络错误');
        }
      });
    }).catch(function (e) {
      wx.hideLoading();
      wx.showModal({ title: '无法支付', content: e && e.message ? e.message : '获取登录态失败，请退出重试', showCancel: false });
    });
  },
});

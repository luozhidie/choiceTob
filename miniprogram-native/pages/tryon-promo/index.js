var app = getApp();
var BASE = 'https://colour-choice.art';

// 与 /api/tryon/create 服务端定价保持一致
var PACKAGES = [
  // 普通版
  { id: 'tryon_first_9_9',        name: '首单体验',  price: 9.9,  unit: '次', desc: '5 次普通试穿',                type: 'first',        days: 365, highlight: true },
  { id: 'tryon_normal_month_99',  name: '普通月卡',  price: 99,   unit: '月', desc: '30 天 100 次普通试穿',        type: 'normal_month',  days: 30 },
  // 专业版
  { id: 'tryon_pro_998',          name: '专业版',    price: 998,  unit: '次', desc: '100 次专业诊断 · 含风格测试', type: 'pro_pack',      days: 365, highlight: true },
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

  // 新人首单 ¥9.9
  onFirstTry: function () {
    this.buyPackageById('tryon_first_9_9');
  },

  // 底部「立即试穿」进入试衣间
  goLookStudio: function () {
    wx.navigateTo({ url: '/pages/look-studio/index' });
  },

  // 入口卡片跳转子页
  goSub: function (e) {
    var page = e.currentTarget.dataset.page;
    wx.navigateTo({ url: '/pages/' + page + '/index' });
  },

  buyPackage: function (e) {
    var id = e.currentTarget.dataset.id;
    this.buyPackageById(id);
  },

  buyPackageById: function (e) {
    var id = (typeof e === 'string') ? e : (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.id);
    if (!id) return;
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

var app = getApp();

var PLANS = [
  { id: "tryon_personal_basic", name: "个人基础版", price: 99, credits: 80, desc: "个人代购 / 导购起步", sub: "" },
  { id: "tryon_personal_pro", name: "个人进阶版", price: 199, credits: 200, desc: "高频试衣更划算", sub: "" },
  { id: "tryon_shop", name: "企业店铺版", price: 699, credits: 600, desc: "团队卖货 · 多账号", sub: "含 3 子账号" },
  { id: "tryon_brand", name: "企业品牌版", price: 1999, credits: 1500, desc: "规模化经营", sub: "含 10 子账号 + API" },
];

Page({
  data: { plans: PLANS, curCredits: 0, buying: false },

  onShow: function () { this.loadCredits(); },

  loadCredits: function () {
    var t = this;
    var token = wx.getStorageSync("token");
    if (!token) return;
    wx.request({
      url: "https://colour-choice.art/api/agent/me?token=" + token,
      success: function (r) {
        if (r.data && !r.data.error) t.setData({ curCredits: r.data.tryon_credits || 0 });
      },
    });
  },

  buy: function (e) {
    var t = this;
    var tier = e.currentTarget.dataset.tier;
    if (t.data.buying) return;
    t.setData({ buying: true });

    var token = wx.getStorageSync("token");
    if (!token) {
      wx.navigateTo({ url: "/pages/login/index" });
      t.setData({ buying: false });
      return;
    }

    wx.showLoading({ title: "调起支付..." });
    wx.request({
      url: "https://colour-choice.art/api/tryon/subscribe",
      method: "POST",
      data: { token: token, tier: tier },
      success: function (r) {
        wx.hideLoading();
        var d = r.data || {};
        if (d.error) {
          wx.showModal({ title: "下单失败", content: d.error, showCancel: false });
          t.setData({ buying: false });
          return;
        }
        var pm = d.jsapi;
        wx.requestPayment({
          timeStamp: pm.timeStamp,
          nonceStr: pm.nonceStr,
          package: pm.package,
          signType: pm.signType || "MD5",
          paySign: pm.paySign,
          success: function () {
            wx.showToast({ title: "开通成功", icon: "success" });
            t.loadCredits();
          },
          fail: function () { wx.showToast({ title: "支付取消", icon: "none" }); },
        });
        t.setData({ buying: false });
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: "网络错误", icon: "none" });
        t.setData({ buying: false });
      },
    });
  },
});

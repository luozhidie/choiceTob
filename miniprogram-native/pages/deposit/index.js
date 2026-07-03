Page({
  data: {
    plans: [
      { id: 'deposit_5w', name: '拿货会员·充5万', priceLabel: '充值 ¥50,000', discountLabel: '2.8折拿货', features: ['同色同款拿货三件起批','拿货折扣2.8折','退换额度5%'], highlight: false },
      { id: 'deposit_10w', name: '拿货会员·充10万', priceLabel: '充值 ¥100,000', discountLabel: '2.8折拿货', features: ['同色同款拿货三件起批','拿货折扣2.8折','退换额度10%'], highlight: true },
      { id: 'deposit_30w', name: '拿货会员·充30万', priceLabel: '充值 ¥300,000', discountLabel: '2.8折拿货', features: ['同色同款拿货三件起批','拿货折扣2.8折','退换额度20%'], highlight: false },
    ],
    isDeposit: false,
    refundRate: 0,
    showPay: false,
    selectedPlan: null,
  },

  onLoad: function () { this.checkLogin(); },
  checkLogin: function () {
    var that = this;
    wx.getSetting({
      success: function (r) {
        if (r.authSetting['scope.userInfo']) {
          that.setData({ isDeposit: true, refundRate: 10 });
        }
      }
    });
  },

  selectPlan: function (e) {
    var plan = e.currentTarget.dataset.plan;
    this.setData({ selectedPlan: plan, showPay: true });
  },

  closePay: function () {
    this.setData({ showPay: false, selectedPlan: null });
  },

  confirmPay: function () {
    var that = this;
    var plan = this.data.selectedPlan;
    if (!plan) return;
    wx.showLoading({ title: '正在调起支付' });
    wx.request({
      url: 'https://colour-choice.art/api/wechat-pay/unified-order',
      method: 'POST',
      data: {
        product_id: plan.id,
        product_title: plan.name,
        total_fee: plan.id === 'deposit_5w' ? 5000000 : (plan.id === 'deposit_10w' ? 10000000 : 30000000),
        quantity: 1,
        platform: 'mini',
      },
      success: function (r) {
        wx.hideLoading();
        var d = r.data || {};
        if (d.error) {
          wx.showModal({ title: '下单失败', content: d.error, showCancel: false });
          return;
        }
        var params = d.jsapi || d;
        wx.requestPayment({
          timeStamp: params.timestamp || params.timeStamp,
          nonceStr: params.nonceStr,
          package: params.package,
          signType: params.signType || 'RSA',
          paySign: params.paySign,
          success: function () {
            wx.showToast({ title: '支付成功', icon: 'success' });
            that.setData({ showPay: false, selectedPlan: null, isDeposit: true, refundRate: that.data.selectedPlan.id === 'deposit_5w' ? 5 : (that.data.selectedPlan.id === 'deposit_10w' ? 10 : 20) });
          },
          fail: function (err) {
            wx.showToast({ title: '支付取消', icon: 'none' });
          }
        });
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  noop: function () {},
});

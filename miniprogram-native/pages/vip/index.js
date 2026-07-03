Page({
  data: {
    activeTab: 'price',
    isMember: false,
    memberLabel: '',
    expireDate: '',
    pricePlans: [
      { id: 'price_trial', name: '价格会员·体验', priceLabel: '¥19.9', originalPrice: '', discountLabel: '14天', features: ['14天体验期','查看所有商品批发价','对比供货价与市场价差'], highlight: false },
      { id: 'price_1y', name: '价格会员·年卡', priceLabel: '¥399/年', originalPrice: '', discountLabel: '全年查看批发价', features: ['查看所有商品批发价','对比供货价与市场价差','爆款趋势预测数据'], highlight: true },
    ],
    depositPlans: [
      { id: 'wholesale_5w', name: '拿货会员·充5万', priceLabel: '充值 ¥50,000', discountLabel: '2.8折拿货', features: ['同色同款拿货三件起批','拿货折扣2.8折','退换额度5%'], highlight: false },
      { id: 'wholesale_10w', name: '拿货会员·充10万', priceLabel: '充值 ¥100,000', discountLabel: '2.8折拿货', features: ['同色同款拿货三件起批','拿货折扣2.8折','退换额度10%'], highlight: true },
    ],
    showPay: false,
    selectedPlan: null,
  },

  onLoad: function () { this.chkLogin(); },
  chkLogin: function () {
    var that = this;
    wx.getSetting({
      success: function (r) {
        if (r.authSetting['scope.userInfo']) {
          that.setData({ isMember: true, memberLabel: '价格会员', expireDate: '2027-07-03' });
        }
      }
    });
  },

  switchTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
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
    wx.showLoading({ title: '正在调起支付...' });
    // 调用后端创建支付订单
    wx.request({
      url: 'https://colour-choice.art/api/wechat-pay/unified-order',
      method: 'POST',
      data: {
        product_id: plan.id,
        product_title: plan.name,
        total_fee: plan.id.indexOf('price_') >= 0 ? (plan.id === 'price_trial' ? 1990 : 39900) : 5000000,
        quantity: 1,
        platform: 'native',
      },
      success: function (r) {
        wx.hideLoading();
        if (r.data && r.data.code_url) {
          // 微信内跳转
          if (/MicroMessenger/i.test(navigator.userAgent)) {
            window.location.href = r.data.code_url;
          } else {
            // 外部显示二维码
            that.setData({ qrUrl: r.data.code_url });
          }
        } else {
          wx.showToast({ title: '支付发起失败', icon: 'none' });
        }
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  noop: function () {},
});

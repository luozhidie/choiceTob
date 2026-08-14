Page({
  data: {
    benefits: [
      { icon: '📦', title: '满199包邮', desc: '首单满199全国包邮，偏远同享' },
      { icon: '🧥', title: '首单搭配指导', desc: '免费一次一衣多搭指导' },
      { icon: '🧧', title: '满399减30', desc: '注册即领新人专享红包' },
      { icon: '⚡', title: '优先发货', desc: '新人订单优先拣货极速发' }
    ],
    steps: [
      '注册并登录骆芷蝶智选账号',
      '浏览专场 / 分类，加入进货车',
      '结算时自动抵扣福利，优先发货'
    ]
  },

  onLoad: function () {
    // 可在此加载新人专享商品列表
  },

  claimRedPacket: function () {
    wx.showToast({ title: '新客红包已放入卡券包', icon: 'success' });
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/home/index' });
  }
});

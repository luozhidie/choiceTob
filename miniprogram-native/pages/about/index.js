// 关于我们
Page({
  data: {
    version: '1.0.0',
    advantages: [
      { icon: '🏭', title: '产业带直供', desc: '全国源头工厂直采' },
      { icon: '✨', title: '智能选品', desc: 'AI 搭配与企划辅助' },
      { icon: '👥', title: '认证会员', desc: '会员价一键解锁' },
      { icon: '🏅', title: '会员权益', desc: '折扣 + 退换额度' },
    ],
    businessScope: [
      '女装选品与搭配服务',
      '互联网平台技术服务',
      '个人形象设计与穿搭咨询',
      '服装买手选品与商品企划',
      '会员增值服务与认证会员体系',
    ],
  },

  goBack: function () {
    wx.navigateBack({ delta: 1 });
  },

  copyEmail: function () {
    wx.setClipboardData({ data: 'luozhidie@live.cn' });
  },

  callPhone: function () {
    wx.makePhoneCall({ phoneNumber: '13925997776' });
  },
});

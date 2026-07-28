// 关于我们
Page({
  data: {
    version: '1.0.0',
    advantages: [
      { icon: '🏭', title: '产业带直供', desc: '泉州源头工厂直采' },
      { icon: '✨', title: '智能选品', desc: 'AI 搭配与企划辅助' },
      { icon: '👥', title: '认证店主', desc: '批发价一键解锁' },
      { icon: '🏅', title: '会员权益', desc: '折扣 + 退换额度' },
    ],
    license: [
      { label: '经营者', value: '骆芷蝶' },
      { label: '经营场所', value: '福建省泉州市鲤城区' },
      { label: '经营范围', value: '服装批发、互联网销售、个人形象设计咨询等' },
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

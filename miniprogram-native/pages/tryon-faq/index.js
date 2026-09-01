var guard = require('../../utils/agent-guard.js');
Page({
  onLoad: function () {
  if (!guard.guardAgentOnly()) return;
  },

  data: {
    faqs: [
      { q: '照片会被保存或公开吗？', a: '不会。照片仅用于本次 AI 试衣合成，处理后不保留、不公开。', open: false },
      { q: '试衣效果能当真实试穿看吗？', a: 'AI 合成效果仅供参考，帮助你判断款式、颜色是否适合自己。', open: false },
      { q: '专业版可以随时取消吗？', a: '可以。到期不续费自动回到基础版，已购权益不受影响。', open: false },
      { q: '普通版和专业版能同时用吗？', a: '能。专业版包含普通版全部功能，开通专业版后两者权益合并计算。', open: false },
    ],
  },

  toggle: function (e) {
    var i = e.currentTarget.dataset.i;
    var key = 'faqs[' + i + '].open';
    this.setData({ [key]: !this.data.faqs[i].open });
  },
});

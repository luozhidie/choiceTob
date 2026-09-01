var app = getApp();
var guard = require('../../utils/agent-guard.js');

Page({
  onLoad: function () {
  if (!guard.guardAgentOnly()) return;
  },

  data: {
    steps: [
      { n: '1', t: '上传照片', d: '拍一张正面半身照。照片只用于本次 AI 合成，不会留存或公开。', tip: '光线均匀、背景干净，效果更准' },
      { n: '2', t: '挑选衣服', d: '从店铺里挑想试的款，或让 AI 按你的风格推荐。也能上传自己的衣服图。', tip: '一次可多选几件对比' },
      { n: '3', t: '生成上身图', d: '点「试穿」，AI 把衣服「穿」到你身上，约 30 秒出图。', tip: '普通版一键合成，专业版带风格诊断' },
      { n: '4', t: '看效果做决定', d: '上身图、颜色、版型一眼可见，喜欢再下单，不踩雷。', tip: '专业版还能看 AI 搭配建议' },
    ],
  },

  goLookStudio: function () {
    wx.navigateTo({ url: '/pages/look-studio/index' });
  },
});

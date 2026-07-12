Page({
  data: {
    heroImage: '',
    blocks: []
  },
  onLoad: function () {
    wx.setNavigationBarTitle({ title: '形象诊断' });
    this.loadConfig();
  },
  // 读取后台配置（Hero 大图 + 图片模块）
  loadConfig: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/site-assets?keys=diagnosis_hero,diagnosis_blocks',
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) {
          if (d.data.diagnosis_hero) t.setData({ heroImage: d.data.diagnosis_hero });
          if (d.data.diagnosis_blocks) {
            try {
              var list = JSON.parse(d.data.diagnosis_blocks);
              if (Array.isArray(list)) t.setData({ blocks: list });
            } catch (e) {}
          }
        }
      }
    });
  },
  // 智能形象诊断 ¥99 → 风格测试
  goTest: function () {
    wx.navigateTo({ url: '/pages/style-test/index' });
  },
  // 整体形象诊断 ¥190 → 在线课程
  goPaid: function () {
    wx.navigateTo({ url: '/pages/courses/index' });
  }
});

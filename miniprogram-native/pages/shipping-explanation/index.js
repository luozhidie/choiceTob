// 发货解释页：展示商品级发货信息 + 统一兜底说明
Page({
  data: {
    shipFrom: '',
    shipEstDate: '',
    shipDays: '',
    shipText: '',
  },

  onLoad: function (opt) {
    var from = decodeURIComponent(opt.from || '');
    var est = decodeURIComponent(opt.est || '');
    var days = decodeURIComponent(opt.days || '');
    var text = decodeURIComponent(opt.text || '');
    // 后台未填发货说明时，使用统一兜底文案
    if (!text) {
      text = '受限于真实面料短缺等影响，可能存在约15%不准确；' +
        (est ? est + '未发可取消' : '未按时发出可申请取消') + '。';
    }
    this.setData({
      shipFrom: from,
      shipEstDate: est,
      shipDays: days,
      shipText: text,
    });
  },

  goBack: function () { wx.navigateBack({ delta: 1 }); },
});

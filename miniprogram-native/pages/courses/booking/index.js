Page({
  data: {
    heroImage: '',
    booking: {
      title: '整体形象诊断',
      subtitle: '一次诊断 终身受益',
      price: 190,
      desc: '专业形象顾问一对一定制，找准显白本命色，锁定高级风格，越穿越显贵。',
      wechat: 'luozhidie',
      outline: ['风格诊断', '色彩诊断', '身材诊断', '生成报告']
    },
    booked: false
  },
  onLoad: function () {
    wx.setNavigationBarTitle({ title: '形象诊断预约' });
    this.loadConfig();
  },
  loadConfig: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/site-assets?keys=diagnosis_hero,diagnosis_booking',
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) {
          if (d.data.diagnosis_hero) t.setData({ heroImage: d.data.diagnosis_hero });
          if (d.data.diagnosis_booking) {
            try {
              var cfg = JSON.parse(d.data.diagnosis_booking);
              t.setData({ booking: Object.assign({
                title: '整体形象诊断', subtitle: '一次诊断 终身受益', price: 190,
                desc: '', wechat: 'luozhidie', outline: ['风格诊断', '色彩诊断', '身材诊断', '生成报告']
              }, cfg) });
            } catch (e) {}
          }
        }
      }
    });
  },
  goBook: function () {
    var wechat = this.data.booking.wechat || 'luozhidie';
    wx.showModal({
      title: '添加客服微信预约',
      content: '请添加客服微信：' + wechat + '\n备注「形象诊断」即可预约',
      confirmText: '复制微信',
      cancelText: '稍后',
      success: function (res) {
        if (res.confirm) {
          wx.setClipboardData({ data: wechat });
        }
      }
    });
  }
});

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
    pains: [
      '重要场合，总是没有衣服穿',
      '缺乏审美能力，衣品不好',
      '我缺气场、缺权威感？',
      '我正面临亲密关系危机',
      '花了不少钱，还是没有高级感',
      '缺乏异性缘，但是想找男/女朋友',
      '衣服种类选择太多了，不知道怎么选',
      '缺乏个人魅力，没有影响力',
      '认为形象不够特别，对自己的形象没有自信',
      '觉得自己可以更好，需要得到专业的定位',
      '想建立更好的第一印象，穿不出自己的内在品质',
      '买衣服很迷茫，不知道自己究竟适合什么衣服？',
      '衣橱爆满，却总是觉得没有衣服可以穿？',
      '买回来的衣服经常穿一两次就不穿了？',
      '在职场，总感觉形象衣品配不上自己能力和实力',
      '跟姐妹朋友聚会不知道穿什么甚至很自卑',
      '花大把的钱总是买到踩雷不适合自己的衣服'
    ],
    flow: [
      { t: '风格诊断', d: '找到你的天生风格调性' },
      { t: '色彩诊断', d: '锁定专属用色范围' },
      { t: '身材诊断', d: '扬长避短的体型方案' },
      { t: '生成报告', d: '一站式个人形象报告' }
    ],
    reports: [
      { t: '色彩报告', d: '面部明度/面部纯度/面部冷暖/色彩解析等' },
      { t: '身材报告', d: '身体廓形/身材特征/身材优缺点等' },
      { t: '风格报告', d: '风格印象/相似脸型/适合的穿搭等' },
      { t: '衣橱报告', d: '衣橱单品占比/衣橱科学占比/添置清单等' },
      { t: '星座报告', d: '心情/运势/事业/家庭/爱情等' }
    ],
    campTitle: 'AI赋能·服装精英销售特训营'
  },
  onLoad: function () {
    wx.setNavigationBarTitle({ title: '形象诊断' });
    this.loadConfig();
  },
  // 读取后台配置（Hero 大图 + 形象诊断预约）
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
  // 资料上传 → 色彩季型VS穿衣风格判断问卷
  goUpload: function () {
    wx.navigateTo({ url: '/pages/style-test/index?scene=personal' });
  },
  // 智能形象诊断 ¥99 → 风格测试（页内含 ¥99 购买）
  goTest: function () {
    wx.navigateTo({ url: '/pages/style-test/index' });
  },
  // 整体形象诊断 ¥190 → 形象诊断预约
  goPaid: function () {
    wx.navigateTo({ url: '/pages/courses/booking/index' });
  }
});

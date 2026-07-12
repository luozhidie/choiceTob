function pad(n) { return n < 10 ? '0' + n : '' + n; }
function formatDate(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }

Page({
  data: {
    consultantId: '',
    consultant: null,
    activeTab: '简介',
    tabs: ['全部时间', '简介', '评价(0)'],
    loading: true,
    followed: false
  },
  onLoad: function (options) {
    this.setData({ consultantId: options.consultant_id });
    this.loadFollowed();
    this.loadConsultant();
  },
  onShow: function () {
    this.loadFollowed();
  },
  onShareAppMessage: function () {
    var c = this.data.consultant;
    return { title: '推荐形象顾问：' + (c ? c.name : ''), path: '/pages/booking/consultant/index?consultant_id=' + this.data.consultantId };
  },
  loadFollowed: function () {
    var followed = wx.getStorageSync('followed_consultants') || [];
    this.setData({ followed: followed.indexOf(this.data.consultantId) >= 0 });
  },
  loadConsultant: function () {
    var t = this;
    t.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/consultants',
      success: function (r) {
        var list = (r.data && r.data.success && r.data.data) ? r.data.data : [];
        var c = list.find(function (x) { return x.id === t.data.consultantId; });
        if (c) {
          var d = new Date();
          var week = [];
          for (var i = 0; i < 14; i++) {
            var dt = new Date(d.getTime());
            dt.setDate(d.getDate() + i);
            week.push(formatDate(dt));
          }
          var weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          c.scheduleDays = week.map(function (day) {
            var r = 0;
            if (c.schedules && c.schedules[day]) {
              r = c.schedules[day].filter(function (s) { return s.status === 'available'; }).length;
            }
            var dt = new Date(day.replace(/-/g, '/'));
            return { date: day, label: day.slice(5) + '(' + weekMap[dt.getDay()] + ')', remain: r };
          });
        }
        t.setData({ consultant: c || null, loading: false });
      }
    });
  },
  switchTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },
  toggleFollow: function () {
    var id = this.data.consultantId;
    var followed = wx.getStorageSync('followed_consultants') || [];
    var idx = followed.indexOf(id);
    if (idx >= 0) followed.splice(idx, 1);
    else followed.push(id);
    wx.setStorageSync('followed_consultants', followed);
    this.setData({ followed: idx < 0 });
  },
  goTime: function (e) {
    var c = this.data.consultant;
    if (!c) return;
    var date = e.currentTarget.dataset.date;
    wx.navigateTo({ url: '/pages/booking/time/index?consultant_id=' + c.id + '&consultant_name=' + encodeURIComponent(c.name) + '&date=' + date });
  }
});

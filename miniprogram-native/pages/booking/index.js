function pad(n) { return n < 10 ? '0' + n : '' + n; }
function formatDate(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
function formatMD(dt) { return pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }

Page({
  data: {
    consultants: [],
    dates: [],
    activeDate: 'all',
    settings: { location: '泉州·鲤城服装批发市场', price_per_hour: 200, service_fee: 0, currency: '¥' },
    plans: [],
    loading: true,
    followed: [],
    shareConsultant: null
  },
  onLoad: function () {
    var app = getApp();
    if (app && app.checkAdminAccess && !app.checkAdminAccess()) return;
  },
  onShow: function () {
    var app = getApp();
    if (app && app.checkAdminAccess && !app.checkAdminAccess()) return;
    this.loadDates();
    this.loadFollowed();
    this.loadAll();
  },
  onShareAppMessage: function () {
    var c = this.data.shareConsultant;
    if (c && c.id) {
      return { title: '推荐形象顾问：' + c.name, path: '/pages/booking/consultant/index?consultant_id=' + c.id };
    }
    return { title: '预约陪购', path: '/pages/booking/index' };
  },
  loadDates: function () {
    var days = [{ key: 'all', week: '全部', md: '日期' }];
    var weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var d = new Date();
    for (var i = 0; i < 7; i++) {
      var dt = new Date(d.getTime());
      dt.setDate(d.getDate() + i);
      days.push({ key: formatDate(dt), week: i === 0 ? '今天' : (i === 1 ? '明天' : weekMap[dt.getDay()]), md: formatMD(dt) });
    }
    this.setData({ dates: days, activeDate: 'all' });
    this.decorate();
  },
  loadFollowed: function () {
    var followed = wx.getStorageSync('followed_consultants') || [];
    this.setData({ followed: followed });
  },
  decorate: function () {
    var active = this.data.activeDate;
    var d = new Date();
    var week = [];
    for (var i = 0; i < 7; i++) {
      var dt = new Date(d.getTime());
      dt.setDate(d.getDate() + i);
      week.push(formatDate(dt));
    }
    var weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var list = this.data.consultants.map(function (c) {
      var remain = 0;
      if (active !== 'all' && c.schedules && c.schedules[active]) {
        remain = c.schedules[active].filter(function (s) { return s.status === 'available'; }).length;
      }
      c.remain = remain;
      c.weekSchedule = week.map(function (day) {
        var r = 0;
        if (c.schedules && c.schedules[day]) {
          r = c.schedules[day].filter(function (s) { return s.status === 'available'; }).length;
        }
        var dt = new Date(day.replace(/-/g, '/'));
        return { date: day, label: day.slice(5) + '(' + weekMap[dt.getDay()] + ')', remain: r };
      });
      return c;
    });
    this.setData({ consultants: list });
  },
  loadAll: function () {
    var t = this;
    t.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/consultants',
      success: function (r) {
        var list = (r.data && r.data.success && r.data.data) ? r.data.data : [];
        t.setData({ consultants: list }, function () { t.decorate(); });
      },
      complete: function () {
        wx.request({
          url: 'https://colour-choice.art/api/public/booking-settings',
          success: function (r) {
            if (r.data && r.data.success && r.data.data) t.setData({ settings: r.data.data });
          }
        });
        wx.request({
          url: 'https://colour-choice.art/api/public/marketing-plans',
          success: function (r) {
            var plans = (r.data && r.data.success && r.data.data) ? r.data.data : [];
            t.setData({ plans: plans, loading: false });
          },
          fail: function () { t.setData({ loading: false }); }
        });
      }
    });
  },
  selectDate: function (e) {
    this.setData({ activeDate: e.currentTarget.dataset.key }, function () { this.decorate(); });
  },
  goTime: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    var date = e.currentTarget.dataset.date || this.data.activeDate;
    if (date === 'all') date = formatDate(new Date());
    wx.navigateTo({ url: '/pages/booking/time/index?consultant_id=' + id + '&consultant_name=' + encodeURIComponent(name) + '&date=' + date });
  },
  goConsultant: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/booking/consultant/index?consultant_id=' + id });
  },
  toggleFollow: function (e) {
    var id = e.currentTarget.dataset.id;
    var followed = this.data.followed.slice();
    var idx = followed.indexOf(id);
    if (idx >= 0) followed.splice(idx, 1);
    else followed.push(id);
    wx.setStorageSync('followed_consultants', followed);
    this.setData({ followed: followed });
  },
  setShareData: function (e) {
    this.setData({
      shareConsultant: { id: e.currentTarget.dataset.id, name: e.currentTarget.dataset.name }
    });
  },
  goMy: function () {
    wx.navigateTo({ url: '/pages/booking/my/index' });
  },
  goPlan: function (e) {
    var p = e.currentTarget.dataset.plan;
    wx.showModal({ title: p.title, content: (p.description || '') + (p.price ? '\n价格：¥' + p.price : ''), showCancel: false });
  }
});

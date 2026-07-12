Page({
  data: {
    consultants: [],
    dates: [],
    activeDate: '',
    settings: { location: '泉州·鲤城服装批发市场', price_per_hour: 200, service_fee: 0, currency: '¥' },
    plans: [],
    loading: true
  },
  onShow: function () {
    this.loadDates();
    this.loadAll();
  },
  loadDates: function () {
    var days = [];
    var weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var d = new Date();
    for (var i = 0; i < 7; i++) {
      var dt = new Date(d.getTime());
      dt.setDate(d.getDate() + i);
      var mm = dt.getMonth() + 1;
      var dd = dt.getDate();
      var label = (i === 0 ? '今天' : (i === 1 ? '明天' : weekMap[dt.getDay()]));
      days.push({
        date: dt.getFullYear() + '-' + (mm < 10 ? '0' + mm : mm) + '-' + (dd < 10 ? '0' + dd : dd),
        week: label,
        md: (mm < 10 ? '0' + mm : mm) + '-' + (dd < 10 ? '0' + dd : dd)
      });
    }
    this.setData({ dates: days, activeDate: days[0].date });
    this.decorate();
  },
  decorate: function () {
    var date = this.data.activeDate;
    var list = this.data.consultants.map(function (c) {
      var remain = 0;
      if (c.schedules && c.schedules[date]) {
        remain = c.schedules[date].filter(function (s) { return s.status === 'available'; }).length;
      }
      c.remain = remain;
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
    this.setData({ activeDate: e.currentTarget.dataset.date }, function () { this.decorate(); });
  },
  goTime: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    wx.navigateTo({ url: '/pages/booking/time/index?consultant_id=' + id + '&consultant_name=' + encodeURIComponent(name) + '&date=' + this.data.activeDate });
  },
  goMy: function () {
    wx.navigateTo({ url: '/pages/booking/my/index' });
  },
  goPlan: function (e) {
    var p = e.currentTarget.dataset.plan;
    wx.showModal({ title: p.title, content: (p.description || '') + (p.price ? '\n价格：¥' + p.price : ''), showCancel: false });
  }
});

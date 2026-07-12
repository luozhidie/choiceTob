Page({
  data: {
    consultantId: '',
    consultantName: '',
    consultant: null,
    date: '',
    slots: [],
    selected: [],
    settings: { location: '泉州·鲤城服装批发市场', price_per_hour: 200, service_fee: 0, currency: '¥' },
    coupon: '',
    total: 0
  },
  onLoad: function (options) {
    this.setData({
      consultantId: options.consultant_id,
      consultantName: decodeURIComponent(options.consultant_name || ''),
      date: options.date
    });
    this.loadSettings();
    this.loadSlots();
  },
  loadSettings: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/booking-settings',
      success: function (r) {
        if (r.data && r.data.success && r.data.data) {
          t.setData({ settings: r.data.data }, function () { t.computeTotal(); });
        } else {
          t.computeTotal();
        }
      },
      fail: function () { t.computeTotal(); }
    });
  },
  loadSlots: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/consultants',
      success: function (r) {
        var list = (r.data && r.data.success && r.data.data) ? r.data.data : [];
        var c = list.find(function (x) { return x.id === t.data.consultantId; });
        if (c) t.setData({ consultant: c, consultantName: c.name });
        if (c && c.schedules && c.schedules[t.data.date]) {
          t.setData({ slots: c.schedules[t.data.date] });
        } else {
          var def = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
          t.setData({ slots: def.map(function (tm) { return { time: tm, status: 'available' }; }) });
        }
      }
    });
  },
  toggleSlot: function (e) {
    var time = e.currentTarget.dataset.time;
    var status = e.currentTarget.dataset.status;
    if (status === 'rest') return;
    var selected = this.data.selected.slice();
    var idx = selected.indexOf(time);
    if (idx >= 0) selected.splice(idx, 1);
    else selected.push(time);
    this.setData({ selected: selected }, function () { this.computeTotal(); });
  },
  onCoupon: function (e) {
    this.setData({ coupon: e.detail.value });
  },
  computeTotal: function () {
    var price = Number(this.data.settings.price_per_hour) || 0;
    var fee = Number(this.data.settings.service_fee) || 0;
    var total = price * this.data.selected.length + fee;
    this.setData({ total: total });
  },
  submit: function () {
    if (this.data.selected.length === 0) {
      wx.showToast({ title: '请选择预约时间', icon: 'none' });
      return;
    }
    var params = [
      'consultant_id=' + this.data.consultantId,
      'consultant_name=' + encodeURIComponent(this.data.consultantName),
      'date=' + this.data.date,
      'slots=' + encodeURIComponent(JSON.stringify(this.data.selected)),
      'location=' + encodeURIComponent(this.data.settings.location),
      'price_per_hour=' + this.data.settings.price_per_hour,
      'service_fee=' + this.data.settings.service_fee,
      'coupon=' + encodeURIComponent(this.data.coupon),
      'total=' + this.data.total
    ].join('&');
    wx.navigateTo({ url: '/pages/booking/form/index?' + params });
  }
});

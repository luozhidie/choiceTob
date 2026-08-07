Page({
  data: {
    consultant_id: '',
    consultant_name: '',
    date: '',
    slots: [],
    location: '',
    price_per_hour: 0,
    service_fee: 0,
    coupon: '',
    total: 0,
    form: { name: '', phone: '', note: '' },
    submitting: false
  },
  onLoad: function (options) {
    var slots = [];
    try { slots = JSON.parse(decodeURIComponent(options.slots || '[]')); } catch (e) {}
    this.setData({
      consultant_id: options.consultant_id,
      consultant_name: decodeURIComponent(options.consultant_name || ''),
      date: options.date,
      slots: slots,
      location: decodeURIComponent(options.location || ''),
      price_per_hour: Number(options.price_per_hour) || 0,
      service_fee: Number(options.service_fee) || 0,
      coupon: decodeURIComponent(options.coupon || ''),
      total: Number(options.total) || 0
    });
  },
  setF: function (k, v) {
    var f = this.data.form; f[k] = v;
    this.setData({ form: f });
  },
  onName: function (e) { this.setF('name', e.detail.value); },
  onPhone: function (e) { this.setF('phone', e.detail.value); },
  onNote: function (e) { this.setF('note', e.detail.value); },
  submit: function () {
    var t = this;
    var f = this.data.form;
    if (!f.name.trim()) { wx.showToast({ title: '请填写姓名', icon: 'none' }); return; }
    if (!f.phone.trim()) { wx.showToast({ title: '请填写手机号', icon: 'none' }); return; }
    if (t.data.submitting) return;
    t.setData({ submitting: true });
    var slots = t.data.slots.map(function (tm) { return { time: tm, status: 'available' }; });
    wx.request({
      url: 'https://colour-choice.art/api/public/bookings',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: {
        consultant_id: t.data.consultant_id,
        consultant_name: t.data.consultant_name,
        user_name: f.name.trim(),
        phone: f.phone.trim(),
        date: t.data.date,
        slots: slots,
        location: t.data.location,
        price_per_hour: t.data.price_per_hour,
        service_fee: t.data.service_fee,
        coupon: t.data.coupon,
        note: f.note,
        total_amount: t.data.total
      },
      success: function (r) {
        if (r.data && r.data.success) {
          var localList = wx.getStorageSync('booking_list') || [];
          localList.unshift({
            id: Date.now(),
            consultant_name: t.data.consultant_name,
            date: t.data.date,
            slots: t.data.slots,
            location: t.data.location,
            price_per_hour: t.data.price_per_hour,
            service_fee: t.data.service_fee,
            total: t.data.total,
            name: f.name.trim(),
            phone: f.phone.trim(),
            note: f.note,
            status: '待确认',
            created_at: new Date().toISOString()
          });
          wx.setStorageSync('booking_list', localList);
          wx.showToast({ title: '预约已提交', icon: 'success' });
          setTimeout(function () {
            wx.redirectTo({ url: '/pages/booking/my/index' });
          }, 600);
        } else {
          wx.showToast({ title: (r.data && r.data.error) || '提交失败', icon: 'none' });
          t.setData({ submitting: false });
        }
      },
      fail: function () {
        wx.showToast({ title: '网络错误', icon: 'none' });
        t.setData({ submitting: false });
      }
    });
  }
});

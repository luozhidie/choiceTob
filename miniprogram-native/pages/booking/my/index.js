Page({
  data: {
    list: [],
    filter: '全部',
    tabs: ['全部', '待确认', '已确认', '已完成', '已取消']
  },
  onShow: function () {
    this.load();
  },
  load: function () {
    var list = wx.getStorageSync('booking_list') || [];
    this.setData({ list: list });
  },
  setFilter: function (e) {
    this.setData({ filter: e.currentTarget.dataset.f });
  },
  cancel: function (e) {
    var id = e.currentTarget.dataset.id;
    var list = this.data.list.map(function (x) {
      if (x.id === id) x.status = '已取消';
      return x;
    });
    wx.setStorageSync('booking_list', list);
    this.setData({ list: list });
    wx.showToast({ title: '已取消', icon: 'none' });
  }
});

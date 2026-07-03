Page({
  data: {
    looks: [],
    loading: true,
    isVip: false,
  },

  onLoad: function () { this.checkVip(); this.loadLooks(); },

  checkVip: function () {
    var that = this;
    wx.getSetting({
      success: function (r) {
        if (r.authSetting['scope.userInfo']) {
          that.setData({ isVip: true });
        }
      }
    });
  },

  loadLooks: function () {
    var that = this;
    that.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/looks?limit=30',
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data;
        var looks = list.map(function (l) {
          return {
            id: l.id,
            title: l.title,
            description: l.description,
            image1: l.image1 || l.cover_image,
            image2: l.image2 || '',
            tags: (l.tags || '').split(',').filter(Boolean),
          };
        });
        that.setData({ looks: looks, loading: false });
      },
      fail: function () { that.setData({ loading: false }); }
    });
  },

  goVip: function () {
    wx.navigateTo({ url: '/pages/vip/index' });
  },
});

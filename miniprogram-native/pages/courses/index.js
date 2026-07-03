Page({
  data: {
    activeCat: 'all',
    courses: [],
    loading: true,
  },

  onLoad: function () { this.loadCourses(); },

  loadCourses: function () {
    var that = this;
    that.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/courses?limit=50',
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data || [];
        var cat = that.data.activeCat;
        if (cat !== 'all') {
          list = list.filter(function (c) { return c.category === cat; });
        }
        // 格式化
        var courses = list.map(function (c) {
          var price = c.price || 0;
          if (price >= 100) price = Math.round(price / 100);
          return {
            id: c.id,
            title: c.title,
            description: c.description,
            cover: c.cover_image,
            price: price,
            priceLabel: price > 0 ? price : '',
            studyCount: c.study_count || 0,
            duration: c.duration_label || '',
            category: c.category,
          };
        });
        that.setData({ courses: courses, loading: false });
      },
      fail: function () { that.setData({ loading: false }); }
    });
  },

  switchCat: function (e) {
    this.setData({ activeCat: e.currentTarget.dataset.cat });
    this.loadCourses();
  },

  playCourse: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '课程详情',
      content: '课程播放页开发中，请联系客服\n微信：luozhidie',
      showCancel: false,
    });
  },
});

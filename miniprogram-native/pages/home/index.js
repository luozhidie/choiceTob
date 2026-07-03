Page({
  data: {
    // 大屏Banner数据
    banners: [
      {
        id: 1,
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
        title: '骆芷蝶供应链智选平台',
        subtitle: '服装门店一站式赋能平台',
        url: ''
      },
      {
        id: 2,
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
        title: '爆款选品 · 拿货精选',
        subtitle: '专业买手团队严选',
        url: '/pages/buyer/index'
      },
      {
        id: 3,
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
        title: 'VIP会员专享价',
        subtitle: '3件以上触发进货会员折扣',
        url: '/pages/my/index'
      }
    ],
    categories: ['全部', '穿搭', '护肤', '彩妆', '养生', '食品', '家居', '文创'],
    activeCategory: '全部',
    products: [],
    loading: true
  },

  onLoad: function() {
    this.loadProducts();
    this.loadBanners();
  },

  onPullDownRefresh: function() {
    var that = this;
    this.loadProducts(function() { wx.stopPullDownRefresh(); });
  },

  /* ===== 加载Banner ===== */
  loadBanners: function() {
    var that = this;
    // 尝试从API获取banner
    wx.request({
      url: 'https://colour-choice.art/api/public/banners',
      method: 'GET',
      success: function(res) {
        if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          that.setData({ banners: res.data.data });
        }
      },
      fail: function() {
        // 使用默认banner数据，静默失败
      }
    });
  },

  goBannerLink: function(e) {
    var url = e.currentTarget.dataset.url;
    if (!url) return;

    if (url.startsWith('/') || url.startsWith('pages')) {
      if (url.indexOf('switchTab') !== -1 || ['home','buyer','cart','my'].indexOf(url.split('/')[2]) !== -1) {
        wx.switchTab({ url: url });
      } else {
        wx.navigateTo({ url: url });
      }
    }
  },

  /* ===== 加载商品 ===== */
  loadProducts: function(callback) {
    var that = this;
    that.setData({ loading: true });

    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=20',
      method: 'GET',
      success: function(res) {
        var list = [];
        if (res.data && res.data.success && res.data.data) {
          list = res.data.data || [];
        } else if (Array.isArray(res.data)) {
          list = res.data;
        }

        list.forEach(function(p) {
          var priceNum = Number(p.price) || 0;
          if (priceNum >= 100) priceNum = Math.round(priceNum / 100);
          p.priceText = '\u00A5' + (priceNum % 1 === 0 ? priceNum.toString() : priceNum.toFixed(2));
          p.is_hot = p.is_hot || false;
          p.is_new = p.is_new || false;
        });

        that.setData({ products: list, loading: false });
      },
      fail: function(err) {
        console.error('加载商品失败:', err);
        that.setData({ loading: false });
      },
      complete: function() {
        if (callback) callback();
      }
    });
  },

  switchCategory: function(e) {
    var cat = e.currentTarget.dataset.cat;
    this.setData({ activeCategory: cat });
    // TODO: 根据分类筛选
  },

  goBuyer: function() { wx.switchTab({ url: '/pages/buyer/index' }); },
  goCourses: function() { wx.showToast({ title: '课程开发中', icon: 'none' }); },
  goLooks: function() { wx.showToast({ title: '搭配开发中', icon: 'none' }); },
  goMy: function() { wx.switchTab({ url: '/pages/my/index' }); },

  goShop: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: '/pages/shop/index?id=' + id,
        fail: function() { wx.showToast({ title: '商品详情开发中', icon: 'none' }); }
      });
    }
  }
})

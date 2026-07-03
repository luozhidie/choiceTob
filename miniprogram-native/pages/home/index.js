Page({
  data: {
    categories: ['全部', '穿搭', '护肤', '彩妆', '养生', '食品', '家居', '文创'],
    activeCategory: '全部',
    products: [],
    loading: true
  },

  onLoad: function() {
    this.loadProducts();
  },

  onShow: function() {
    // 每次显示时刷新购物车数量（如果有全局状态）
  },

  onPullDownRefresh: function() {
    this.loadProducts(function() {
      wx.stopPullDownRefresh();
    });
  },

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
        } else if (res.data && Array.isArray(res.data)) {
          list = res.data;
        } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
          list = res.data.data;
        }

        // 格式化价格 + 添加标签
        list.forEach(function(p, i) {
          var priceNum = Number(p.price) || 0;
          if (priceNum >= 100) {
            priceNum = Math.round(priceNum / 100);
          }
          p.priceText = (priceNum % 1 === 0 ? priceNum.toString() : priceNum.toFixed(2));
          p.priceText = '\u00A5' + p.priceText;
          // 随机添加热门/新品标签（模拟）
          p.is_hot = i < 3;
          p.is_new = i >= 3 && i < 6;
        });

        that.setData({ products: list });
      },
      fail: function() {
        console.error('加载商品失败');
      },
      complete: function() {
        that.setData({ loading: false });
        if (callback) callback();
      }
    });
  },

  switchCategory: function(e) {
    var cat = e.currentTarget.dataset.cat;
    if (!cat) cat = e.detail; // 兼容直接传值调用
    this.setData({ activeCategory: cat });
    // TODO: 根据分类筛选商品，目前先显示全部
  },

  goBuyer: function() {
    wx.switchTab({ url: '/pages/buyer/index' });
  },

  goCourses: function() {
    wx.showToast({ title: '课程开发中', icon: 'none' });
  },

  goLooks: function() {
    wx.showToast({ title: '搭配开发中', icon: 'none' });
  },

  goMy: function() {
    wx.switchTab({ url: '/pages/my/index' });
  },

  goShop: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: '/pages/shop/index?id=' + id,
        fail: function() {
          wx.showToast({ title: '商品详情开发中', icon: 'none' });
        }
      });
    }
  }
})

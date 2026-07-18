Page({
  data: {
    shelfId: '',
    block: null,
    products: [],
    allProducts: [],
    loading: true,
    keyword: '',
    activeSort: '综合',
    subCategory: '',
    subCategories: [],
    showFilter: false,
    minPrice: '',
    maxPrice: '',
    isPriceMember: false,
  },

  onLoad: function (opt) {
    var app = getApp();
    var id = opt.id || '';
    this.setData({
      shelfId: id,
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner')
    });
    if (id) this.loadShelf();
  },

  goBack: function () {
    wx.navigateBack({ delta: 1, fail: function () { wx.switchTab({ url: '/pages/home/index' }); } });
  },

  goHome: function () {
    wx.switchTab({ url: '/pages/home/index' });
  },

  goShop: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/shop/index?id=' + id });
  },

  loadShelf: function () {
    var t = this;
    var id = t.data.shelfId;
    t.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/blocks?id=' + encodeURIComponent(id),
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (!d.success || !d.data) {
          wx.showToast({ title: '货架不存在', icon: 'none' });
          t.setData({ loading: false });
          return;
        }
        var block = d.data;
        t.setData({ block: block });
        t.loadProducts(block);
      },
      fail: function () {
        wx.showToast({ title: '加载失败', icon: 'none' });
        t.setData({ loading: false });
      }
    });
  },

  loadProducts: function (block) {
    var t = this;
    var content = block.content || {};
    var fetched = [];

    var productIds = content.productIds || '';
    var category = content.category || '';
    var tags = content.tags || '';

    var ids = productIds.split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    var done = function (list) {
      // 应用子分类 / 标签过滤（仅非指定商品时）
      var tagList = (tags || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!productIds) {
        list = list.filter(function (p) {
          if (content.subcategory && p.subcategory !== content.subcategory && p.sub_category !== content.subcategory) {
            return false;
          }
          if (tagList.length > 0) {
            var pTags = p.tags || [];
            return tagList.some(function (tag) { return pTags.indexOf(tag) >= 0; });
          }
          return true;
        });
      }
      list.forEach(function (p) {
        var n = Number(p.price) || 0;
        if (n >= 100) n = Math.round(n / 100);
        var wp = Number(p.wholesale_price) || 0;
        if (wp >= 100) wp = Math.round(wp / 100);
        if (t.data.isPriceMember && wp > 0) {
          p.priceText = '\u00A5' + (wp % 1 === 0 ? wp : wp.toFixed(2));
          p.wholesalePriceText = '';
        } else {
          p.priceText = '\u00A5' + (n % 1 === 0 ? n : n.toFixed(2));
          // 非会员不暴露批发价，统一打码
          p.wholesalePriceText = wp > 0 ? '\u00A5???' : '';
        }
      });
      // 提取子分类
      var subSet = {};
      list.forEach(function (p) { if (p.subcategory) subSet[p.subcategory] = 1; });
      t.setData({
        allProducts: list,
        products: list,
        subCategories: Object.keys(subSet),
        loading: false
      });
    };

    if (ids.length > 0) {
      wx.request({
        url: 'https://colour-choice.art/api/public/products?ids=' + ids.join(',') + '&limit=' + ids.length,
        method: 'GET',
        success: function (r) {
          var data = r.data || {};
          if (data.success && data.data) {
            fetched = ids.map(function (id) {
              return data.data.find(function (p) { return p.id === id; });
            }).filter(Boolean);
          }
          done(fetched);
        },
        fail: function () { done([]); }
      });
    } else if (category) {
      wx.request({
        url: 'https://colour-choice.art/api/public/products?limit=200&category=' + encodeURIComponent(category),
        method: 'GET',
        success: function (r) {
          var data = r.data || {};
          if (data.success && data.data) fetched = data.data;
          done(fetched);
        },
        fail: function () { done([]); }
      });
    } else if (tags) {
      wx.request({
        url: 'https://colour-choice.art/api/public/products?limit=200',
        method: 'GET',
        success: function (r) {
          var data = r.data || {};
          if (data.success && data.data) fetched = data.data;
          done(fetched);
        },
        fail: function () { done([]); }
      });
    } else {
      wx.request({
        url: 'https://colour-choice.art/api/public/products?limit=200',
        method: 'GET',
        success: function (r) {
          var data = r.data || {};
          if (data.success && data.data) fetched = data.data;
          done(fetched);
        },
        fail: function () { done([]); }
      });
    }
  },

  onKeywordChange: function (e) {
    this.setData({ keyword: e.detail.value });
    this.applyFilter();
  },

  onSort: function (e) {
    var tab = e.currentTarget.dataset.tab;
    if (tab === '筛选') {
      this.setData({ showFilter: !this.data.showFilter });
    } else {
      this.setData({ activeSort: tab, showFilter: false });
    }
    this.applyFilter();
  },

  onSubCategory: function (e) {
    this.setData({ subCategory: e.currentTarget.dataset.sub });
    this.applyFilter();
  },

  onMinPrice: function (e) {
    this.setData({ minPrice: e.detail.value });
    this.applyFilter();
  },

  onMaxPrice: function (e) {
    this.setData({ maxPrice: e.detail.value });
    this.applyFilter();
  },

  resetFilter: function () {
    this.setData({ minPrice: '', maxPrice: '', subCategory: '', showFilter: false });
    this.applyFilter();
  },

  applyFilter: function () {
    var t = this;
    var list = t.data.allProducts.slice();
    var kw = t.data.keyword.trim().toLowerCase();
    var sub = t.data.subCategory;
    var min = t.data.minPrice ? Number(t.data.minPrice) : null;
    var max = t.data.maxPrice ? Number(t.data.maxPrice) : null;
    var sort = t.data.activeSort;

    if (kw) {
      list = list.filter(function (p) {
        var text = (p.title || p.name || '') + ' ' + (p.description || '');
        var tags = p.tags || [];
        return text.toLowerCase().indexOf(kw) >= 0 || tags.some(function (tag) { return tag.toLowerCase().indexOf(kw) >= 0; });
      });
    }

    if (sub) {
      list = list.filter(function (p) { return p.subcategory === sub || p.sub_category === sub; });
    }

    if (min !== null || max !== null) {
      list = list.filter(function (p) {
        var price = p.price || 0;
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
        return true;
      });
    }

    if (sort === '销量') {
      list.sort(function (a, b) { return (b.sales || 0) - (a.sales || 0); });
    } else if (sort === '上新') {
      list.sort(function (a, b) {
        var at = a.created_at ? new Date(a.created_at).getTime() : 0;
        var bt = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bt - at;
      });
    } else if (sort === '批发价') {
      list.sort(function (a, b) {
        var ap = a.wholesale_price || a.price || 0;
        var bp = b.wholesale_price || b.price || 0;
        return ap - bp;
      });
    }

    t.setData({ products: list });
  },
});

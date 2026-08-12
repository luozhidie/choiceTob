Page({
  data: {
    shelfId: '',
    block: null,
    products: [],
    allProducts: [],
    loading: true,
    keyword: '',
    subCategory: '',
    subCategories: [],
    filterCategory: '',
    filterQuery: '',
    sortType: 'default',
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
        var content = block.content || {};
        t.setData({
          block: block,
          filterCategory: content.category || ''
        });
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
    block = block || t.data.block;
    if (!block) return;
    t._block = block;

    var content = block.content || {};
    var productIds = content.productIds || '';
    var category = content.category || '';
    var tags = content.tags || '';
    var extra = t.data.filterQuery || '';
    var keepOrder = t.data.sortType === 'default';

    var ids = productIds.split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    t.setData({ loading: true });

    var done = function (list) {
      // 版块自带的子分类 / 标签约束（仅在未指定商品 ID 时生效）
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
      // 提取子分类（首次加载时才刷新，避免筛选后标签消失）
      var subSet = {};
      list.forEach(function (p) {
        var sc = p.subcategory || p.sub_category;
        if (sc) subSet[sc] = 1;
      });
      var subs = Object.keys(subSet);
      var patch = { allProducts: list, loading: false };
      if (subs.length && !t.data.subCategories.length) patch.subCategories = subs;
      t.setData(patch, function () { t.applyLocal(); });
    };

    if (ids.length > 0) {
      wx.request({
        url: 'https://colour-choice.art/api/public/products?ids=' + ids.join(',') + '&limit=' + ids.length + extra,
        method: 'GET',
        success: function (r) {
          var data = r.data || {};
          var fetched = [];
          if (data.success && data.data) {
            if (keepOrder) {
              fetched = ids.map(function (id) {
                return data.data.find(function (p) { return p.id === id; });
              }).filter(Boolean);
            } else {
              fetched = data.data;
            }
          }
          done(fetched);
        },
        fail: function () { done([]); }
      });
      return;
    }

    var url = 'https://colour-choice.art/api/public/products?limit=200' + extra;
    if (category) url += '&category=' + encodeURIComponent(category);
    wx.request({
      url: url,
      method: 'GET',
      success: function (r) {
        var data = r.data || {};
        done((data.success && data.data) ? data.data : []);
      },
      fail: function () { done([]); }
    });
  },

  /* 筛选栏回调：服务端筛选参数变了就重新拉数据 */
  onFilterChange: function (e) {
    var d = e.detail || {};
    var t = this;
    var needReload = (d.query || '') !== t.data.filterQuery;
    t.setData({
      filterQuery: d.query || '',
      sortType: d.sortType || 'default',
      subCategory: d.subCategory || ''
    });
    if (needReload) t.loadProducts();
    else t.applyLocal();
  },

  onKeywordChange: function (e) {
    this.setData({ keyword: e.detail.value });
    this.applyLocal();
  },

  /* 本地过滤：关键词 + 子分类 */
  applyLocal: function () {
    var t = this;
    var list = (t.data.allProducts || []).slice();
    var kw = (t.data.keyword || '').trim().toLowerCase();
    var sub = t.data.subCategory;

    if (kw) {
      list = list.filter(function (p) {
        var text = (p.title || p.name || '') + ' ' + (p.description || '');
        var tags = p.tags || [];
        return text.toLowerCase().indexOf(kw) >= 0 || tags.some(function (tag) { return String(tag).toLowerCase().indexOf(kw) >= 0; });
      });
    }
    if (sub) {
      list = list.filter(function (p) { return p.subcategory === sub || p.sub_category === sub; });
    }
    t.setData({ products: list });
  },
});

Page({
  data: {
    id: '',
    loading: true,
    plan: null,          // 方案基础信息 + marketing
    items: [],           // 品类进度
    categories: [],      // 品类名列表（用于 tab）
    activeCat: '全部',
    products: [],        // 当前品类下商品
    allProducts: [],     // 全量商品（按 tab 过滤）
    totalTarget: 0,
    totalUploaded: 0,
    overall: 0,
    yuan: function (n) { return n ? (n / 100).toFixed(2) : '0'; },
  },

  onLoad: function (opt) {
    var id = opt.id || '';
    this.setData({ id: id });
    this.loadPlan();
    this.loadProducts();
  },

  loadPlan: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/assortment/' + t.data.id + '/progress',
      method: 'GET',
      success: function (r) {
        if (!r.data || !r.data.success || !r.data.data) { t.setData({ loading: false }); return; }
        var d = r.data.data;
        var cats = (d.items || []).map(function (it) { return it.category; });
        t.setData({
          loading: false,
          plan: d,
          items: d.items || [],
          categories: cats,
          activeCat: '全部',
          totalTarget: d.total_target || 0,
          totalUploaded: d.total_uploaded || 0,
          overall: d.overall_progress || 0,
        });
        t.filterProducts(t.data.allProducts, '全部');
      },
      fail: function () { t.setData({ loading: false }); },
    });
  },

  loadProducts: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=500',
      method: 'GET',
      success: function (r) {
        var l = [];
        if (r.data && r.data.success && r.data.data) l = r.data.data || [];
        else if (Array.isArray(r.data)) l = r.data;
        // 价格转元
        l.forEach(function (p) {
          var price = Number(p.price) || 0;
          var wp = Number(p.wholesale_price) || 0;
          p.priceText = '¥' + (price ? (price / 100).toFixed(2) : '0');
          p.wholesaleText = wp ? '批发 ¥' + (wp / 100).toFixed(2) : '';
        });
        t.setData({ allProducts: l });
        t.filterProducts(l, t.data.activeCat);
      },
    });
  },

  filterProducts: function (list, cat) {
    var shown = cat === '全部' ? list : list.filter(function (p) { return p.category === cat; });
    this.setData({ products: shown, activeCat: cat });
  },

  swCat: function (e) {
    var c = e.currentTarget.dataset.c;
    this.filterProducts(this.data.allProducts, c);
  },

  goShop: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/shop/index?id=' + id });
  },

  goBuyer: function () {
    wx.switchTab({ url: '/pages/buyer/index' });
  },
});

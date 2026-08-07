Page({
  data: {
    tabs: [
      { key: 'wardrobe', label: 'VIP衣橱', icon: '👗' },
      { key: 'shop', label: '商城单品', icon: '🛍️' },
      { key: 'fav', label: '我的收藏', icon: '⭐' },
      { key: 'history', label: '搭配历史', icon: '📜' }
    ],
    activeTab: 'shop',
    scenes: ['职场', '休闲', '社交', '旅游'],
    scene: '休闲',
    name: '',
    selected: [],
    keyword: '',
    products: [],
    loading: false,
    wardrobeItems: [],
    favItems: []
  },
  onShow: function () {
    this.loadLocalSources();
    if (this.data.activeTab === 'shop') {
      this.searchProducts();
    }
  },
  loadLocalSources: function () {
    var wardrobe = wx.getStorageSync('wardrobe_items') || [];
    this.setData({
      wardrobeItems: wardrobe.map(function (x) { return { id: 'w_' + x.id, img: x.img, name: x.name, type: 'wardrobe' }; })
    });
    this.loadFavorites();
  },
  loadFavorites: function () {
    var t = this;
    var favs = wx.getStorageSync('favorites') || [];
    if (favs.length === 0) { t.setData({ favItems: [] }); return; }
    t.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=50',
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data;
        list = list.filter(function (p) { return favs.indexOf(p.id) >= 0; });
        var mapped = list.map(function (p) {
          return { id: 'f_' + p.id, img: p.image_url || p.cover_image || p.image, name: p.title || p.name, type: 'fav' };
        }).filter(function (x) { return x.img; });
        t.setData({ favItems: mapped });
      },
      complete: function () { t.setData({ loading: false }); }
    });
  },
  onName: function (e) {
    this.setData({ name: e.detail.value });
  },
  setScene: function (e) {
    this.setData({ scene: e.currentTarget.dataset.scene });
  },
  switchTab: function (e) {
    var key = e.currentTarget.dataset.key;
    if (key === 'history') {
      wx.navigateTo({ url: '/pages/wardrobe/outfits/index' });
      return;
    }
    this.setData({ activeTab: key });
    if (key === 'shop' && this.data.products.length === 0) {
      this.searchProducts();
    }
    if (key === 'fav') {
      this.loadFavorites();
    }
  },
  onSearch: function (e) {
    this.setData({ keyword: e.detail.value });
  },
  searchProducts: function () {
    var t = this;
    t.setData({ loading: true });
    var url = 'https://colour-choice.art/api/public/products?limit=50';
    if (t.data.keyword) url += '&keyword=' + encodeURIComponent(t.data.keyword);
    wx.request({
      url: url,
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.success && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data;
        var mapped = list.map(function (p) {
          return {
            id: 's_' + p.id,
            img: p.image_url || p.cover_image || p.image,
            name: p.name || p.title,
            type: 'shop'
          };
        }).filter(function (x) { return x.img; });
        t.setData({ products: mapped });
      },
      complete: function () { t.setData({ loading: false }); }
    });
  },
  addItem: function (e) {
    var id = e.currentTarget.dataset.id;
    var img = e.currentTarget.dataset.img;
    var name = e.currentTarget.dataset.name;
    if (!img) return;
    var selected = this.data.selected.slice();
    if (selected.find(function (x) { return x.id === id; })) return;
    if (selected.length >= 9) {
      wx.showToast({ title: '最多 9 件', icon: 'none' });
      return;
    }
    selected.push({ id: id, img: img, name: name || '' });
    this.setData({ selected: selected });
  },
  removeItem: function (e) {
    var id = e.currentTarget.dataset.id;
    var selected = this.data.selected.filter(function (x) { return x.id !== id; });
    this.setData({ selected: selected });
  },
  save: function () {
    if (this.data.selected.length === 0) {
      wx.showToast({ title: '请先选择单品', icon: 'none' });
      return;
    }
    var outfits = wx.getStorageSync('outfits_list') || [];
    var imgs = this.data.selected.map(function (x) { return x.img; });
    outfits.unshift({
      id: Date.now(),
      name: this.data.name.trim() || '未命名搭配',
      scene: this.data.scene,
      images: imgs,
      cover: imgs[0],
      date: '刚刚'
    });
    wx.setStorageSync('outfits_list', outfits);
    wx.showToast({ title: '创建搭配成功', icon: 'success' });
    setTimeout(function () {
      wx.navigateTo({ url: '/pages/wardrobe/outfits/index' });
    }, 500);
  }
});

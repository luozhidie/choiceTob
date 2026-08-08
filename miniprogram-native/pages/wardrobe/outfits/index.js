Page({
  data: {
    scenes: [
      { key: '职场', icon: '💼' },
      { key: '休闲', icon: '🛋️' },
      { key: '社交', icon: '🥂' },
      { key: '旅游', icon: '🧳' }
    ],
    outfits: [],
    counts: {},
    selectedScene: ''
  },
  onShow: function () {
    this.loadOutfits();
  },
  loadOutfits: function () {
    var outfits = wx.getStorageSync('outfits_list') || [];
    var counts = { 职场: 0, 休闲: 0, 社交: 0, 旅游: 0 };
    outfits.forEach(function (o) {
      if (counts[o.scene] !== undefined) counts[o.scene] += 1;
    });
    this.setData({ outfits: outfits, counts: counts });
  },
  openScene: function (e) {
    this.setData({ selectedScene: e.currentTarget.dataset.scene });
  },
  backHub: function () {
    this.setData({ selectedScene: '' });
  },
  goCreate: function () {
    wx.navigateTo({ url: '/pages/wardrobe/create/index' });
  },
  delOutfit: function (e) {
    var id = e.currentTarget.dataset.id;
    var outfits = this.data.outfits.filter(function (x) { return x.id !== id; });
    wx.setStorageSync('outfits_list', outfits);
    this.setData({ outfits: outfits });
    this.loadOutfits();
    wx.showToast({ title: '已删除', icon: 'none' });
  }
});

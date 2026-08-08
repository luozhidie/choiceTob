var app = getApp();

Page({
  data: {
    loading: true,
    loggedIn: false,
    items: [],
    removingId: '',
  },

  onShow: function () {
    var token = wx.getStorageSync('token') || '';
    this.setData({ loggedIn: !!token });
    if (token) this.loadWishes();
    else this.setData({ loading: false, items: [] });
  },

  loadWishes: function () {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    if (!token) { this.setData({ loggedIn: false, loading: false }); return; }
    this.setData({ loading: true });
    wx.request({
      url: 'https://colour-choice.art/api/wishlist',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: function (r) {
        var d = r.data || {};
        if (d.success) {
          var items = (d.items || []).map(function (it) {
            var price = Number(it.price) || 0;
            if (price >= 100) price = Math.round(price / 100);
            it.priceLabel = price > 0 ? ('¥' + (price % 1 === 0 ? price : price.toFixed(2))) : '价格待定';
            return it;
          });
          t.setData({ items: items });
        }
      },
      complete: function () { t.setData({ loading: false }); }
    });
  },

  removeWish: function (e) {
    var id = e.currentTarget.dataset.id;
    var t = this;
    var token = wx.getStorageSync('token') || '';
    if (!token) return;
    t.setData({ removingId: id });
    wx.request({
      url: 'https://colour-choice.art/api/wishlist',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      data: { product_id: id, action: 'remove' },
      success: function (r) {
        var d = r.data || {};
        if (d.success) {
          t.setData({ items: t.data.items.filter(function (i) { return i.id !== id; }) });
          wx.showToast({ title: '已移出', icon: 'none' });
        }
      },
      complete: function () { t.setData({ removingId: '' }); }
    });
  },

  goBack: function () { wx.navigateBack({ delta: 1 }); },
  goLogin: function () { wx.navigateTo({ url: '/pages/login/index' }); },
  goShop: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/shop/index?id=' + id });
  },
  goBuyer: function () { wx.switchTab({ url: '/pages/buyer/index' }); },
});

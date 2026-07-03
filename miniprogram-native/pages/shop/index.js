Page({
  data: {
    productId: '',
    product: null,
    images: [],
    priceText: '',
    originalPriceText: '',
    quantity: 1,
    cartCount: 0,
  },

  onLoad: function (opt) {
    this.setData({ productId: opt.id || '' });
    this.loadProduct(opt.id);
    this.loadCartCount();
  },

  loadProduct: function (id) {
    var that = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=1&id=' + id,
      method: 'GET',
      success: function (r) {
        var p = null;
        if (r.data && r.data.data && r.data.data.length > 0) p = r.data.data[0];
        else if (Array.isArray(r.data)) p = r.data[0];
        if (!p) return;
        var images = [];
        if (p.image_url) images.push(p.image_url);
        if (p.images && Array.isArray(p.images)) images = images.concat(p.images);
        if (images.length === 0) images = [''];
        var price = Number(p.price) || 0;
        if (price >= 100) price = Math.round(price / 100);
        var ori = p.original_price ? Number(p.original_price) : 0;
        if (ori >= 100) ori = Math.round(ori / 100);
        that.setData({
          product: p,
          images: images,
          priceText: price ? '¥' + (price % 1 === 0 ? price : price.toFixed(2)) : '¥0',
          originalPriceText: ori ? '¥' + (ori % 1 === 0 ? ori : ori.toFixed(2)) : '',
        });
      },
    });
  },

  loadCartCount: function () {
    var cart = wx.getStorageSync('cart') || [];
    var count = 0;
    cart.forEach(function (item) { count += (item.quantity || 1); });
    this.setData({ cartCount: count });
  },

  inc: function () {
    var q = this.data.quantity + 1;
    this.setData({ quantity: q });
  },

  dec: function () {
    var q = this.data.quantity - 1;
    if (q < 1) q = 1;
    this.setData({ quantity: q });
  },

  addCart: function () {
    var that = this;
    var p = this.data.product;
    if (!p) return;
    var cart = wx.getStorageSync('cart') || [];
    var idx = -1;
    cart.forEach(function (item, i) { if (item.id === p.id) idx = i; });
    if (idx >= 0) {
      cart[idx].quantity = (cart[idx].quantity || 1) + that.data.quantity;
    } else {
      cart.push({ id: p.id, title: p.title || p.name, price: p.price, image: p.image_url || '', quantity: that.data.quantity });
    }
    wx.setStorageSync('cart', cart);
    that.loadCartCount();
    wx.showToast({ title: '已加购物车', icon: 'success' });
  },

  buyNow: function () {
    var p = this.data.product;
    if (!p) return;
    // 直接跳转微信支付（调 order API）
    wx.showToast({ title: '正在调起支付...', icon: 'loading', duration: 2000 });
    // TODO: 调用微信支付统一下单接口
    setTimeout(function () {
      wx.showModal({
        title: '功能开发中',
        content: '支付功能正在对接，请联系客服下单\n微信：luozhidie',
        showCancel: false,
      });
    }, 1500);
  },

  goCart: function () {
    wx.switchTab({ url: '/pages/cart/index' });
  },
});

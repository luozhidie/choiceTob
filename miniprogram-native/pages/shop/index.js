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
    var that = this;
    var p = this.data.product;
    if (!p) return;
    wx.showLoading({ title: "正在调起支付" });
    wx.request({
      url: "https://colour-choice.art/api/wechat-pay/unified-order",
      method: "POST",
      header: { "Content-Type": "application/json" },
      data: {
        product_id: p.id,
        product_title: p.title || p.name,
        total_fee: p.price,
        quantity: that.data.quantity,
        platform: "mini",
      },
      success: function (r) {
        wx.hideLoading();
        var d = r.data || {};
        if (d.error) {
          wx.showModal({ title: "下单失败", content: d.error, showCancel: false });
          return;
        }
        var params = d.jsapi || d;
        wx.requestPayment({
          timeStamp: params.timestamp || params.timeStamp,
          nonceStr: params.nonceStr,
          package: params.package,
          signType: params.signType || "RSA",
          paySign: params.paySign,
          success: function () {
            wx.showToast({ title: "支付成功", icon: "success" });
            setTimeout(function () { wx.navigateBack(); }, 1500);
          },
          fail: function (err) {
            wx.showToast({ title: "支付取消", icon: "none" });
          }
        });
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: "网络错误", icon: "none" });
      }
    });
  },
      data: {
        product_id: p.id,
        product_title: p.title || p.name,
        total_fee: p.price,
        quantity: that.data.quantity,
      },
      success: function (r) {
        wx.hideLoading();
        if (r.data && r.data.order_no) {
          // 2. 调用微信支付
          var orderNo = r.data.order_no;
          wx.requestPayment({
            timeStamp: r.data.timeStamp,
            nonceStr: r.data.nonceStr,
            package: r.data.package,
            signType: r.data.signType,
            paySign: r.data.paySign,
            success: function () {
              wx.showToast({ title: '支付成功', icon: 'success' });
              setTimeout(function () { wx.navigateBack(); }, 1500);
            },
            fail: function (err) {
              wx.showToast({ title: '支付取消', icon: 'none' });
            }
          });
        } else {
          // 降级：显示收款二维码
          that.showQrCode(r.data && r.data.code_url);
        }
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '下单失败', icon: 'none' });
      }
    });
  },

  showQrCode: function (codeUrl) {
    if (!codeUrl) {
      wx.showModal({ title: '支付指南', content: '请在电脑端访问 colour-choice.art 完成支付\n或联系客服：luozhidie', showCancel: false });
      return;
    }
    // 复制链接让用户用微信扫
    wx.setClipboardData({
      data: codeUrl,
      success: function () {
        wx.showModal({ title: '已复制支付链接', content: '请在微信中打开此链接完成支付\n或截图二维码给客服', showCancel: false });
      }
    });
  },

  goCart: function () {
    wx.switchTab({ url: '/pages/cart/index' });
  },
});

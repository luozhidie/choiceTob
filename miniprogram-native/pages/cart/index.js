Page({
  data: {
    cartItems: [],
    loading: true,
    allChecked: false,
    selectedCount: 0,
    totalCount: 0,
    totalPrice: '¥0.00'
  },

  onShow: function() {
    this.loadCart();
  },

  loadCart: function() {
    var cart = wx.getStorageSync('cart') || [];
    cart.forEach(function(item) {
      if (item.checked === undefined) item.checked = false;
      if (!item.quantity) item.quantity = 1;
      /* 统一价格格式：分→元 + 加¥前缀 */
      var p = Number(item.price) || 0;
      if (p >= 100) { p = Math.round(p / 100); item.price = p; }
      item.priceDisplay = '¥' + (p % 1 === 0 ? p : p.toFixed(2));
    });
    this.setData({ cartItems: cart, loading: false });
    this.recalc();
  },

  recalc: function() {
    var items = this.data.cartItems;
    var total = 0;
    var selected = 0;
    var count = 0;
    items.forEach(function(item) {
      count += (item.quantity || 1);
      if (item.checked) {
        selected += (item.quantity || 1);
        var p = Number(item.price || 0);
        /* 防御：如果价格>=100说明是分单位（数据库原始值），需转元 */
        if (p >= 100) p = Math.round(p / 100);
        total += p * (item.quantity || 1);
      }
    });
    var all = items.length > 0 && items.every(function(i){ return i.checked; });
    this.setData({
      allChecked: all,
      selectedCount: selected,
      totalCount: count,
      totalPrice: '¥' + total.toFixed(2)
    });
  },

  toggleCheck: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.slice();
    items.forEach(function(item){ if(item.id===id) item.checked=!item.checked; });
    this.setData({ cartItems: items });
    wx.setStorageSync('cart', items);
    this.recalc();
  },

  toggleAllCheck: function() {
    var newAll = !this.data.allChecked;
    var items = this.data.cartItems.slice();
    items.forEach(function(item){ item.checked = newAll; });
    this.setData({ cartItems: items, allChecked: newAll });
    wx.setStorageSync('cart', items);
    this.recalc();
  },

  increaseQty: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.slice();
    items.forEach(function(item){ if(item.id===id) item.quantity = (item.quantity||1)+1; });
    this.setData({ cartItems: items });
    wx.setStorageSync('cart', items);
    this.recalc();
  },

  decreaseQty: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.slice();
    items.forEach(function(item){ if(item.id===id && item.quantity>1) item.quantity -= 1; });
    this.setData({ cartItems: items });
    wx.setStorageSync('cart', items);
    this.recalc();
  },

  removeItem: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示', content: '确定删除该商品？',
      success: function(res) {
        if (res.confirm) {
          var items = that.data.cartItems.filter(function(i){ return i.id !== id; });
          that.setData({ cartItems: items });
          wx.setStorageSync('cart', items);
          that.recalc();
        }
      }
    });
  },

  clearCart: function() {
    var that = this;
    if (that.data.cartItems.length === 0) return;
    wx.showModal({
      title: '提示', content: '确定清空购物车？',
      success: function(res) {
        if (res.confirm) {
          that.setData({ cartItems: [] });
          wx.removeStorageSync('cart');
          that.recalc();
        }
      }
    });
  },

  goBuyer: function() { wx.switchTab({ url: '/pages/buyer/index' }); },

  goCheckout: function() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请先选择商品', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/checkout/index' });
  }
});

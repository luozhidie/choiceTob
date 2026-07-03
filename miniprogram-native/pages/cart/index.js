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
    // 每次显示时刷新购物车
    this.loadCart();
  },

  loadCart: function() {
    var cart = wx.getStorageSync('cart') || [];
    cart.forEach(function(item) {
      if (!item.checked) item.checked = false;
      if (!item.quantity) item.quantity = 1;
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
        var priceStr = String(item.price || '¥0').replace('¥', '');
        total += Number(priceStr) * (item.quantity || 1);
      }
    });

    var allCheck = items.length > 0 && items.every(function(i) { return i.checked; });

    this.setData({
      allChecked: allCheck,
      selectedCount: selected,
      totalCount: count,
      totalPrice: '\u00A5' + total.toFixed(2)
    });
  },

  toggleCheck: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.slice();
    items.forEach(function(item) {
      if (item.id === id) item.checked = !item.checked;
    });
    this.setData({ cartItems: items });
    wx.setStorageSync('cart', items);
    this.recalc();
  },

  toggleAllCheck: function() {
    var newAll = !this.data.allChecked;
    var items = this.data.cartItems.slice();
    items.forEach(function(item) { item.checked = newAll; });
    this.setData({ cartItems: items, allChecked: newAll });
    wx.setStorageSync('cart', items);
    this.recalc();
  },

  increaseQty: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.slice();
    items.forEach(function(item) {
      if (item.id === id) item.quantity = (item.quantity || 1) + 1;
    });
    this.setData({ cartItems: items });
    wx.setStorageSync('cart', items);
    this.recalc();
  },

  decreaseQty: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.slice();
    items.forEach(function(item) {
      if (item.id === id && item.quantity > 1) item.quantity -= 1;
    });
    this.setData({ cartItems: items });
    wx.setStorageSync('cart', items);
    this.recalc();
  },

  removeItem: function(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定删除该商品？',
      success: function(res) {
        if (res.confirm) {
          var items = that.data.cartItems.filter(function(item) { return item.id !== id; });
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
      title: '提示',
      content: '确定清空购物车？',
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
    wx.showToast({ title: '结算功能开发中', icon: 'none' });
  }
})

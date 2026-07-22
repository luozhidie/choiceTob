Page({
  data: {
    cartItems: [],
    loading: true,
    allChecked: false,
    selectedCount: 0,
    totalCount: 0,
    totalPrice: '¥0.00',
    pageBgColor: '',
    pageBgImage: '',
    pageBgStyle: 'background:#faf8f6;',
    popupCfg: null,
    popupVisible: false
  },

  onShow: function() {
    this.loadCart();
    this.loadPageBg();
    this.loadPopup();
  },

  /* 营销弹窗：首次进入自动弹，关闭后不再弹 */
  loadPopup: function() {
    var t = this;
    if (t.data.popupVisible) return;
    wx.request({
      url: 'https://colour-choice.art/api/public/popups?page=cart',
      method: 'GET',
      success: function(r) {
        var list = [];
        if (r.data && r.data.success && Array.isArray(r.data.data)) list = r.data.data;
        if (!list.length) return;
        var seen = wx.getStorageSync('popup_seen_ids') || {};
        var pending = null;
        for (var i = 0; i < list.length; i++) {
          if (!seen[list[i].id]) { pending = list[i]; break; }
        }
        if (pending) t.setData({ popupCfg: pending, popupVisible: true });
      }
    });
  },
  onPopupClose: function() {
    var t = this;
    var cfg = t.data.popupCfg;
    if (cfg && cfg.id) {
      var seen = wx.getStorageSync('popup_seen_ids') || {};
      seen[cfg.id] = Date.now();
      wx.setStorageSync('popup_seen_ids', seen);
    }
    t.setData({ popupVisible: false });
  },
  onPopupButtonTap: function(e) {
    var t = this;
    var link = (e && e.detail && e.detail.link) || '';
    t.onPopupClose();
    if (!link) return;
    var tabPages = ['pages/home/index','pages/buyer/index','pages/cart/index','pages/my/index'];
    var isTab = tabPages.some(function(p){ return link.indexOf(p) !== -1; });
    if (isTab) wx.switchTab({ url: '/' + link.replace(/^\//,'') });
    else wx.navigateTo({ url: '/' + link.replace(/^\//,''), fail: function(){ wx.switchTab({ url: '/pages/buyer/index' }); } });
  },

  /* 后台「页面背景」配置：购物车页 */
  loadPageBg: function() {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/page-background',
      method: 'GET',
      success: function(r) {
        var d = r.data;
        if (!d || !d.success || !d.data) return;
        var c = d.data.cart || {};
        var color = c.color || '#faf8f6';
        var img = c.image || '';
        var style = img
          ? ('background:' + color + ';background-image:url(\'' + img + '\');background-size:cover;background-position:center;')
          : ('background:' + color + ';');
        t.setData({ pageBgColor: color, pageBgImage: img, pageBgStyle: style });
      }
    });
  },

  loadCart: function() {
    var app = getApp();
    var isPriceMember = !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner');
    var cart = wx.getStorageSync('cart_v2') || [];
    cart.forEach(function(item) {
      if (item.checked === undefined) item.checked = false;
      if (!item.quantity) item.quantity = 1;
      /* 会员（含认证店主）按批发价展示，否则零售价 */
      var rp = Number(item.price) || 0;
      var wp = Number(item.wholesale_price) || 0;
      var effCents = (isPriceMember && wp > 0) ? wp : rp;
      var p = effCents >= 100 ? Math.round(effCents / 100) : effCents;
      item.priceDisplay = '¥' + (p % 1 === 0 ? p : p.toFixed(2));
    });
    this.setData({ cartItems: cart, loading: false });
    this.recalc();
  },

  recalc: function() {
    var app = getApp();
    var isPriceMember = !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner');
    var items = this.data.cartItems;
    var total = 0;
    var selected = 0;
    var count = 0;
    items.forEach(function(item) {
      count += (item.quantity || 1);
      if (item.checked) {
        selected += (item.quantity || 1);
        var rp = Number(item.price || 0);
        var wp = Number(item.wholesale_price || 0);
        var effCents = (isPriceMember && wp > 0) ? wp : rp;
        var p = effCents >= 100 ? Math.round(effCents / 100) : effCents;
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
    wx.setStorageSync('cart_v2', items);
    this.recalc();
  },

  toggleAllCheck: function() {
    var newAll = !this.data.allChecked;
    var items = this.data.cartItems.slice();
    items.forEach(function(item){ item.checked = newAll; });
    this.setData({ cartItems: items, allChecked: newAll });
    wx.setStorageSync('cart_v2', items);
    this.recalc();
  },

  increaseQty: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.slice();
    items.forEach(function(item){ if(item.id===id) item.quantity = (item.quantity||1)+1; });
    this.setData({ cartItems: items });
    wx.setStorageSync('cart_v2', items);
    this.recalc();
  },

  decreaseQty: function(e) {
    var id = e.currentTarget.dataset.id;
    var items = this.data.cartItems.slice();
    items.forEach(function(item){ if(item.id===id && item.quantity>1) item.quantity -= 1; });
    this.setData({ cartItems: items });
    wx.setStorageSync('cart_v2', items);
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
          wx.setStorageSync('cart_v2', items);
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
          wx.removeStorageSync('cart_v2');
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

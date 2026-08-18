var app = getApp();
var BASE = 'https://colour-choice.art';

function fmtYuan(cents) {
  if (cents == null) return '0';
  var y = Math.round(cents) / 100;
  return y % 1 === 0 ? String(y) : y.toFixed(2);
}
function fmtDiscount(rate) {
  if (!rate || rate >= 1) return '零售价';
  var z = Math.round(rate * 1000) / 100;
  return (z % 1 === 0 ? z.toFixed(0) : z.toFixed(1)) + '折';
}
function fmtRate(r) {
  if (!r) return '0%';
  return Math.round(r * 100) + '%';
}
function fmtDate(s) {
  if (!s) return '';
  var d = new Date(s);
  return (d.getMonth() + 1) + '-' + d.getDate();
}

Page({
  data: {
    loading: true,
    notLogin: false,
    notAgent: false,
    isAdmin: false,
    token: '',
    tab: 'home', // home | customers | sales | orders | material
    // 身份
    isDepositAgent: false,
    isCertified: false,
    fullName: '',
    storeName: '',
    discountRate: 1,
    returnRate: 0,
    depositAmount: 0,
    inviteCode: '',
    // 业绩
    customerCount: 0,
    orderCount: 0,
    gmv: 0,
    // 收益
    walletBalance: 0,
    profitSummary: { totalProfit: 0, settledProfit: 0, pendingProfit: 0 },
    // 自定义卖价
    priceList: [],
    // 客户管理
    customers: [],
    customerPage: 1,
    customerMore: true,
    // 收益明细
    salesList: [],
    salesFilter: 'all',
    salesPage: 1,
    salesMore: true,
    // 订单物流
    orderList: [],
    orderPage: 1,
    orderMore: true,
    // 商品素材
    materialList: [],
    // 弹窗
    showEdit: false,
    editIndex: -1,
    editItem: null,
    editPrice: '',
    savingPrice: false,
    showWithdraw: false,
    withdrawAmt: '',
    submittingWithdraw: false,
    withdrawals: []
  },

  onShow: function () {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    if (!token) {
      t.setData({ notLogin: true, loading: false });
      return;
    }
    var isAdmin = wx.getStorageSync('is_admin') || false;
    t.setData({ token: token, notLogin: false, isAdmin: isAdmin, loading: true, tab: 'home' });
    t.loadAll();
  },

  loadAll: function () {
    var t = this;
    var token = t.data.token;
    var h = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };

    wx.request({
      url: BASE + '/api/agent/me', method: 'GET', header: h,
      success: function (r) {
        var d = r.data || {};
        if (d.error) {
          if (d.error.indexOf('未登录') >= 0) t.setData({ notLogin: true, loading: false });
          return;
        }
        var isAdmin = t.data.isAdmin;
        if (!d.active && !d.isAdmin && !isAdmin) {
          t.setData({ notAgent: true, loading: false });
          return;
        }
        t.setData({
          isDepositAgent: !!d.isDepositAgent,
          isCertified: !!d.isCertified,
          fullName: d.fullName || '',
          storeName: d.storeName || '',
          discountRate: d.discountRate || 1,
          returnRate: d.returnRate || 0,
          depositAmount: d.depositAmount || 0,
          inviteCode: d.inviteCode || '',
          customerCount: (d.performance && d.performance.customerCount) || 0,
          orderCount: (d.performance && d.performance.orderCount) || 0,
          gmv: (d.performance && d.performance.gmv) || 0,
          walletBalance: d.walletBalance || 0
        });
        t.loadPriceAndWithdraw(token, h);
      },
      fail: function () { t.setData({ loading: false }); }
    });
  },

  loadPriceAndWithdraw: function (token, h) {
    var t = this;
    var done = 0, total = 2;
    function check() { done++; if (done >= total) t.setData({ loading: false }); }

    wx.request({
      url: BASE + '/api/agent/product-price', method: 'GET', header: h,
      success: function (r) {
        var d = r.data || {};
        var list = (d.products || []).map(function (p) {
          return {
            product_id: p.product_id,
            title: p.title || '',
            cover_image: p.cover_image || '',
            retail_price: p.retail_price || 0,
            custom_price: p.custom_price,
            marketing_copy: p.marketing_copy || ''
          };
        });
        t.setData({ priceList: list, materialList: list.filter(function (x) { return x.cover_image; }) });
      },
      fail: function () {}, complete: check
    });

    wx.request({
      url: BASE + '/api/agent/withdraw', method: 'GET', header: h,
      success: function (r) {
        var d = r.data || {};
        t.setData({
          withdrawals: (d.withdrawals || []).map(function (w) {
            return { amount: w.amount, status: w.status, created_at: w.created_at, method: w.method };
          })
        });
      },
      fail: function () {}, complete: check
    });
  },

  switchTab: function (e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ tab: tab });
    if (tab === 'customers' && this.data.customers.length === 0) this.loadCustomers(true);
    if (tab === 'sales' && this.data.salesList.length === 0) this.loadSales(true);
    if (tab === 'orders' && this.data.orderList.length === 0) this.loadOrders(true);
  },

  // 分享
  onShareAppMessage: function () {
    var code = this.data.inviteCode || '';
    var name = this.data.storeName || this.data.fullName || '精选推荐';
    return {
      title: name + ' 的精选店 · 先试再买',
      path: 'pages/agent-shop/index?ref=' + code
    };
  },

  // 分享给客户试衣
  shareTryon: function () {
    var code = this.data.inviteCode || '';
    var name = this.data.storeName || this.data.fullName || '精选推荐';
    return {
      title: name + ' 邀请你体验 AI 虚拟试衣',
      path: 'pages/look-studio/index?ref=' + code
    };
  },

  // 客户管理
  loadCustomers: function (reset) {
    var t = this;
    var page = reset ? 1 : t.data.customerPage;
    if (!reset && !t.data.customerMore) return;
    wx.request({
      url: BASE + '/api/agent/customers?page=' + page + '&pageSize=20',
      method: 'GET',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      success: function (r) {
        var d = r.data || {};
        var list = d.customers || [];
        t.setData({
          customers: reset ? list : t.data.customers.concat(list),
          customerPage: page + 1,
          customerMore: list.length >= 20
        });
      }
    });
  },

  // 收益明细
  loadSales: function (reset) {
    var t = this;
    var page = reset ? 1 : t.data.salesPage;
    var filter = t.data.salesFilter;
    if (!reset && !t.data.salesMore) return;
    wx.request({
      url: BASE + '/api/agent/sales?status=' + filter + '&limit=20&offset=' + ((page - 1) * 20),
      method: 'GET',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      success: function (r) {
        var d = r.data || {};
        var list = d.list || [];
        t.setData({
          salesList: reset ? list : t.data.salesList.concat(list),
          salesPage: page + 1,
          salesMore: list.length >= 20,
          profitSummary: d.summary || t.data.profitSummary
        });
      }
    });
  },
  setSalesFilter: function (e) {
    var f = e.currentTarget.dataset.f;
    this.setData({ salesFilter: f, salesList: [], salesPage: 1, salesMore: true });
    this.loadSales(true);
  },

  // 订单物流
  loadOrders: function (reset) {
    var t = this;
    var page = reset ? 1 : t.data.orderPage;
    if (!reset && !t.data.orderMore) return;
    wx.request({
      url: BASE + '/api/agent/orders?limit=20&offset=' + ((page - 1) * 20),
      method: 'GET',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      success: function (r) {
        var d = r.data || {};
        var list = d.list || [];
        t.setData({
          orderList: reset ? list : t.data.orderList.concat(list),
          orderPage: page + 1,
          orderMore: list.length >= 20
        });
      }
    });
  },
  applyAfterSale: function (e) {
    var oid = e.currentTarget.dataset.id;
    wx.showActionSheet({
      itemList: ['退款', '退货', '换货'],
      success: function (res) {
        var types = ['refund', 'return', 'exchange'];
        wx.navigateTo({ url: '/pages/agent-aftersale/index?order_id=' + oid + '&type=' + types[res.tapIndex] });
      }
    });
  },

  // 复制营销文案
  copyMaterial: function (e) {
    var idx = e.currentTarget.dataset.index;
    var item = this.data.materialList[idx];
    if (!item) return;
    var text = item.marketing_copy || (item.title + '\n零售价 ¥' + fmtYuan(item.retail_price) + '\n快来我的店铺看看～');
    wx.setClipboardData({ data: text, success: function () { wx.showToast({ title: '文案已复制', icon: 'success' }); } });
  },
  saveImage: function (e) {
    var url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.downloadFile({
      url: url,
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
          fail: function () { wx.showToast({ title: '保存失败，请授权相册', icon: 'none' }); }
        });
      },
      fail: function () { wx.showToast({ title: '图片下载失败', icon: 'none' }); }
    });
  },

  // 编辑卖价
  openEdit: function (e) {
    var idx = e.currentTarget.dataset.index;
    var item = this.data.priceList[idx];
    if (!item) return;
    this.setData({
      showEdit: true, editIndex: idx, editItem: item,
      editPrice: item.custom_price ? (item.custom_price / 100).toString() : (item.retail_price / 100).toString()
    });
  },
  closeEdit: function () { this.setData({ showEdit: false, editIndex: -1, editItem: null }); },
  onEditPrice: function (e) { this.setData({ editPrice: e.detail.value }); },
  savePrice: function () {
    var t = this;
    if (t.data.savingPrice) return;
    var yuan = parseFloat(t.data.editPrice);
    if (!yuan || yuan <= 0) { wx.showToast({ title: '请输入有效卖价', icon: 'none' }); return; }
    var item = t.data.editItem;
    if (!item) return;
    t.setData({ savingPrice: true });
    wx.request({
      url: BASE + '/api/agent/product-price', method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      data: { product_id: item.product_id, custom_price: Math.round(yuan * 100) },
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showModal({ title: '保存失败', content: d.error, showCancel: false }); return; }
        wx.showToast({ title: '已更新卖价', icon: 'success' });
        t.setData({ showEdit: false, editIndex: -1, editItem: null });
        t.loadPrices();
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); },
      complete: function () { t.setData({ savingPrice: false }); }
    });
  },
  loadPrices: function () {
    var t = this;
    wx.request({
      url: BASE + '/api/agent/product-price', method: 'GET',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      success: function (r) {
        var d = r.data || {};
        var list = (d.products || []).map(function (p) {
          return { product_id: p.product_id, title: p.title || '', cover_image: p.cover_image || '', retail_price: p.retail_price || 0, custom_price: p.custom_price, marketing_copy: p.marketing_copy || '' };
        });
        t.setData({ priceList: list, materialList: list.filter(function (x) { return x.cover_image; }) });
      }
    });
  },

  // 提现
  openWithdraw: function () {
    if (this.data.walletBalance <= 0) { wx.showToast({ title: '暂无可提现余额', icon: 'none' }); return; }
    this.setData({ showWithdraw: true, withdrawAmt: '' });
  },
  closeWithdraw: function () { this.setData({ showWithdraw: false }); },
  onWithdrawAmt: function (e) { this.setData({ withdrawAmt: e.detail.value }); },
  submitWithdraw: function () {
    var t = this;
    if (t.data.submittingWithdraw) return;
    var yuan = parseFloat(t.data.withdrawAmt);
    if (!yuan || yuan <= 0) { wx.showToast({ title: '请输入提现金额', icon: 'none' }); return; }
    var cents = Math.round(yuan * 100);
    if (cents > t.data.walletBalance) { wx.showToast({ title: '超过可提现余额', icon: 'none' }); return; }
    t.setData({ submittingWithdraw: true });
    wx.request({
      url: BASE + '/api/agent/withdraw', method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      data: { amount: cents, method: 'wechat' },
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showModal({ title: '提现失败', content: d.error, showCancel: false }); return; }
        wx.showToast({ title: '已提交，等待打款', icon: 'success' });
        t.setData({ showWithdraw: false, walletBalance: (d.balance != null ? d.balance : t.data.walletBalance - cents) });
        t.loadAll();
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); },
      complete: function () { t.setData({ submittingWithdraw: false }); }
    });
  },

  goLogin: function () { wx.navigateTo({ url: '/pages/login/index' }); },
  goRecruit: function () { wx.navigateTo({ url: '/pages/agent-recruit/index' }); },
  goVipDeposit: function () { wx.navigateTo({ url: '/pages/vip/index?tab=deposit' }); },
  previewShop: function () {
    var code = this.data.inviteCode || '';
    if (!code) { wx.showToast({ title: '暂未生成推广码', icon: 'none' }); return; }
    wx.navigateTo({
      url: '/pages/agent-shop/index?ref=' + code,
      fail: function () { wx.redirectTo({ url: '/pages/agent-shop/index?ref=' + code }); }
    });
  },
  copyCode: function () {
    var code = this.data.inviteCode || '';
    if (!code) return;
    wx.setClipboardData({ data: code, success: function () { wx.showToast({ title: '已复制推广码', icon: 'success' }); } });
  },
  callConsult: function () { wx.makePhoneCall({ phoneNumber: '13925997776' }); },
  noop: function () {}
});

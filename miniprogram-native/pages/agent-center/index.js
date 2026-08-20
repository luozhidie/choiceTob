var app = getApp();
var BASE = 'https://colour-choice.art';

// 风格选品：13 个主风格（女士 8 + 男士 5），与分类树 params.style 存储完全对齐
// 商品 params.style 形如 "少女型,少女偏少年"，按主风格前缀匹配（主+其偏风格一并归类）
var STYLE_MAIN = [
  { token: '少女型', gender: '女' }, { token: '优雅型', gender: '女' },
  { token: '浪漫型', gender: '女' }, { token: '少年型', gender: '女' },
  { token: '时尚型', gender: '女' }, { token: '古典型', gender: '女' },
  { token: '自然型', gender: '女' }, { token: '戏剧型', gender: '女' },
  { token: '戏剧型', gender: '男' }, { token: '自然型', gender: '男' },
  { token: '古典型', gender: '男' }, { token: '浪漫型', gender: '男' },
  { token: '时尚型', gender: '男' }
];
// 商品风格串是否命中某主风格（主风格名 或 以「主风格前缀+偏」开头的偏风格）
function matchMain(styleStr, token) {
  if (!styleStr) return false;
  var prefix = token.slice(0, -1); // 少女型 -> 少女
  var arr = styleStr.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] === token || arr[i].indexOf(prefix + '偏') === 0) return true;
  }
  return false;
}
function buildStyleLists(materialList) {
  var women = [], men = [];
  STYLE_MAIN.forEach(function (m) {
    var cnt = (materialList || []).filter(function (p) { return matchMain(p.style, m.token); }).length;
    (m.gender === '女' ? women : men).push({ token: m.token, count: cnt });
  });
  return { womenStyleList: women, menStyleList: men };
}
var CORE_KEY = 'agent_core_clients';

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
    filteredMaterial: [],
    styleFilter: '',
    womenStyleList: [],
    menStyleList: [],
    shareProduct: null,
    batchDownloading: false,
    batchDone: 0,
    batchFailed: 0,
    // 八位核心客户（本地存储，无需后端迁移）
    coreClients: {},
    showCoreEdit: false,
    coreEditToken: '',
    coreEditName: '',
    coreEditContact: '',
    coreEditNote: '',
    coreSaving: false,
    // 工作台快捷推荐
    homeQuickPicks: [],
    // 订单状态汇总
    orderStats: { paid: 0, shipped: 0, delivered: 0, aftersale: 0 },
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
    t.loadCoreClients();
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
            marketing_copy: p.marketing_copy || '',
            style: p.style || ''
          };
        });
        var materialList = list.filter(function (x) { return x.cover_image; });
        var styleLists = buildStyleLists(materialList);
        t.setData({
          priceList: list,
          materialList: materialList,
          womenStyleList: styleLists.womenStyleList,
          menStyleList: styleLists.menStyleList,
          homeQuickPicks: materialList.slice(0, 6)
        });
        t.applyStyleFilter();
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
  onShareAppMessage: function (res) {
    var code = this.data.inviteCode || '';
    var name = this.data.storeName || this.data.fullName || '精选推荐';
    // 优先从 button dataset 取（更可靠）
    var ds = (res && res.target && res.target.dataset) || {};
    if (ds.share === 'tryon') {
      return {
        title: name + ' 邀请你体验 AI 虚拟试衣',
        path: 'pages/look-studio/index?ref=' + encodeURIComponent(code)
      };
    }
    var pid = ds.productId;
    var title = ds.title;
    var cover = ds.cover;
    if (!pid) {
      var shareProduct = this.data.shareProduct;
      if (shareProduct && shareProduct.product_id) {
        pid = shareProduct.product_id;
        title = shareProduct.title;
        cover = shareProduct.cover_image;
      }
    }
    if (pid) {
      this.setData({ shareProduct: null });
      return {
        title: (title ? (title + '').slice(0, 24) : name + ' 精选推荐'),
        path: 'pages/shop/index?id=' + pid + '&ref=' + encodeURIComponent(code),
        imageUrl: cover || ''
      };
    }
    return {
      title: name + ' 的精选店 · 先试再买',
      path: 'pages/agent-shop/index?ref=' + encodeURIComponent(code)
    };
  },
  setShareProduct: function (e) {
    var idx = e.currentTarget.dataset.index;
    var item = this.data.filteredMaterial[idx];
    if (item) this.setData({ shareProduct: item });
  },
  // 批量下载全部素材图到相册
  downloadAllImages: function () {
    var t = this;
    if (t.data.batchDownloading) return;
    var list = (t.data.filteredMaterial || []).filter(function (x) { return x.cover_image; });
    if (list.length === 0) { wx.showToast({ title: '没有可下载的图片', icon: 'none' }); return; }

    // 先检查/申请相册权限
    wx.getSetting({
      success: function (settingRes) {
        var auth = settingRes.authSetting['scope.writePhotosAlbum'];
        if (auth === false) {
          wx.showModal({
            title: '需要相册权限', content: '请到设置中开启保存到相册权限', showCancel: false,
            success: function () { wx.openSetting(); }
          });
          return;
        }
        t.setData({ batchDownloading: true, batchDone: 0, batchFailed: 0 });
        wx.showLoading({ title: '准备下载...', mask: true });
        var done = 0, failed = 0, i = 0;
        function next() {
          if (i >= list.length) {
            t.setData({ batchDownloading: false, batchDone: done, batchFailed: failed });
            wx.hideLoading();
            var msg = '已保存 ' + done + ' 张';
            if (failed > 0) msg += '，失败 ' + failed + ' 张';
            wx.showModal({ title: '下载完成', content: msg, showCancel: false });
            return;
          }
          var item = list[i++];
          var url = item.cover_image;
          // 确保走代理
          if (url.indexOf('supabase.co') > -1) {
            url = url.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
            url = url.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
          }
          wx.showLoading({ title: '保存中 ' + i + '/' + list.length, mask: true });
          wx.downloadFile({
            url: url,
            success: function (res) {
              if (res.statusCode !== 200) { failed++; next(); return; }
              wx.saveImageToPhotosAlbum({
                filePath: res.tempFilePath,
                success: function () { done++; t.setData({ batchDone: done }); next(); },
                fail: function () { failed++; t.setData({ batchFailed: failed }); next(); }
              });
            },
            fail: function () { failed++; t.setData({ batchFailed: failed }); next(); }
          });
        }
        next();
      }
    });
  },
  goDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) wx.navigateTo({ url: '/pages/shop/index?id=' + id });
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
        var stats = { paid: 0, shipped: 0, delivered: 0, aftersale: 0 };
        list.forEach(function (o) {
          if (o.status === 'paid') stats.paid++;
          else if (o.status === 'shipped') stats.shipped++;
          else if (o.status === 'delivered') stats.delivered++;
          if (o.aftersale_status && o.aftersale_status !== 'none') stats.aftersale++;
        });
        t.setData({
          orderList: reset ? list : t.data.orderList.concat(list),
          orderPage: page + 1,
          orderMore: list.length >= 20,
          orderStats: stats
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
    var item = this.data.filteredMaterial[idx];
    if (!item) return;
    var text = item.marketing_copy || (item.title + '\n零售价 ¥' + fmtYuan(item.retail_price) + '\n快来我的店铺看看～');
    wx.setClipboardData({ data: text, success: function () { wx.showToast({ title: '文案已复制', icon: 'success' }); } });
  },
  saveImage: function (e) {
    var t = this;
    var url = e.currentTarget.dataset.url;
    if (!url) return;
    // 确保 URL 经过 app.js 代理改写；如未改写也兜底
    if (url.indexOf('supabase.co') > -1) {
      url = url.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
      url = url.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
    }
    // 第一步：常规 wx.downloadFile
    wx.downloadFile({
      url: url,
      success: function (res) {
        if (res.statusCode !== 200) {
          console.error('[saveImage] downloadFile status', res.statusCode, url);
          return t.saveImageFallback(url);
        }
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
          fail: function (err) {
            console.error('[saveImage] saveImageToPhotosAlbum fail', err);
            wx.showToast({ title: '保存失败，请授权相册', icon: 'none' });
          }
        });
      },
      fail: function (err) {
        console.error('[saveImage] downloadFile fail', err);
        t.saveImageFallback(url);
      }
    });
  },
  // 下载兜底：先尝试 wx.getImageInfo 取本地缓存路径，再保存相册；仍失败则预览原图
  saveImageFallback: function (url) {
    wx.getImageInfo({
      src: url,
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.path,
          success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
          fail: function (err) {
            console.error('[saveImage] fallback saveImageToPhotosAlbum fail', err);
            wx.showToast({ title: '保存失败，请授权相册', icon: 'none' });
          }
        });
      },
      fail: function (err) {
        console.error('[saveImage] getImageInfo fail', err);
        wx.previewImage({
          urls: [url],
          current: url,
          fail: function () { wx.showToast({ title: '图片打开失败', icon: 'none' }); }
        });
        wx.showToast({ title: '请长按图片保存', icon: 'none' });
      }
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
          return { product_id: p.product_id, title: p.title || '', cover_image: p.cover_image || '', retail_price: p.retail_price || 0, custom_price: p.custom_price, marketing_copy: p.marketing_copy || '', style: p.style || '' };
        });
        var materialList = list.filter(function (x) { return x.cover_image; });
        var styleLists = buildStyleLists(materialList);
        t.setData({ priceList: list, materialList: materialList, womenStyleList: styleLists.womenStyleList, menStyleList: styleLists.menStyleList, homeQuickPicks: materialList.slice(0, 6) });
        t.applyStyleFilter();
      }
    });
  },

  // 风格过滤：把素材列表按所选主风格过滤
  applyStyleFilter: function () {
    var t = this;
    var f = t.data.styleFilter;
    var list = t.data.materialList || [];
    var filtered = f ? list.filter(function (p) { return matchMain(p.style, f); }) : list;
    t.setData({ filteredMaterial: filtered });
  },
  setMaterialStyle: function (e) {
    var token = e.currentTarget.dataset.token;
    this.setData({ styleFilter: token, tab: 'material' });
    this.applyStyleFilter();
  },
  clearMaterialStyle: function () {
    this.setData({ styleFilter: '' });
    this.applyStyleFilter();
  },

  // 八位核心客户（本地存储）
  loadCoreClients: function () {
    var arr;
    try { arr = wx.getStorageSync(CORE_KEY) || {}; } catch (e) { arr = {}; }
    if (!arr || typeof arr !== 'object') arr = {};
    this.setData({ coreClients: arr });
  },
  openCoreEdit: function (e) {
    var token = e.currentTarget.dataset.token;
    var c = this.data.coreClients[token] || {};
    this.setData({
      showCoreEdit: true, coreEditToken: token,
      coreEditName: c.name || '', coreEditContact: c.contact || '', coreEditNote: c.note || ''
    });
  },
  closeCoreEdit: function () { this.setData({ showCoreEdit: false, coreEditToken: '', coreEditName: '', coreEditContact: '', coreEditNote: '' }); },
  onCoreName: function (e) { this.setData({ coreEditName: e.detail.value }); },
  onCoreContact: function (e) { this.setData({ coreEditContact: e.detail.value }); },
  onCoreNote: function (e) { this.setData({ coreEditNote: e.detail.value }); },
  saveCoreEdit: function () {
    var t = this;
    if (t.data.coreSaving) return;
    var name = (t.data.coreEditName || '').trim();
    var contact = (t.data.coreEditContact || '').trim();
    if (!name && !contact) { wx.showToast({ title: '至少填一项', icon: 'none' }); return; }
    var token = t.data.coreEditToken;
    var clients = Object.assign({}, t.data.coreClients);
    var cur = clients[token] || { shares: 0 };
    cur.name = name; cur.contact = contact; cur.note = t.data.coreEditNote || '';
    clients[token] = cur;
    try { wx.setStorageSync(CORE_KEY, clients); } catch (e) {}
    t.setData({ coreClients: clients, showCoreEdit: false, coreEditToken: '', coreEditName: '', coreEditContact: '', coreEditNote: '' });
    wx.showToast({ title: '已保存', icon: 'success' });
  },
  // 点击某核心客户「去分享」：按该风格过滤素材并切到素材页
  coreShare: function (e) {
    var token = e.currentTarget.dataset.token;
    this.setData({ styleFilter: token, tab: 'material' });
    this.applyStyleFilter();
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

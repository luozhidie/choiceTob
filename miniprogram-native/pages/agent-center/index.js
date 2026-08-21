var app = getApp();
var BASE = 'https://colour-choice.art';

// 色彩季型：六大固有色特征 -> 十二个色彩季型
// 作为素材库主分类维度（替代风格），方便代理按客户肤色/用色精准选品
var COLOR_SEASONS = [
  { token: '深冷', group: '深' }, { token: '深暖', group: '深' },
  { token: '浅冷', group: '浅' }, { token: '浅暖', group: '浅' },
  { token: '冷亮', group: '冷' }, { token: '冷柔', group: '冷' },
  { token: '暖亮', group: '暖' }, { token: '暖柔', group: '暖' },
  { token: '净冷', group: '净' }, { token: '净暖', group: '净' },
  { token: '柔冷', group: '柔' }, { token: '柔暖', group: '柔' }
];
var COLOR_GROUPS = ['深', '浅', '冷', '暖', '净', '柔'];
function buildSeasonLists(materialList) {
  var list = [];
  COLOR_SEASONS.forEach(function (s) {
    var cnt = (materialList || []).filter(function (p) { return (p._libSeason || p.season) === s.token; }).length;
    list.push({ token: s.token, group: s.group, count: cnt });
  });
  return list;
}
var CORE_KEY = 'agent_core_clients';
var MY_MATERIALS_KEY = 'agent_my_materials';

// 穿衣风格客户盘：女士 8 主风格 × 8 偏风格 = 64；男士 5 主风格 × 5 偏风格 = 25
// 数据来源：形象档案页面（女士8主风格 / 男士5主风格）
var LADY_MAIN_STYLES = ['少女型', '优雅型', '浪漫型', '少年型', '时尚型', '古典型', '自然型', '戏剧型'];
var MAN_MAIN_STYLES = ['戏剧型', '自然型', '古典型', '浪漫型', '时尚型'];
var STYLE_CLIENTS_KEY = 'agent_style_clients';
function buildStyleCombos(mains) {
  var list = [];
  mains.forEach(function (main) {
    // 主风格自身：纯X型
    list.push({ token: '纯' + main, main: main, sub: main, pure: true });
    // 主风格偏其他风格
    mains.forEach(function (sub) {
      if (main === sub) return;
      list.push({ token: main + '偏' + sub, main: main, sub: sub });
    });
  });
  return list;
}
var LADY_STYLE_COMBOS = buildStyleCombos(LADY_MAIN_STYLES);
var MAN_STYLE_COMBOS = buildStyleCombos(MAN_MAIN_STYLES);

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
    // 商品素材：全店仓库 vs 我的素材库
    materialList: [],          // 全店有图商品（仓库）
    filteredMaterial: [],      // 当前展示的列表（我的素材库按色彩季型过滤 或 仓库列表）
    colorFilter: '',            // 当前选中的色彩季型
    seasonList: [],            // 我的素材库十二季型统计（带 group）
    allSeasons: COLOR_SEASONS.map(function (s) { return { token: s.token, group: s.group }; }),
    colorGroups: COLOR_GROUPS,
    groupLabels: { 深: '深冷、深暖', 浅: '浅冷、浅暖', 冷: '冷亮、冷柔', 暖: '暖亮、暖柔', 净: '净冷、净暖', 柔: '柔冷、柔暖' },
    expandedGroup: '',         // 素材库分类树当前展开的固有色组
    expandedWorkshopGroup: '', // 工作台我的素材库卡片当前展开的固有色组
    myMaterials: [],           // 我入库的素材 [{product_id, season, style(辅助), addedAt}]
    warehouseMode: false,      // 是否在选品入库模式
    shareProduct: null,
    batchDownloading: false,
    batchDone: 0,
    batchFailed: 0,
    // 色彩季型选择弹窗（加入素材库时使用）
    showColorPicker: false,
    pickerProduct: null,
    pickerSeason: '',
    // 核心客户（已同步后端 vip_customers，source='agent_core'，本地作兜底）
    coreClients: {},
    coreEditIds: {},           // 季型 token -> 后端记录 id（用于 PUT 更新）
    expandedCoreGroup: '',     // 核心客户 12 季型当前展开的固有色组
    // 穿衣风格客户盘（女士 64 + 男士 25）
    ladyMainStyles: LADY_MAIN_STYLES,
    ladyStyleCombos: LADY_STYLE_COMBOS,
    manMainStyles: MAN_MAIN_STYLES,
    manStyleCombos: MAN_STYLE_COMBOS,
    styleClients: {},
    expandedLadyStyle: '',
    expandedManStyle: '',
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
    withdrawals: [],
    // VIP客户资料管理（连接后台 vip_customers，按代理隔离；UI 不暴露"同步后台"）
    vipCustomers: [],
    vipPage: 1,
    vipMore: true,
    showVipForm: false,
    editingVipId: '',
    vipForm: { name: '', phone: '', wechat: '', company: '', gender: '', color_season: '', main_style: '', sub_style: '', vip_level: 'V1', notes: '' },
    savingVip: false,
    showVipSeason: false
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
    t.loadStyleClients();
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
        t.setData({
          priceList: list,
          materialList: materialList,
          homeQuickPicks: materialList.slice(0, 6)
        });
        t.loadMyMaterials();
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
    if (tab === 'vip' && this.data.vipCustomers.length === 0) this.loadVipCustomers(true);
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
        t.setData({ priceList: list, materialList: materialList, homeQuickPicks: materialList.slice(0, 6) });
        t.loadMyMaterials();
      }
    });
  },

  // 我的素材库（本地存储）
  loadMyMaterials: function () {
    var t = this;
    var arr = [];
    try { var raw = wx.getStorageSync(MY_MATERIALS_KEY); arr = (raw && Array.isArray(raw)) ? raw : []; } catch (e) { arr = []; }
    // 兼容旧数据：以前用 style 字段作为主分类，现在主分类是 season（色彩季型）
    arr.forEach(function (m) { if (!m.season && m.style) { m.season = m.style; } });
    t.setData({ myMaterials: arr });
    t.applyColorFilter(true);
  },
  saveMyMaterials: function (arr, cb) {
    try { wx.setStorageSync(MY_MATERIALS_KEY, arr); } catch (e) {}
    this.setData({ myMaterials: arr }, cb);
  },
  // 把 myMaterials 与商品信息合并，生成带 season 的商品列表（season 以代理入库时选的色彩季型为准）
  buildMyMaterialList: function () {
    var t = this;
    var map = {};
    (t.data.materialList || []).forEach(function (p) { map[p.product_id] = p; });
    return (t.data.myMaterials || []).map(function (m) {
      var p = map[m.product_id] || {};
      return Object.assign({}, p, { _libSeason: m.season, _libStyle: m.style, product_id: m.product_id, addedAt: m.addedAt });
    }).filter(function (x) { return x.product_id; });
  },

  // 色彩季型过滤：默认过滤我的素材库；warehouseMode 下不过滤
  applyColorFilter: function (silent) {
    var t = this;
    if (t.data.warehouseMode) {
      var inLib = {};
      (t.data.myMaterials || []).forEach(function (m) { inLib[m.product_id] = true; });
      var list = (t.data.materialList || []).filter(function (p) { return !inLib[p.product_id]; });
      t.setData({ filteredMaterial: list });
      return;
    }
    var myList = t.buildMyMaterialList();
    var f = t.data.colorFilter;
    var filtered = f ? myList.filter(function (p) { return p._libSeason === f; }) : myList;
    var seasonList = buildSeasonLists(myList);
    var upd = { filteredMaterial: filtered, seasonList: seasonList };
    if (silent === true) { t.setData(upd); } else { t.setData(upd); }
  },
  setMaterialColor: function (e) {
    var token = e.currentTarget.dataset.token;
    this.setData({ colorFilter: token, warehouseMode: false, tab: 'material' });
    this.applyColorFilter();
  },
  clearMaterialColor: function () {
    this.setData({ colorFilter: '', warehouseMode: false });
    this.applyColorFilter();
  },
  expandGroup: function (e) {
    var group = e.currentTarget.dataset.group;
    this.setData({ expandedGroup: this.data.expandedGroup === group ? '' : group });
  },
  expandCoreGroup: function (e) {
    var group = e.currentTarget.dataset.group;
    this.setData({ expandedCoreGroup: this.data.expandedCoreGroup === group ? '' : group });
  },
  expandWorkshopGroup: function (e) {
    var group = e.currentTarget.dataset.group;
    this.setData({ expandedWorkshopGroup: this.data.expandedWorkshopGroup === group ? '' : group });
  },
  // 选品入库模式切换
  enterWarehouse: function () {
    this.setData({ warehouseMode: true, colorFilter: '', tab: 'material' });
    this.applyColorFilter();
  },
  exitWarehouse: function () {
    this.setData({ warehouseMode: false });
    this.applyColorFilter();
  },
  // 打开色彩季型选择弹窗
  openColorPicker: function (e) {
    var pid = e.currentTarget.dataset.pid;
    var t = this;
    var product = (t.data.materialList || []).find(function (p) { return p.product_id === pid; });
    if (!product) return;
    var defaultSeason = COLOR_SEASONS[0].token;
    t.setData({ showColorPicker: true, pickerProduct: product, pickerSeason: defaultSeason });
  },
  closeColorPicker: function () { this.setData({ showColorPicker: false, pickerProduct: null, pickerSeason: '' }); },
  onPickerSeason: function (e) { this.setData({ pickerSeason: e.currentTarget.dataset.token }); },
  confirmAddToLibrary: function () {
    var t = this;
    var p = t.data.pickerProduct;
    var season = t.data.pickerSeason;
    if (!p || !season) return;
    var arr = (t.data.myMaterials || []).slice();
    if (arr.some(function (m) { return m.product_id === p.product_id; })) {
      wx.showToast({ title: '已在素材库中', icon: 'none' });
      t.closeColorPicker();
      return;
    }
    arr.unshift({ product_id: p.product_id, season: season, style: p.style || '', addedAt: Date.now() });
    t.saveMyMaterials(arr, function () {
      t.closeColorPicker();
      t.applyColorFilter();
      wx.showToast({ title: '已加入素材库', icon: 'success' });
    });
  },
  removeFromLibrary: function (e) {
    var pid = e.currentTarget.dataset.pid;
    var t = this;
    wx.showModal({
      title: '移出素材库', content: '确定从素材库移出该商品？', showCancel: true,
      success: function (res) {
        if (!res.confirm) return;
        var arr = (t.data.myMaterials || []).filter(function (m) { return m.product_id !== pid; });
        t.saveMyMaterials(arr, function () {
          t.applyColorFilter();
          wx.showToast({ title: '已移出', icon: 'success' });
        });
      }
    });
  },
  inLibrary: function (pid) {
    return (this.data.myMaterials || []).some(function (m) { return m.product_id === pid; });
  },

  // 十二位核心客户：每个色彩季型绑定一位核心客户，数据同步到后端 vip_customers(source='agent_core')
  loadCoreClients: function () {
    var t = this;
    // 本地兜底先渲染
    var arr;
    try { arr = wx.getStorageSync(CORE_KEY) || {}; } catch (e) { arr = {}; }
    if (!arr || typeof arr !== 'object') arr = {};
    t.setData({ coreClients: arr });
    // 后端加载（按 agent_id 隔离，仅本代理）
    wx.request({
      url: BASE + '/api/agent/vip-customers',
      method: 'GET',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      success: function (r) {
        var d = r.data || {};
        if (d.error) return;
        var map = {}; var ids = {};
        (d.customers || []).forEach(function (c) {
          if (c.source !== 'agent_core' || !c.color_season) return;
          map[c.color_season] = { name: c.name || '', contact: c.wechat || '', note: c.notes || '', shares: 0 };
          ids[c.color_season] = c.id;
        });
        try { wx.setStorageSync(CORE_KEY, map); } catch (e) {}
        t.setData({ coreClients: map, coreEditIds: ids });
      }
    });
  },
  // 穿衣风格客户盘（女士 64 + 男士 25）
  loadStyleClients: function () {
    var arr;
    try { arr = wx.getStorageSync(STYLE_CLIENTS_KEY) || {}; } catch (e) { arr = {}; }
    if (!arr || typeof arr !== 'object') arr = {};
    this.setData({ styleClients: arr });
  },
  expandLadyStyle: function (e) {
    var main = e.currentTarget.dataset.main;
    this.setData({ expandedLadyStyle: this.data.expandedLadyStyle === main ? '' : main });
  },
  expandManStyle: function (e) {
    var main = e.currentTarget.dataset.main;
    this.setData({ expandedManStyle: this.data.expandedManStyle === main ? '' : main });
  },
  isSeasonToken: function (token) {
    return COLOR_SEASONS.some(function (s) { return s.token === token; });
  },
  openCoreEdit: function (e) {
    var token = e.currentTarget.dataset.token;
    var c = (this.data.coreClients[token] || this.data.styleClients[token]) || {};
    this.setData({
      showCoreEdit: true, coreEditToken: token, coreEditIsSeason: this.isSeasonToken(token),
      coreEditName: c.name || '', coreEditContact: c.contact || '', coreEditNote: c.note || ''
    });
  },
  closeCoreEdit: function () { this.setData({ showCoreEdit: false, coreEditToken: '', coreEditIsSeason: false, coreEditName: '', coreEditContact: '', coreEditNote: '' }); },
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
    var cur = { name: name, contact: contact, note: t.data.coreEditNote || '', shares: 0 };
    var prev = (t.data.coreClients[token] || t.data.styleClients[token]) || {};
    if (prev.shares) cur.shares = prev.shares;

    if (t.isSeasonToken(token)) {
      // 核心客户：同步到后端 vip_customers（source='agent_core'）
      var existingId = t.data.coreEditIds[token];
      var body = { name: name, source: 'agent_core', color_season: token, wechat: contact, notes: t.data.coreEditNote || '' };
      if (existingId) body.id = existingId;
      wx.request({
        url: BASE + '/api/agent/vip-customers',
        method: existingId ? 'PUT' : 'POST',
        header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
        data: body,
        success: function (r) {
          var d = r.data || {};
          var clients = Object.assign({}, t.data.coreClients);
          var ids = Object.assign({}, t.data.coreEditIds);
          clients[token] = cur;
          if (d.data && d.data.id) ids[token] = d.data.id;
          try { wx.setStorageSync(CORE_KEY, clients); } catch (e) {}
          t.setData({ coreClients: clients, coreEditIds: ids, showCoreEdit: false, coreEditToken: '', coreEditName: '', coreEditContact: '', coreEditNote: '' });
          wx.showToast({ title: '已保存', icon: 'success' });
        },
        fail: function () {
          // 后端失败则存本地兜底
          var clients = Object.assign({}, t.data.coreClients);
          clients[token] = cur;
          try { wx.setStorageSync(CORE_KEY, clients); } catch (e) {}
          t.setData({ coreClients: clients, showCoreEdit: false, coreEditToken: '', coreEditName: '', coreEditContact: '', coreEditNote: '' });
          wx.showToast({ title: '已存本地', icon: 'none' });
        }
      });
      return;
    }
    // 风格客户盘：保持本地存储（本次未要求同步后端）
    var styleClients = Object.assign({}, t.data.styleClients);
    styleClients[token] = cur;
    try { wx.setStorageSync(STYLE_CLIENTS_KEY, styleClients); } catch (e) {}
    t.setData({ styleClients: styleClients, showCoreEdit: false, coreEditToken: '', coreEditName: '', coreEditContact: '', coreEditNote: '' });
    wx.showToast({ title: '已保存', icon: 'success' });
  },
  deleteCore: function () {
    var t = this;
    var token = t.data.coreEditToken;
    var existingId = (t.data.coreEditIds || {})[token];
    if (!existingId) return;
    wx.showModal({
      title: '删除确认',
      content: '确定删除「' + token + '」的核心客户吗？',
      confirmText: '删除',
      success: function (res) {
        if (!res.confirm) return;
        function finish() {
          var clients = Object.assign({}, t.data.coreClients);
          var ids = Object.assign({}, t.data.coreEditIds);
          delete clients[token];
          delete ids[token];
          try { wx.setStorageSync(CORE_KEY, clients); } catch (e) {}
          t.setData({ coreClients: clients, coreEditIds: ids, showCoreEdit: false, coreEditToken: '', coreEditIsSeason: false, coreEditName: '', coreEditContact: '', coreEditNote: '' });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
        wx.request({
          url: BASE + '/api/agent/vip-customers?id=' + encodeURIComponent(existingId),
          method: 'DELETE',
          header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
          success: function (r) { finish(); },
          fail: function () {
            wx.showModal({ title: '删除失败', content: '网络错误，已保留本地记录，请稍后重试。', showCancel: false });
          }
        });
      }
    });
  },
  // 点击某核心客户「去分享」：季型按素材库色彩季型过滤；风格暂按季型素材提示
  coreShare: function (e) {
    var token = e.currentTarget.dataset.token;
    var t = this;
    if (!t.isSeasonToken(token)) {
      wx.showModal({
        title: token,
        content: '风格客户盘去分享功能开发中，可先按该客户的色彩季型去素材库分享。',
        showCancel: false
      });
      return;
    }
    var has = (t.data.myMaterials || []).some(function (m) { return m.season === token; });
    if (!has) {
      wx.showModal({
        title: token + ' · 素材库为空',
        content: '该色彩季型还没有入库素材，先去选品入库？',
        confirmText: '去选品',
        cancelText: '取消',
        success: function (res) {
          if (res.confirm) t.enterWarehouse();
        }
      });
      return;
    }
    t.setData({ colorFilter: token, warehouseMode: false, tab: 'material' });
    t.applyColorFilter();
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

  // ========== VIP客户资料管理（连接后台 vip_customers，按代理隔离） ==========
  loadVipCustomers: function (reset) {
    var t = this;
    var page = reset ? 1 : t.data.vipPage;
    if (!reset && !t.data.vipMore) return;
    wx.request({
      url: BASE + '/api/agent/vip-customers',
      method: 'GET',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      success: function (r) {
        var d = r.data || {};
        if (d.error) return; // 非代理等静默
        var list = (d.customers || []).filter(function (c) {
          return c.source !== 'agent_core';
        }).map(function (c) {
          return Object.assign({}, c, { initial: (c.name || '?').charAt(0) });
        });
        t.setData({
          vipCustomers: reset ? list : t.data.vipCustomers.concat(list),
          vipPage: page + 1,
          vipMore: list.length >= 200
        });
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },
  openVipForm: function () {
    this.setData({
      showVipForm: true,
      editingVipId: '',
      vipForm: { name: '', phone: '', wechat: '', company: '', gender: '', color_season: '', main_style: '', sub_style: '', vip_level: 'V1', notes: '' },
      showVipSeason: false
    });
  },
  closeVipForm: function () { this.setData({ showVipForm: false, editingVipId: '' }); },
  onVipInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var f = Object.assign({}, this.data.vipForm);
    f[field] = e.detail.value;
    this.setData({ vipForm: f });
  },
  setVipGender: function (e) { this.setData({ 'vipForm.gender': e.currentTarget.dataset.g }); },
  setVipLevel: function (e) { this.setData({ 'vipForm.vip_level': e.currentTarget.dataset.l }); },
  openVipSeasonPicker: function () { this.setData({ showVipSeason: true }); },
  closeVipSeason: function () { this.setData({ showVipSeason: false }); },
  pickVipSeason: function (e) { this.setData({ 'vipForm.color_season': e.currentTarget.dataset.token, showVipSeason: false }); },
  submitVip: function () {
    var t = this;
    if (t.data.savingVip) return;
    var f = t.data.vipForm;
    if (!f.name || !f.name.trim()) { wx.showToast({ title: '请填写客户姓名', icon: 'none' }); return; }
    t.setData({ savingVip: true });
    var url = BASE + '/api/agent/vip-customers';
    var method = t.data.editingVipId ? 'PUT' : 'POST';
    var data = Object.assign({}, f);
    if (t.data.editingVipId) data.id = t.data.editingVipId;
    wx.request({
      url: url, method: method,
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      data: data,
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showModal({ title: '保存失败', content: d.error, showCancel: false }); return; }
        wx.showToast({ title: '已保存', icon: 'success' });
        t.setData({ showVipForm: false, editingVipId: '' });
        t.loadVipCustomers(true);
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); },
      complete: function () { t.setData({ savingVip: false }); }
    });
  },
  editVip: function (e) {
    var id = e.currentTarget.dataset.id;
    var item = (this.data.vipCustomers || []).find(function (c) { return c.id === id; });
    if (!item) return;
    this.setData({
      showVipForm: true,
      editingVipId: id,
      vipForm: {
        name: item.name || '',
        phone: item.phone || '',
        wechat: item.wechat || '',
        company: item.company || '',
        gender: item.gender || '',
        color_season: item.color_season || '',
        main_style: item.main_style || '',
        sub_style: item.sub_style || '',
        vip_level: item.vip_level || 'V1',
        notes: item.notes || ''
      }
    });
  },
  deleteVip: function (e) {
    var id = e.currentTarget.dataset.id;
    var t = this;
    wx.showModal({
      title: '删除VIP客户', content: '确定删除该客户档案？', showCancel: true,
      success: function (res) {
        if (!res.confirm) return;
        wx.request({
          url: BASE + '/api/agent/vip-customers?id=' + id, method: 'DELETE',
          header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
          success: function (r) {
            var d = r.data || {};
            if (d.error) { wx.showModal({ title: '删除失败', content: d.error, showCancel: false }); return; }
            wx.showToast({ title: '已删除', icon: 'success' });
            t.loadVipCustomers(true);
          },
          fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
      }
    });
  },

  noop: function () {}
});

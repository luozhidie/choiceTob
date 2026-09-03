var app = getApp();
var BASE = 'https://colour-choice.art';

// 色彩季型：六大固有色特征 -> 十二个色彩季型
// 作为素材库主分类维度（替代风格），方便代理按会员肤色/用色精准选品
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
    var cnt = 0;
    (materialList || []).forEach(function (p) {
      var seasons = p._libSeasons || (Array.isArray(p.seasons) ? p.seasons : (p.season ? [p.season] : []));
      if (seasons.indexOf(s.token) >= 0) cnt++;
    });
    list.push({ token: s.token, group: s.group, count: cnt });
  });
  return list;
}
var CORE_KEY = 'agent_core_clients';
var MY_MATERIALS_KEY = 'agent_my_materials';

// 穿衣风格会员盘：女士 8 主风格 × 8 偏风格 = 64；男士 5 主风格 × 5 偏风格 = 25
// 数据来源：形象档案页面（女士8主风格 / 男士5主风格）
var LADY_MAIN_STYLES = ['少女型', '优雅型', '浪漫型', '少年型', '时尚型', '古典型', '自然型', '戏剧型'];
var MAN_MAIN_STYLES = ['戏剧型', '自然型', '古典型', '浪漫型', '时尚型'];
var STYLE_CLIENTS_KEY = 'agent_style_clients';
// prefix: 'lady'（女士）/ 'man'（男士）—— 作为本地存储 key 前缀，彻底隔离两性风格盘
function buildStyleCombos(mains, prefix) {
  var list = [];
  mains.forEach(function (main) {
    // 主风格自身：纯X型
    list.push({ token: '纯' + main, main: main, sub: main, pure: true, gkey: prefix + ':' + '纯' + main });
    // 主风格偏其他风格
    mains.forEach(function (sub) {
      if (main === sub) return;
      list.push({ token: main + '偏' + sub, main: main, sub: sub, gkey: prefix + ':' + main + '偏' + sub });
    });
  });
  return list;
}
var LADY_STYLE_COMBOS = buildStyleCombos(LADY_MAIN_STYLES, 'lady');
var MAN_STYLE_COMBOS = buildStyleCombos(MAN_MAIN_STYLES, 'man');

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
    // 会员管理
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
    filteredMaterial: [],      // 当前展示的列表（我的素材库按色彩季型/风格过滤 或 仓库列表）
    colorFilter: '',            // 当前选中的季型或风格 token
    seasonList: [],            // 我的素材库十二季型统计（带 group、按出现次数）
    styleFilterList: [],       // 素材库中出现过的风格标签（用于快捷过滤）
    allSeasons: COLOR_SEASONS.map(function (s) { return { token: s.token, group: s.group }; }),
    colorGroups: COLOR_GROUPS,
    groupLabels: { 深: '深冷、深暖', 浅: '浅冷、浅暖', 冷: '冷亮、冷柔', 暖: '暖亮、暖柔', 净: '净冷、净暖', 柔: '柔冷、柔暖' },
    expandedGroup: '',         // 素材库分类树当前展开的固有色组
    expandedWorkshopGroup: '', // 工作台我的素材库卡片当前展开的固有色组
    myMaterials: [],           // 我入库的素材 [{product_id, seasons:[], styles:[], addedAt}]
    warehouseMode: false,      // 是否在选品入库模式
    shareProduct: null,
    batchDownloading: false,
    batchDone: 0,
    batchFailed: 0,
    // 加入素材库弹窗（多选标签：色彩季型 + 女士/男士风格）
    showColorPicker: false,
    pickerProduct: null,
    pickerTab: 'season',       // 'season' | 'lady' | 'man'
    pickerSeasons: [],         // 已选季型 token 数组
    pickerStyles: [],          // 已选风格 gkey 数组（lady:xxx / man:xxx）
    pickerExpandedLadyStyle: '',
    pickerExpandedManStyle: '',
    // 核心会员：按色彩季型分组，每季型可挂任意多个客户 { "深暖": [{name,contact,note}, ...] }
    coreClients: {},
    expandedCoreSeason: '',      // 当前展开的季型（显示其客户列表）
    // 穿衣风格会员盘（女士 64 + 男士 25），每风格可挂任意多个客户，按性别前缀隔离
    ladyMainStyles: LADY_MAIN_STYLES,
    ladyStyleCombos: LADY_STYLE_COMBOS,
    manMainStyles: MAN_MAIN_STYLES,
    manStyleCombos: MAN_STYLE_COMBOS,
    styleClients: {},            // { "lady:古典偏浪漫": [{name,contact,note}, ...] }
    expandedLadyStyle: '',
    expandedManStyle: '',
    expandedStyleKey: '',        // 当前展开的风格 gkey（显示其客户列表）
    expandedStyleGender: '',
    expandedStyleSeason: '',
    // 客户添加/编辑表单
    showClientForm: false,
    clientFormSeason: '',        // 季型 token 或风格 token
    clientFormGender: '',        // 'lady' / 'man' / ''（季型）
    clientEditId: '',            // 后端记录 id；空=新增
    savingClient: false,
    clientForm: { name: '', contact: '', note: '', image_url: '' },
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
    withdrawMethod: 'wechat',
    withdrawAmt: '',
    wdTaxText: '0.00',
    wdActualText: '0.00',
    selectedBankIndex: 0,
    submittingWithdraw: false,
    withdrawals: [],
    // VIP会员资料管理（连接后台 vip_customers，按代理隔离；UI 不暴露"同步后台"）
    vipCustomers: [],
    vipPage: 1,
    vipMore: true,
    showVipForm: false,
    editingVipId: '',
    vipForm: { name: '', phone: '', wechat: '', company: '', gender: '', color_season: '', main_style: '', sub_style: '', image_url: '', vip_level: 'V1', notes: '' },
    savingVip: false,
    showVipSeason: false,
    // VIP客户详情：展示形象照 + 专属匹配素材
    showVipDetail: false,
    vipDetail: null,
    vipMatched: [],
    vipUploading: false,
    // 代理人资料（可编辑）
    avatarUrl: '',
    nickname: '',
    agentStoreName: '',
    phone: '',
    wechat: '',
    bio: '',
    showProfileEdit: false,
    profileSaving: false,
    profileForm: { nickname: '', agentStoreName: '', phone: '', wechat: '', bio: '', avatarUrl: '' }
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
    t.loadVipCustomers(true);
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
          // 严格拦截：非管理员且非充值会员，整页拦截，不渲染任何代理数据
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
          depositText: fmtYuan(d.depositAmount || 0),
          inviteCode: d.inviteCode || '',
          customerCount: (d.performance && d.performance.customerCount) || 0,
          orderCount: (d.performance && d.performance.orderCount) || 0,
          gmv: (d.performance && d.performance.gmv) || 0,
          walletBalance: d.walletBalance || 0,
          walletText: fmtYuan(d.walletBalance || 0),
          frozenBalance: d.frozenBalance || 0,
          frozenText: fmtYuan(d.frozenBalance || 0),
          paymentPasswordSet: !!d.paymentPasswordSet,
          bankCards: d.bankCards || [],
          tryon: d.tryon || { normalLeft: 0, proLeft: 0, daysLeft: 0 },
          preDepositAgreed: !!d.preDepositAgreed,
          // 代理人资料
          avatarUrl: d.avatarUrl || '',
          nickname: d.nickname || '',
          agentStoreName: d.agentStoreName || '',
          phone: d.phone || '',
          wechat: d.wechat || '',
          bio: d.bio || ''
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
          walletBalance: d.balance || 0,
          walletText: fmtYuan(d.balance || 0),
          frozenBalance: d.frozenBalance || 0,
          frozenText: fmtYuan(d.frozenBalance || 0),
          withdrawals: (d.withdrawals || []).map(function (w) {
            return {
              amount: w.amount,
              status: w.status,
              created_at: w.created_at,
              method: w.method,
              tax_deducted: w.tax_deducted || 0,
              actual_paid: w.actual_paid || 0
            };
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

  // 分享给会员试衣
  shareTryon: function () {
    var code = this.data.inviteCode || '';
    var name = this.data.storeName || this.data.fullName || '精选推荐';
    return {
      title: name + ' 邀请你体验 AI 虚拟试衣',
      path: 'pages/look-studio/index?ref=' + code
    };
  },

  // 会员管理
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
    // 兼容旧数据：season 单字符串 -> seasons 数组；style 单字符串 -> styles 数组
    arr.forEach(function (m) {
      if (m.season && (!m.seasons || !Array.isArray(m.seasons))) m.seasons = [m.season];
      if (!Array.isArray(m.seasons)) m.seasons = [];
      if (m.style && (!m.styles || !Array.isArray(m.styles))) m.styles = m.style ? [m.style] : [];
      if (!Array.isArray(m.styles)) m.styles = [];
    });
    t.setData({ myMaterials: arr });
    t.applyColorFilter(true);
  },
  saveMyMaterials: function (arr, cb) {
    try { wx.setStorageSync(MY_MATERIALS_KEY, arr); } catch (e) {}
    this.setData({ myMaterials: arr }, cb);
  },
  // 把 myMaterials 与商品信息合并，生成带 seasons/styles 的商品列表
  buildMyMaterialList: function () {
    var t = this;
    var map = {};
    (t.data.materialList || []).forEach(function (p) { map[p.product_id] = p; });
    return (t.data.myMaterials || []).map(function (m) {
      var p = map[m.product_id] || {};
      var seasons = Array.isArray(m.seasons) ? m.seasons : (m.season ? [m.season] : []);
      var styles = Array.isArray(m.styles) ? m.styles : (m.style ? [m.style] : []);
      return Object.assign({}, p, {
        _libSeasons: seasons,
        _libStyles: styles,
        _libStyleLabels: styles.map(function (s) { return s.replace(/^[^:]+:/, ''); }),
        product_id: m.product_id,
        addedAt: m.addedAt
      });
    }).filter(function (x) { return x.product_id; });
  },

  // 按季型或风格过滤我的素材库；warehouseMode 下不过滤
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
    var filtered = f ? myList.filter(function (p) {
      return (p._libSeasons || []).indexOf(f) >= 0 || (p._libStyles || []).indexOf(f) >= 0;
    }) : myList;
    var seasonList = buildSeasonLists(myList);
    // 从已入库素材中聚合出现过的风格标签，用作快捷过滤
    var styleMap = {};
    myList.forEach(function (p) {
      (p._libStyles || []).forEach(function (gkey) {
        var label = gkey.replace(/^[^:]+:/, '');
        styleMap[gkey] = label;
      });
    });
    var styleFilterList = Object.keys(styleMap).map(function (k) { return { gkey: k, label: styleMap[k] }; });
    var upd = { filteredMaterial: filtered, seasonList: seasonList, styleFilterList: styleFilterList };
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
  // 打开加入素材库弹窗（多选标签：色彩季型 + 风格）
  openColorPicker: function (e) {
    var pid = e.currentTarget.dataset.pid;
    var t = this;
    var product = (t.data.materialList || []).find(function (p) { return p.product_id === pid; });
    if (!product) return;
    t.setData({
      showColorPicker: true,
      pickerProduct: product,
      pickerTab: 'season',
      pickerSeasons: [],
      pickerStyles: [],
      pickerExpandedLadyStyle: '',
      pickerExpandedManStyle: ''
    });
  },
  closeColorPicker: function () {
    this.setData({ showColorPicker: false, pickerProduct: null, pickerTab: 'season', pickerSeasons: [], pickerStyles: [], pickerExpandedLadyStyle: '', pickerExpandedManStyle: '' });
  },
  onPickerTab: function (e) { this.setData({ pickerTab: e.currentTarget.dataset.tab }); },
  onPickerSeason: function (e) {
    var token = e.currentTarget.dataset.token;
    var arr = this.data.pickerSeasons.slice();
    var idx = arr.indexOf(token);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(token);
    this.setData({ pickerSeasons: arr });
  },
  onPickerSelectAllSeasons: function () {
    var all = this.data.allSeasons.map(function (s) { return s.token; });
    var cur = this.data.pickerSeasons;
    if (cur.length === all.length) this.setData({ pickerSeasons: [] });
    else this.setData({ pickerSeasons: all.slice() });
  },
  onPickerStyle: function (e) {
    var gkey = e.currentTarget.dataset.gkey;
    var arr = this.data.pickerStyles.slice();
    var idx = arr.indexOf(gkey);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(gkey);
    this.setData({ pickerStyles: arr });
  },
  onPickerSelectAllStyleGroup: function (e) {
    var gender = e.currentTarget.dataset.gender;
    var expanded = gender === 'lady' ? this.data.pickerExpandedLadyStyle : this.data.pickerExpandedManStyle;
    var combos = gender === 'lady' ? LADY_STYLE_COMBOS : MAN_STYLE_COMBOS;
    var groupKeys = combos.filter(function (s) { return s.main === expanded; }).map(function (s) { return s.gkey; });
    var arr = this.data.pickerStyles.slice();
    groupKeys.forEach(function (k) { if (arr.indexOf(k) < 0) arr.push(k); });
    this.setData({ pickerStyles: arr });
  },
  expandPickerLadyStyle: function (e) {
    var main = e.currentTarget.dataset.main;
    this.setData({ pickerExpandedLadyStyle: this.data.pickerExpandedLadyStyle === main ? '' : main });
  },
  expandPickerManStyle: function (e) {
    var main = e.currentTarget.dataset.main;
    this.setData({ pickerExpandedManStyle: this.data.pickerExpandedManStyle === main ? '' : main });
  },
  removePickerTag: function (e) {
    var ds = e.currentTarget.dataset;
    if (ds.type === 'season') {
      var arr = this.data.pickerSeasons.slice();
      var idx = arr.indexOf(ds.value);
      if (idx >= 0) { arr.splice(idx, 1); this.setData({ pickerSeasons: arr }); }
    } else {
      var arr = this.data.pickerStyles.slice();
      var idx = arr.indexOf(ds.value);
      if (idx >= 0) { arr.splice(idx, 1); this.setData({ pickerStyles: arr }); }
    }
  },
  confirmAddToLibrary: function () {
    var t = this;
    var p = t.data.pickerProduct;
    var seasons = t.data.pickerSeasons || [];
    var styles = t.data.pickerStyles || [];
    if (!p) return;
    if (seasons.length === 0 && styles.length === 0) {
      wx.showToast({ title: '至少选一个标签', icon: 'none' });
      return;
    }
    var arr = (t.data.myMaterials || []).slice();
    if (arr.some(function (m) { return m.product_id === p.product_id; })) {
      wx.showToast({ title: '已在素材库中', icon: 'none' });
      t.closeColorPicker();
      return;
    }
    arr.unshift({ product_id: p.product_id, seasons: seasons, styles: styles, addedAt: Date.now() });
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

  // 工作台客户已后端化（source=agent_core / agent_style），数据由 loadVipCustomers 统一派生，本地存储仅作旧数据迁移源
  loadCoreClients: function () {},
  loadStyleClients: function () {},
  expandLadyStyle: function (e) {
    var main = e.currentTarget.dataset.main;
    // 切换主风格时收起风格客户列表
    this.setData({ expandedLadyStyle: this.data.expandedLadyStyle === main ? '' : main, expandedStyleKey: '', expandedStyleGender: '', expandedStyleSeason: '' });
  },
  expandManStyle: function (e) {
    var main = e.currentTarget.dataset.main;
    this.setData({ expandedManStyle: this.data.expandedManStyle === main ? '' : main, expandedStyleKey: '', expandedStyleGender: '', expandedStyleSeason: '' });
  },
  // 展开/收起某季型的客户列表
  toggleCoreSeason: function (e) {
    var season = e.currentTarget.dataset.season;
    this.setData({ expandedCoreSeason: this.data.expandedCoreSeason === season ? '' : season });
  },
  // 展开/收起某风格的客户列表
  toggleStyleList: function (e) {
    var ds = e.currentTarget.dataset;
    var gkey = ds.gkey;
    if (this.data.expandedStyleKey === gkey) {
      this.setData({ expandedStyleKey: '', expandedStyleGender: '', expandedStyleSeason: '' });
    } else {
      this.setData({ expandedStyleKey: gkey, expandedStyleGender: ds.gender, expandedStyleSeason: ds.season });
    }
  },
  isSeasonToken: function (token) {
    return COLOR_SEASONS.some(function (s) { return s.token === token; });
  },
  // 打开客户表单：添加（无 id）或编辑（传后端记录 id）
  openClientForm: function (e) {
    var t = this;
    var ds = e.currentTarget.dataset;
    var season = ds.season;
    var gender = ds.gender || '';
    var editId = ds.id || '';
    var c = {};
    if (editId) {
      var arr = gender ? t.data.styleClients : t.data.coreClients;
      var key = gender ? (gender + ':' + season) : season;
      c = (arr[key] || []).find(function (x) { return x.id === editId; }) || {};
    }
    t.setData({
      showClientForm: true, clientFormSeason: season, clientFormGender: gender, clientEditId: editId,
      clientForm: { name: c.name || '', contact: c.contact || '', note: c.note || '', image_url: (c.image_url && /^https?:/.test(c.image_url)) ? c.image_url : '' }
    });
  },
  closeClientForm: function () { this.setData({ showClientForm: false, clientFormSeason: '', clientFormGender: '', clientEditId: '', clientForm: { name: '', contact: '', note: '', image_url: '' } }); },
  onClientName: function (e) { this.setData({ 'clientForm.name': e.detail.value }); },
  onClientContact: function (e) { this.setData({ 'clientForm.contact': e.detail.value }); },
  onClientNote: function (e) { this.setData({ 'clientForm.note': e.detail.value }); },
  _clientAt: function (season, gender, index) {
    var target = gender ? this.data.styleClients : this.data.coreClients;
    var key = gender ? (gender + ':' + season) : season;
    var arr = target[key] || [];
    return arr[index] || {};
  },
  // 保存客户到后端 vip_customers（source=agent_core 季型 / agent_style 风格），每类型不限人数
  saveClient: function () {
    var t = this;
    var name = (t.data.clientForm.name || '').trim();
    var contact = (t.data.clientForm.contact || '').trim();
    if (!name && !contact) { wx.showToast({ title: '至少填一项', icon: 'none' }); return; }
    var season = t.data.clientFormSeason;
    var gender = t.data.clientFormGender;
    var editId = t.data.clientEditId;
    var isStyle = !!gender;
    var body = {
      name: name,
      wechat: contact,
      notes: t.data.clientForm.note || '',
      image_url: t.data.clientForm.image_url || ''
    };
    if (isStyle) {
      body.source = 'agent_style';
      body.gender = gender === 'man' ? '男' : '女';
      var token = season;
      if (token.indexOf('纯') === 0) { body.main_style = token.substring(1); body.sub_style = body.main_style; }
      else { var p = token.indexOf('偏'); if (p > 0) { body.main_style = token.substring(0, p); body.sub_style = token.substring(p + 1); } }
    } else {
      body.source = 'agent_core';
      body.color_season = season;
    }
    if (editId) body.id = editId;
    t.setData({ savingClient: true });
    wx.request({
      url: BASE + '/api/agent/vip-customers',
      method: editId ? 'PUT' : 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (t.data.token || wx.getStorageSync('token') || '') },
      data: body,
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showModal({ title: '保存失败', content: d.error, showCancel: false }); return; }
        wx.showToast({ title: '已保存', icon: 'success' });
        t.setData({ showClientForm: false, clientFormSeason: '', clientFormGender: '', clientEditId: '', clientForm: { name: '', contact: '', note: '', image_url: '' } });
        t.loadVipCustomers(true);
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); },
      complete: function () { t.setData({ savingClient: false }); }
    });
  },
  // 删除客户（后端记录 id 定位）
  deleteClient: function () {
    var t = this;
    var editId = t.data.clientEditId;
    if (!editId) return;
    wx.showModal({
      title: '删除确认', content: '确定删除该客户吗？', confirmText: '删除',
      success: function (res) {
        if (!res.confirm) return;
        wx.request({
          url: BASE + '/api/agent/vip-customers?id=' + encodeURIComponent(editId),
          method: 'DELETE',
          header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (t.data.token || wx.getStorageSync('token') || '') },
          success: function (r) {
            var d = r.data || {};
            if (d.error) { wx.showModal({ title: '删除失败', content: d.error, showCancel: false }); return; }
            wx.showToast({ title: '已删除', icon: 'success' });
            t.setData({ showClientForm: false, clientFormSeason: '', clientFormGender: '', clientEditId: '', clientForm: { name: '', contact: '', note: '', image_url: '' } });
            t.loadVipCustomers(true);
          },
          fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); }
        });
      }
    });
  },
  // 工作台客户（核心会员 / 风格盘）打开专属卡片：复用 VIP 详情弹窗（形象照 + 专属素材 + 试衣），归属同一闭环
  openClientCard: function (e) {
    var ds = e.currentTarget.dataset;
    var season = ds.season;
    var gender = ds.gender || '';
    var index = parseInt(ds.index, 10);
    var c = this._clientAt(season, gender, index);
    if (!c) return;
    var vip = {
      id: c.id,
      _workbench: true,
      _source: gender ? 'agent_style' : 'agent_core',
      name: c.name || '客户',
      gender: gender === 'lady' ? '女' : (gender === 'man' ? '男' : (c.gender || '')),
      color_season: gender ? '' : season,
      main_style: gender ? (c.main_style || '') : '',
      sub_style: gender ? (c.sub_style || '') : '',
      image_url: (c.image_url && /^https?:/.test(c.image_url)) ? c.image_url : '',
      vip_level: 'V1'
    };
    var matched = this.matchMaterialsForVip(vip);
    this.setData({ showVipDetail: true, vipDetail: vip, vipMatched: matched });
  },
  // 点击某核心会员「去分享」：季型按素材库色彩季型过滤；风格暂按季型素材提示
  coreShare: function (e) {
    var token = e.currentTarget.dataset.token;
    var t = this;
    if (!t.isSeasonToken(token)) {
      wx.showModal({
        title: token,
        content: '风格会员盘去分享功能开发中，可先按该会员的色彩季型去素材库分享。',
        showCancel: false
      });
      return;
    }
    var has = (t.data.myMaterials || []).some(function (m) {
      var seasons = Array.isArray(m.seasons) ? m.seasons : (m.season ? [m.season] : []);
      return seasons.indexOf(token) >= 0;
    });
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
    this.setData({ showWithdraw: true, withdrawMethod: 'wechat', withdrawAmt: '', wdTaxText: '0.00', wdActualText: '0.00', selectedBankIndex: 0 });
  },
  closeWithdraw: function () { this.setData({ showWithdraw: false }); },
  setWdMethod: function (e) { this.setData({ withdrawMethod: e.currentTarget.dataset.m }); this.calcWdTax(); },
  onWithdrawAmt: function (e) {
    var val = e.detail.value;
    // 最多两位小数
    val = val.replace(/[^\d.]/g, '').replace(/\./, '#').replace(/\./g, '').replace('#', '.');
    var dot = val.indexOf('.');
    if (dot >= 0) val = val.slice(0, dot + 3);
    this.setData({ withdrawAmt: val });
    this.calcWdTax();
  },
  calcWdTax: function () {
    var yuan = parseFloat(this.data.withdrawAmt) || 0;
    var cents = Math.round(yuan * 100);
    var taxable = 0;
    if (cents <= 400000) taxable = Math.max(0, cents - 80000); else taxable = Math.round(cents * 0.8);
    var tax = Math.round(taxable * 0.2);
    var actual = Math.max(0, cents - tax);
    this.setData({ wdTaxText: fmtYuan(tax), wdActualText: fmtYuan(actual) });
  },
  goBindBank: function () { wx.navigateTo({ url: '/pages/bank-cards/index' }); },
  submitWithdraw: function () {
    var t = this;
    if (t.data.submittingWithdraw) return;
    var yuan = parseFloat(t.data.withdrawAmt);
    if (!yuan || yuan <= 0) { wx.showToast({ title: '请输入提现金额', icon: 'none' }); return; }
    var cents = Math.round(yuan * 100);
    if (cents > t.data.walletBalance) { wx.showToast({ title: '超过可提现余额', icon: 'none' }); return; }
    if (cents < 100) { wx.showToast({ title: '最少提现 1 元', icon: 'none' }); return; }
    var method = t.data.withdrawMethod;
    var bankCardId = null;
    if (method === 'bank') {
      var cards = t.data.bankCards || [];
      var idx = t.data.selectedBankIndex || 0;
      if (!cards.length) { wx.showToast({ title: '请先绑定银行卡', icon: 'none' }); return; }
      bankCardId = cards[idx] && cards[idx].id;
    }
    t.setData({ submittingWithdraw: true });
    wx.request({
      url: BASE + '/api/agent/withdraw', method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      data: { amount: cents, method: method, bank_card_id: bankCardId },
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showModal({ title: '提现失败', content: d.error, showCancel: false }); return; }
        wx.showToast({ title: '已提交，等待打款', icon: 'success' });
        t.setData({ showWithdraw: false });
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

  // ========== VIP会员资料管理（连接后台 vip_customers，按代理隔离） ==========
  // 拉取本代理全部客户，按 source 分流：VIP档案 tab、核心会员(季型)、风格盘(风格)
  loadVipCustomers: function (reset) {
    var t = this;
    var token = t.data.token || wx.getStorageSync('token') || '';
    if (!token) return;
    wx.request({
      url: BASE + '/api/agent/vip-customers',
      method: 'GET',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      success: function (r) {
        var d = r.data || {};
        if (d.error) return; // 非代理等静默
        var all = d.customers || [];
        // VIP 档案 tab：排除工作台两类（agent_core / agent_style）
        var vipList = all.filter(function (c) {
          return c.source !== 'agent_core' && c.source !== 'agent_style';
        }).map(function (c) {
          return Object.assign({}, c, { initial: (c.name || '?').charAt(0) });
        });
        var groups = t.deriveWorkbench(all);
        t.setData({
          vipCustomers: vipList,
          coreClients: groups.core,
          styleClients: groups.style,
          vipLoaded: true
        });
        if (reset) t.migrateLocalClients();
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },
  // 从全量客户派生工作台分组：季型核心会员 + 风格盘（与本地结构保持一致，WXML 不变）
  deriveWorkbench: function (all) {
    var core = {};
    var style = {};
    (all || []).forEach(function (c) {
      if (c.source === 'agent_core') {
        var cs = c.color_season || '未归类';
        var item = { id: c.id, name: c.name, contact: c.wechat, note: c.notes, image_url: c.image_url, gender: c.gender || '', color_season: c.color_season, main_style: '', sub_style: '' };
        (core[cs] = core[cs] || []).push(item);
      } else if (c.source === 'agent_style') {
        var gender = c.gender === '男' ? 'man' : 'lady';
        var token = c.sub_style ? (c.main_style + '偏' + c.sub_style) : ('纯' + c.main_style);
        var gkey = gender + ':' + token;
        var item2 = { id: c.id, name: c.name, contact: c.wechat, note: c.notes, image_url: c.image_url, gender: c.gender || '', color_season: '', main_style: c.main_style, sub_style: c.sub_style };
        (style[gkey] = style[gkey] || []).push(item2);
      }
    });
    return { core: core, style: style };
  },
  // 首次加载时，把旧版本地核心会员/风格盘客户迁移到后端 vip_customers（幂等，迁移后清空本地）
  migrateLocalClients: function () {
    var t = this;
    var tasks = [];
    try {
      var core = wx.getStorageSync(CORE_KEY) || {};
      Object.keys(core).forEach(function (season) {
        (core[season] || []).forEach(function (c) {
          if (!c || (!c.name && !c.contact)) return;
          tasks.push({ source: 'agent_core', color_season: season, name: c.name || '', wechat: c.contact || '', notes: c.note || '', image_url: (c.image_url && /^https?:/.test(c.image_url)) ? c.image_url : '' });
        });
      });
    } catch (e) {}
    try {
      var style = wx.getStorageSync(STYLE_CLIENTS_KEY) || {};
      Object.keys(style).forEach(function (gkey) {
        (style[gkey] || []).forEach(function (c) {
          if (!c || (!c.name && !c.contact)) return;
          var sep = gkey.indexOf(':');
          var gender = sep >= 0 ? gkey.substring(0, sep) : '';
          var token = sep >= 0 ? gkey.substring(sep + 1) : gkey;
          var main = '', sub = '';
          if (token.indexOf('纯') === 0) { main = token.substring(1); sub = main; }
          else { var p = token.indexOf('偏'); if (p > 0) { main = token.substring(0, p); sub = token.substring(p + 1); } }
          tasks.push({ source: 'agent_style', gender: gender === 'man' ? '男' : '女', main_style: main, sub_style: sub, name: c.name || '', wechat: c.contact || '', notes: c.note || '', image_url: (c.image_url && /^https?:/.test(c.image_url)) ? c.image_url : '' });
        });
      });
    } catch (e) {}
    if (!tasks.length) return;
    var pending = tasks.length, done = 0;
    wx.showLoading({ title: '迁移本地客户', mask: true });
    tasks.forEach(function (task) {
      var token = wx.getStorageSync('token') || '';
      wx.request({
        url: BASE + '/api/agent/vip-customers',
        method: 'POST',
        header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        data: task,
        success: function () { done++; },
        fail: function () { done++; },
        complete: function () {
          pending--;
          if (pending === 0) {
            try { wx.removeStorageSync(CORE_KEY); wx.removeStorageSync(STYLE_CLIENTS_KEY); } catch (e) {}
            wx.hideLoading();
            if (done > 0) wx.showToast({ title: '已迁移 ' + done + ' 位客户', icon: 'success' });
            t.loadVipCustomers(true);
          }
        }
      });
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
    if (!f.name || !f.name.trim()) { wx.showToast({ title: '请填写会员姓名', icon: 'none' }); return; }
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
        image_url: item.image_url || '',
        vip_level: item.vip_level || 'V1',
        notes: item.notes || ''
      }
    });
  },
  deleteVip: function (e) {
    var id = e.currentTarget.dataset.id;
    var t = this;
    wx.showModal({
      title: '删除VIP会员', content: '确定删除该会员档案？', showCancel: true,
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

  // ===== VIP客户详情：形象照 + 专属匹配素材 =====
  openVipDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    var item = (this.data.vipCustomers || []).find(function (c) { return c.id === id; });
    if (!item) return;
    var matched = this.matchMaterialsForVip(item);
    this.setData({ showVipDetail: true, vipDetail: item, vipMatched: matched });
  },
  closeVipDetail: function () { this.setData({ showVipDetail: false, vipDetail: null, vipMatched: [] }); },
  // 按客户「色彩季型 + 风格」结论匹配已入库素材（季型必匹配，风格有则匹配对应性别风格前缀）
  matchMaterialsForVip: function (vip) {
    var t = this;
    var season = (vip.color_season || '').trim();
    var gender = (vip.gender === '男' || vip.gender === '女') ? vip.gender : '';
    var mainStyle = (vip.main_style || '').trim();
    var map = {};
    (t.data.materialList || []).forEach(function (p) { map[p.product_id] = p; });
    return (t.data.myMaterials || []).filter(function (m) {
      var seasons = Array.isArray(m.seasons) ? m.seasons : (m.season ? [m.season] : []);
      if (season && seasons.indexOf(season) < 0) return false;
      if (mainStyle && gender) {
        var prefix = (gender === '男' ? 'man' : 'lady') + ':';
        var hit = (m.styles || []).some(function (gkey) { return gkey.indexOf(prefix + mainStyle) === 0; });
        if (!hit) return false;
      }
      return true;
    }).map(function (m) {
      var p = map[m.product_id] || {};
      return Object.assign({}, p, {
        _libSeasons: Array.isArray(m.seasons) ? m.seasons : (m.season ? [m.season] : []),
        _libStyleLabels: (m.styles || []).map(function (s) { return s.replace(/^[^:]+:/, ''); })
      });
    });
  },
  vipTryon: function (e) {
    var vip = this.data.vipDetail;
    if (!vip) return;
    if (!vip.image_url) { wx.showToast({ title: '请先上传客户形象照', icon: 'none' }); return; }
    var url = '/pages/look-studio/index?baseImageUrl=' + encodeURIComponent(vip.image_url);
    wx.navigateTo({ url: url });
  },
  chooseVipPhoto: function () {
    var t = this;
    if (t.data.vipUploading) return;
    var vip = t.data.vipDetail;
    if (!vip || !vip.id) return;
    wx.chooseImage({
      count: 1,
      success: function (res) {
        var filePath = res.tempFilePaths[0];
        t.setData({ vipUploading: true });
        wx.uploadFile({
          url: BASE + '/api/mini/upload-avatar',
          filePath: filePath,
          name: 'file',
          header: { 'Authorization': 'Bearer ' + (t.data.token || wx.getStorageSync('token') || '') },
          success: function (up) {
            var d = {};
            try { d = JSON.parse(up.data); } catch (e) {}
            var url = d.url || '';
            if (!url) { wx.showToast({ title: '上传失败', icon: 'none' }); t.setData({ vipUploading: false }); return; }
            var h2 = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (t.data.token || wx.getStorageSync('token') || '') };
            wx.request({
              url: BASE + '/api/agent/vip-customers', method: 'PUT',
              header: h2,
              data: { id: vip.id, image_url: url },
              success: function () {
                var detail = Object.assign({}, t.data.vipDetail, { image_url: url });
                t.setData({ vipDetail: detail, vipUploading: false });
                t.loadVipCustomers(true);
                wx.showToast({ title: '形象照已更新', icon: 'success' });
              },
              fail: function () { t.setData({ vipUploading: false }); wx.showToast({ title: '同步失败', icon: 'none' }); }
            });
          },
          fail: function () { t.setData({ vipUploading: false }); wx.showToast({ title: '上传失败', icon: 'none' }); }
        });
      }
    });
  },

  // VIP表单内上传形象照（先存 URL 到 vipForm，提交时随档案保存）
  chooseVipFormPhoto: function () {
    var t = this;
    wx.chooseImage({
      count: 1,
      success: function (res) {
        var filePath = res.tempFilePaths[0];
        wx.uploadFile({
          url: BASE + '/api/mini/upload-avatar',
          filePath: filePath,
          name: 'file',
          header: { 'Authorization': 'Bearer ' + (t.data.token || wx.getStorageSync('token') || '') },
          success: function (up) {
            var d = {};
            try { d = JSON.parse(up.data); } catch (e) {}
            var url = d.url || '';
            if (!url) { wx.showToast({ title: '上传失败', icon: 'none' }); return; }
            t.setData({ 'vipForm.image_url': url });
            wx.showToast({ title: '已选形象照', icon: 'success' });
          },
          fail: function () { wx.showToast({ title: '上传失败', icon: 'none' }); }
        });
      }
    });
  },

  // 工作台客户形象照：统一走 chooseVipPhoto（后端 PUT image_url by id）
  chooseClientPhoto: function () {
    this.chooseVipPhoto();
  },

  // 工作台客户（后端）：从卡片进入编辑资料
  editLocalClient: function () {
    var t = this;
    var vip = t.data.vipDetail;
    if (!vip || !vip.id) return;
    var gender = (vip.gender === '女' || vip.gender === '男') ? (vip.gender === '女' ? 'lady' : 'man') : '';
    var season = gender ? (vip.main_style && vip.sub_style ? (vip.main_style + '偏' + vip.sub_style) : ('纯' + vip.main_style)) : vip.color_season;
    t.setData({ showVipDetail: false, vipDetail: null, vipMatched: [] });
    t.openClientForm({ currentTarget: { dataset: { season: season, gender: gender, id: vip.id } } });
  },
  // 工作台客户（后端）：删除
  deleteLocalClient: function () {
    var t = this;
    var vip = t.data.vipDetail;
    if (!vip || !vip.id) return;
    wx.showModal({
      title: '删除确认', content: '确定删除该客户吗？', confirmText: '删除',
      success: function (res) {
        if (!res.confirm) return;
        wx.request({
          url: BASE + '/api/agent/vip-customers?id=' + encodeURIComponent(vip.id),
          method: 'DELETE',
          header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (t.data.token || wx.getStorageSync('token') || '') },
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

  // ========== 代理人资料编辑 ==========
  openProfileEdit: function () {
    this.setData({
      showProfileEdit: true,
      profileForm: {
        nickname: this.data.nickname || '',
        agentStoreName: this.data.agentStoreName || '',
        phone: this.data.phone || '',
        wechat: this.data.wechat || '',
        bio: this.data.bio || '',
        avatarUrl: this.data.avatarUrl || ''
      }
    });
  },
  closeProfileEdit: function () { this.setData({ showProfileEdit: false }); },
  onProfileInput: function (e) {
    var f = Object.assign({}, this.data.profileForm);
    f[e.currentTarget.dataset.field] = e.detail.value;
    this.setData({ profileForm: f });
  },
  chooseAvatar: function () {
    var t = this;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], sizeType: ['compressed'],
      success: function (res) {
        var tmp = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中', mask: true });
        wx.getFileSystemManager().readFile({
          filePath: tmp,
          encoding: 'base64',
          success: function (r) {
            var base64 = 'data:image/jpeg;base64,' + r.data;
            wx.request({
              url: BASE + '/api/mini/upload-avatar',
              method: 'POST',
              header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
              data: { image: base64, mime: 'image/jpeg' },
              success: function (r2) {
                var d = r2.data || {};
                if (d.url) {
                  t.setData({ 'profileForm.avatarUrl': d.url });
                  wx.showToast({ title: '头像已上传', icon: 'success' });
                } else {
                  wx.showModal({ title: '上传失败', content: d.error || '请重试', showCancel: false });
                }
              },
              fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); },
              complete: function () { wx.hideLoading(); }
            });
          },
          fail: function () { wx.hideLoading(); wx.showToast({ title: '读取图片失败', icon: 'none' }); }
        });
      }
    });
  },
  saveProfile: function () {
    var t = this;
    if (t.data.profileSaving) return;
    var nick = (t.data.profileForm.nickname || '').trim();
    if (!nick) { wx.showToast({ title: '昵称不能为空', icon: 'none' }); return; }
    t.setData({ profileSaving: true });
    wx.request({
      url: BASE + '/api/agent/me', method: 'PUT',
      header: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t.data.token },
      data: {
        nickname: nick,
        agent_store_name: t.data.profileForm.agentStoreName || '',
        phone: t.data.profileForm.phone || '',
        wechat: t.data.profileForm.wechat || '',
        bio: t.data.profileForm.bio || '',
        avatar_url: t.data.profileForm.avatarUrl || ''
      },
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showModal({ title: '保存失败', content: d.error, showCancel: false }); return; }
        t.setData({
          nickname: nick,
          agentStoreName: t.data.profileForm.agentStoreName || '',
          phone: t.data.profileForm.phone || '',
          wechat: t.data.profileForm.wechat || '',
          bio: t.data.profileForm.bio || '',
          avatarUrl: t.data.profileForm.avatarUrl || '',
          showProfileEdit: false
        });
        wx.showToast({ title: '已保存', icon: 'success' });
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); },
      complete: function () { t.setData({ profileSaving: false }); }
    });
  },

  noop: function () {}
});

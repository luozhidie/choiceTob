var app = getApp();

// 会员等级 → 展示（与网页 MEMBER_TIERS 对应）
var MEMBER_MAP = {
  none: null,
  view_price: { icon: '👁️', label: '价格会员', desc: '已开通，可查看全部商品批发价' },
  deposit_discount: { icon: '📦', label: '拿货会员', desc: '已开通，充值即享拿货折扣' },
  basic: { icon: '⭐', label: '基础VIP', desc: '商品享9折' },
  pro: { icon: '💜', label: '进阶VIP', desc: '商品享8折 + 5%返利' },
  premium: { icon: '👑', label: '高阶VIP', desc: '商品享7折 + 8%返利' },
  wholesale_5w: { icon: '📦', label: '拿货会员·充5万', desc: '2.8折拿货 · 退换5%' },
  wholesale_10w: { icon: '📦', label: '拿货会员·充10万', desc: '2.8折拿货 · 退换10%' },
  wholesale_30w: { icon: '📦', label: '拿货会员·充30万', desc: '2.6折拿货 · 退换20%' },
  price_trial: { icon: '👁️', label: '价格会员·体验', desc: '14天查看批发价' },
  price_1y: { icon: '👁️', label: '价格会员·年卡', desc: '查看批发价' },
  price_2y: { icon: '👁️', label: '价格会员·两年卡', desc: '查看批发价' },
  price_3y: { icon: '👁️', label: '价格会员·三年卡', desc: '查看批发价' },
};

// 拿货指南 / 技巧（与网页一致）
var WHOLESALE_GUIDE = [
  { title: '起批规则', desc: '同色同款 3 件起批，支持多色混批；拿货会员享 2.8 折专属拿货价。' },
  { title: '发货时效', desc: '现货 48 小时内发出，预售款按商品页标注天数发货；急单可联系客服备注。' },
  { title: '退换政策', desc: '非质量问题 7 天内可退换（吊牌完好、未水洗），质量问题运费由本店承担。' },
  { title: '物流与运费', desc: '默认发顺丰/京东，满额包邮；偏远地区补差价，大货可走物流专线。' },
];
var WHOLESALE_TIPS = [
  { title: '选码技巧', desc: '版型偏大一码可拍小一码；模特身高 168 穿 M，微胖建议选 L。' },
  { title: '拿货节奏', desc: '应季款提前 2-3 周上新拿货，换季清仓价最优但尺码易缺。' },
  { title: '搭配拿货提升连带', desc: '按「一品三搭」思路同批次拿：上装+下装+配饰，客单价更高。' },
  { title: '质量把控', desc: '到货先抽检车工/走线/印花；首单小批量测款，数据好再追大货。' },
];

Page({
  data: {
    productId: '',
    product: null,
    images: [],
    videoUrl: '',
    modelImages: [],
    sizeChartImage: '',
    priceText: '',
    originalPriceText: '',
    discountText: '',
    wholesalePriceText: '',
    isPriceMember: false,
    quantity: 1,
    cartCount: 0,
    isFav: false,
    specList: [],
    paramList: [],            // 详细参数（服装规格）网格，用于下单详情弹窗
    reviews: [],
    recList: [],
    tryonLoading: false,
    tryonResult: '',
    tryonIsDemo: false,
    showTryon: false,
    // 会员权益
    memberTier: null,
    // 优惠券
    couponTpls: [],
    claimedIds: [],
    // 静态内容（fallback，加载 store_content 后覆盖）
    wholesaleGuide: WHOLESALE_GUIDE,
    wholesaleTips: WHOLESALE_TIPS,
    // 顶部媒体轮播（平铺：视频→模特图→实拍图→尺码）
    mediaList: [],             // 所有媒体项 [{type,src},...]
    mediaIndex: 0,             // 当前所在媒体项下标
    mediaTabs: [],             // 动态生成的媒体 Tab [{key,label,start},...]
    mediaTabIndex: 0,          // 当前激活的 Tab 下标
    // 商品/档口/详情 吸顶切换
    showSectionTabs: false,      // 是否显示吸顶 Tab
    sectionActive: 'product',    // 当前激活：product/shop/detail
    statusBarHeight: 20,         // 状态栏高度（px）
    customNavTotalHeightPx: 64,  // 状态栏+自定义导航高度（px）
    tabsHeightPx: 36,            // 吸顶 Tab 高度（px）
    mediaAreaHeightPx: 500,      // 媒体区高度（px）
    windowHeight: 667,           // 视口高度（px）
    sectionShopTop: 0,           // 档口区距页面顶部距离
    sectionDetailTop: 0,         // 详情区距页面顶部距离
    // 店铺内容（后台可编辑）
    shopName: '骆芷蝶智选',
    shopIntro: '',
    shippingNote: '',
    fabricCare: '',
    // 相似推荐
    similarList: [],
    // 1:1 一手增强
    estPriceText: '',          // 动力预估价（拿货会员价）
    tagList: [],               // 商品标签：会员 / 货源 / 新品 / 自定义
    sizeOptions: [],           // 可选尺码
    colorOptions: [],          // 可选颜色
    selectedSize: '',
    selectedColor: '',
    shopRecLatest: [],         // 档口最新款
    shopRecHot: [],            // 档口大爆款
    shopRecNewbie: [],         // 新人推荐
    seriesActive: 'latest',    // 系列切换：latest / hot
    // 买手选品货架入口（卡片展示货架 banner 图，点击进入货架）
    shelfBanner: '',           // 买手选品货架 banner 图
    shelfId: '',               // 买手选品货架 block id
    shelfTitle: '买手选品',    // 货架标题（兜底）
    // 弹窗与 SKU 数据
    showSkuPanel: false,         // 下单详情弹窗
    skuMode: 'cart',             // 面板用途：cart=加购物车 / buy=立即购买并支付
    showCouponPanel: false,      // 优惠明细弹窗
    showSizeChart: false,        // 尺码图弹窗
    priceValue: 0,               // 1件起批价格（数值）
    bulkPriceValue: 0,           // ≥5件价格（数值）
    skuPriceValue: 0,            // 面板实时单价（随所选款式变化）
    skuBulkValue: 0,             // 面板批量价
    selectedSetItem: '',         // 选中的套装子项（上衣/半裙），非套装商品为空
    sizeQuantities: {},          // 各尺码数量 {size: qty}
    skuTotal: 0,                 // 弹窗中总数量
    skuTotalPrice: 0,              // 弹窗底部总价
    serviceText: '不支持退货',     // 服务说明
    serviceGuaranteeText: '不支持退货', // 服务保障
    specText: '',                // 参数摘要
    // 套装拆分价明细
    setItems: [],
    setSumY: 0,
    setSumW: 0,
    setSumB: 0,
    setSumC: 0,
    shopStats: {                 // 店铺数据（可后台覆盖）
      fans: '69019',
      score: '4.5',
      repurchaseRate: '25.5%',
      selectedBrand: true,
    },
  },

  onLoad: function (opt) {
    var app = getApp();
    var sys = wx.getSystemInfoSync();
    var pxPerRpx = sys.windowWidth / 750;
    var navBarHeightPx = Math.round(88 * pxPerRpx);
    var tabsHeightPx = Math.round(80 * pxPerRpx);
    this.setData({
      productId: opt.id || '',
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember) || !!wx.getStorageSync('is_certified_store_owner'),
      statusBarHeight: sys.statusBarHeight || 20,
      customNavTotalHeightPx: (sys.statusBarHeight || 20) + navBarHeightPx,
      tabsHeightPx: tabsHeightPx,
      windowHeight: sys.windowHeight || 667
    });
    this.loadProduct(opt.id);
    this.loadCartCount();
    this.loadFav(opt.id);
    this.loadMembership();
    this.loadCoupons();
    this.loadClaimed();
    this.loadStoreContent();
    this.loadShelfBanner();
  },

  onReady: function () { this.measureSectionTops(); },

  loadProduct: function (id) {
    var t = this;
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
        /* 零售价 */
        var price = Number(p.price) || 0;
        if (price >= 100) price = Math.round(price / 100);
        var ori = p.original_price ? Number(p.original_price) : 0;
        if (ori >= 100) ori = Math.round(ori / 100);
        var disc = '';
        if (ori > 0 && price > 0) disc = '省¥' + (ori - price);
        /* 批发价（分单位，需/100展示） */
        var isPriceMember = t.data.isPriceMember;
        var wholesaleText = '';
        var wp = Number(p.wholesale_price) || 0;
        if (wp > 0) {
          if (isPriceMember) {
            wholesaleText = '¥' + Math.round(wp / 100);
          } else {
            wholesaleText = '¥???';
          }
        }
        // 1件起批 / ≥5件价格（用于下单详情弹窗）
        // 会员（含认证店主）显示批发价；非会员显示零售价
        var priceValue, bulkPriceValue;
        if (isPriceMember && wp > 0) {
          priceValue = Math.round(wp / 100);
          if (p.bulk_price) {
            bulkPriceValue = Number(p.bulk_price) >= 100 ? Math.round(Number(p.bulk_price) / 100) : Number(p.bulk_price);
          } else {
            bulkPriceValue = Math.round(wp / 100 * 0.95);
          }
        } else {
          priceValue = price;
          bulkPriceValue = price;
        }
        /* 规格 */
        var specList = [];
        if (p.category) specList.push({ label: '分类', value: p.category });
        if (p.material) specList.push({ label: '材质', value: p.material });
        if (p.size) specList.push({ label: '尺码', value: p.size });
        if (p.sizes) specList.push({ label: '尺码', value: p.sizes });
        if (p.color) specList.push({ label: '颜色', value: p.color });
        if (p.origin) specList.push({ label: '产地', value: p.origin });
        if (p.brand) specList.push({ label: '品牌', value: p.brand });
        if (p.weight) specList.push({ label: '重量', value: p.weight });
        if (p.care_instructions) specList.push({ label: '洗涤', value: p.care_instructions });
        /* 详细参数（服装规格 JSONB）：并入 specList 供参数行展示，并单独成 paramList 供下单详情网格 */
        var PARAM_LABELS = {
          fabric: '面料', accessories: '配件', lining: '里布', thickness: '厚度',
          season: '季节', skirt_type: '裙型', silhouette: '廓形', collar: '领型',
          skirt_length: '裙长', scene: '穿着场景', fit: '版型', placket: '门襟',
          sleeve_type: '袖型', sleeve_length: '袖长', craft: '工艺', pattern: '图案'
        };
        var paramList = [];
        if (p.params && typeof p.params === 'object') {
          for (var pk in PARAM_LABELS) {
            var pv = p.params[pk];
            if (pv !== undefined && pv !== null && pv !== '') {
              specList.push({ label: PARAM_LABELS[pk], value: pv });
              paramList.push({ label: PARAM_LABELS[pk], value: pv });
            }
          }
        }
        /* 套装拆分价（上下装/两件套/三件套）：分→元展示 */
        var setItems = [];
        var setSumY = 0, setSumW = 0, setSumB = 0, setSumC = 0;
        if (p.params && Array.isArray(p.params.set_items)) {
          p.params.set_items.forEach(function (it) {
            var retailY = it.retail != null ? Math.round(it.retail / 100) : 0;
            var wholesaleY = it.wholesale != null ? Math.round(it.wholesale / 100) : 0;
            var bulkY = it.bulk != null ? Math.round(it.bulk / 100) : 0;
            var costY = it.cost != null ? Math.round(it.cost / 100) : 0;
            setItems.push({ name: it.name || '', retailY: retailY, wholesaleY: wholesaleY, bulkY: bulkY, costY: costY });
            setSumY += retailY;
            setSumW += wholesaleY;
            setSumB += bulkY;
            setSumC += costY;
          });
        }
        var specText = specList.map(function (s) { return s.label + '：' + s.value; }).join(' | ');
        /* 商品详情图：从 detail HTML 中提取 <img> src */
        var detailImages = [];
        if (p.detail) {
          var html = typeof p.detail === 'string' ? p.detail : '';
          var re = /<img[^>]+src=["']([^"']+)["']/gi;
          var m;
          while ((m = re.exec(html)) !== null) { detailImages.push(m[1]); }
        }
        p.detail_images = detailImages;
        /* 动力预估价（拿货会员价） */
        var estText = '';
        if (wp > 0) {
          estText = isPriceMember ? ('¥' + Math.round(wp / 100)) : '开通会员看预估价';
        }
        /* 商品标签：自定义 tags + 会员（权益标识） */
        var tags = [];
        if (Array.isArray(p.tags)) tags = tags.concat(p.tags);
        if (isPriceMember || t.data.memberTier) tags.push('会员');
        tags = tags.filter(function (v, i) { return tags.indexOf(v) === i; });
        /* 尺码 / 颜色 选项 */
        var sizeOptions = [];
        if (Array.isArray(p.sizes)) sizeOptions = p.sizes.map(String);
        else if (typeof p.sizes === 'string') sizeOptions = p.sizes.split(/[,，\/、]/).map(function (s) { return s.trim(); }).filter(Boolean);
        else if (p.size) sizeOptions = [String(p.size)];
        var colorOptions = [];
        if (Array.isArray(p.color)) colorOptions = p.color.map(String);
        else if (p.color) colorOptions = String(p.color).split(/[,，\/、]/).map(function (s) { return s.trim(); }).filter(Boolean);
        /* 各尺码默认数量（阿里巴巴式：每码独立数量） */
        var sizeQuantities = {};
        sizeOptions.forEach(function (s) { sizeQuantities[s] = 0; });
        /* 发货信息（商品级）：发货地 + 系统自动推算的预计发货日期 + 解释图片 */
        var shipFrom = p.ship_from || '';
        var shipDays = (p.ship_est_days !== undefined && p.ship_est_days !== null && p.ship_est_days !== '') ? Number(p.ship_est_days) : 0;
        var shipText = p.ship_text || '';
        var shipImage = p.ship_image || '';
        var shipEstDate = '';
        if (shipDays > 0) {
          var sd = new Date(Date.now() + shipDays * 86400000);
          shipEstDate = (sd.getMonth() + 1) + '月' + sd.getDate() + '日';
        }
        var shipSummary = '';
        if (shipFrom) shipSummary += shipFrom + (shipFrom.endsWith('发货') ? '' : '发货');
        if (shipEstDate) shipSummary += (shipSummary ? ' · ' : '') + '预计' + shipEstDate + '发出';
        if (!shipSummary && t.data.shippingNote) shipSummary = t.data.shippingNote;
        var hasProductShip = !!(shipFrom || shipEstDate || shipText || shipImage);
        /* 模特图 / 尺码表 */
        var modelImages = Array.isArray(p.model_images) ? p.model_images.filter(Boolean) : [];
        var videoUrl = p.video_url || '';
        var sizeChartImage = p.size_chart_image || '';
        /* 媒体页签：平铺为 视频 → 模特图 → 实拍图 → 尺码，统一左右滑动切换 */
        var mediaList = [];
        var mediaTabs = [];
        if (videoUrl) {
          mediaList.push({ type: 'video', src: videoUrl });
          mediaTabs.push({ key: 'video', label: '视频', start: 0 });
        }
        var modelStart = mediaList.length;
        modelImages.forEach(function (src) { mediaList.push({ type: 'model', src: src }); });
        if (modelImages.length > 0) mediaTabs.push({ key: 'model', label: '模特图', start: modelStart });
        var photoStart = mediaList.length;
        var photoSrcs = images.filter(Boolean);
        if (photoSrcs.length === 0) photoSrcs = [''];
        photoSrcs.forEach(function (src) { mediaList.push({ type: 'photo', src: src }); });
        mediaTabs.push({ key: 'photo', label: '实拍图', start: photoStart });
        var sizeStart = mediaList.length;
        if (sizeChartImage) {
          mediaList.push({ type: 'size', src: sizeChartImage });
          mediaTabs.push({ key: 'size', label: '尺码', start: sizeStart });
        }

        function tabIndexByType(type) {
          for (var i = 0; i < mediaTabs.length; i++) if (mediaTabs[i].key === type) return i;
          return 0;
        }
        var mediaTabIndex = tabIndexByType(mediaList[0] ? mediaList[0].type : 'photo');

        t.setData({
          product: p,
          images: images,
          videoUrl: videoUrl,
          modelImages: modelImages,
          sizeChartImage: sizeChartImage,
          mediaList: mediaList,
          mediaTabs: mediaTabs,
          mediaIndex: 0,
          mediaTabIndex: mediaTabIndex,
          priceText: price ? '¥' + price : '¥0',
          originalPriceText: ori ? '¥' + ori : '',
          discountText: disc,
          wholesalePriceText: wholesaleText,
          estPriceText: estText,
          tagList: tags,
          sizeOptions: sizeOptions,
          colorOptions: colorOptions,
          specList: specList,
          specText: specText,
          paramList: paramList,
          setItems: setItems,
          setSumY: setSumY,
          setSumW: setSumW,
          setSumB: setSumB,
          setSumC: setSumC,
          priceValue: priceValue,
          bulkPriceValue: bulkPriceValue,
          selectedSize: sizeOptions[0] || '',
          selectedColor: colorOptions[0] || '',
          sizeQuantities: sizeQuantities,
          shipFrom: shipFrom,
          shipDays: shipDays,
          shipEstDate: shipEstDate,
          shipText: shipText,
          shipImage: shipImage,
          shipSummary: shipSummary,
          hasProductShip: hasProductShip,
        }, function () {
          setTimeout(function () { t.measureSectionTops(); }, 500);
        });
        t.loadReviews(id);
        t.loadRec(p.category, id);
        t.loadShopRecs(p.category, id);
      }
    });
  },

  loadReviews: function (id) {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/reviews?product_id=' + id + '&limit=10',
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        t.setData({ reviews: list });
      }
    });
  },

  loadRec: function (cat, excludeId) {
    var t = this;
    var url = 'https://colour-choice.art/api/public/products?limit=10';
    if (cat) url += '&category=' + encodeURIComponent(cat);
    wx.request({
      url: url,
      method: 'GET',
      success: function (r) {
        var list = [];
        if (r.data && r.data.data) list = r.data.data || [];
        else if (Array.isArray(r.data)) list = r.data;
        if (excludeId) list = list.filter(function (x) { return x.id !== excludeId; });
        var isPM = t.data.isPriceMember;
        list.forEach(function (p) {
          var n = Number(p.price) || 0; if (n >= 100) n = Math.round(n / 100);
          var wp = Number(p.wholesale_price) || 0; if (wp >= 100) wp = Math.round(wp / 100);
          var main = (isPM && wp > 0) ? wp : n;
          p.priceLabel = '¥' + (main % 1 === 0 ? main : main.toFixed(2));
        });
        t.setData({ recList: list.slice(0, 6) });
      }
    });
  },

  // 会员等级（调 /api/user/me 取 membershipType + storeOwnerCertified）
  loadMembership: function () {
    var token = wx.getStorageSync('token') || '';
    var t = this;
    if (!token) {
      // 未登录但本地已标记认证店主，仍展示会员权益
      if (!!wx.getStorageSync('is_certified_store_owner')) {
        t.setData({ memberTier: { icon: '👁️', label: '认证店主', desc: '已认证，可查看全部商品批发价' } });
      } else {
        t.setData({ memberTier: null });
      }
      return;
    }
    wx.request({
      url: 'https://colour-choice.art/api/user/me',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: function (r) {
        var d = r.data || {};
        var mt = (d.data && d.data.membershipType) || 'none';
        var isCert = !!(d.data && d.data.storeOwnerCertified);
        var tier = MEMBER_MAP[mt] || null;
        // 认证店主等同于普通价格会员，展示会员权益
        if (isCert && !tier) {
          tier = { icon: '👁️', label: '认证店主', desc: '已认证，可查看全部商品批发价' };
        }
        t.setData({ memberTier: tier });
      },
      fail: function () { t.setData({ memberTier: null }); }
    });
  },

  // 可领优惠券模板
  loadCoupons: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/coupons/templates',
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        var list = (d.data || []).map(function (c) {
          var discountNum = (c.discount_amount / 100);
          var minNum = (c.min_amount / 100);
          return {
            id: c.id,
            title: c.title,
            discount_desc: c.discount_desc || '',
            discount_amount: c.discount_amount || 0,
            min_amount: c.min_amount || 0,
            discountLabel: discountNum,
            minLabel: c.min_amount > 0 ? minNum + '元' : '无门槛',
            displayText: c.min_amount > 0 ? ('满' + minNum + '减' + discountNum) : ('无门槛减' + discountNum),
            claimed: false,
          };
        });
        t.setData({ couponTpls: list }, function () { t.applyClaimed(); });
      }
    });
  },

  // 已领取的券（用于标记）
  loadClaimed: function () {
    var token = wx.getStorageSync('token') || '';
    if (!token) { this.setData({ claimedIds: [] }); return; }
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/coupons?status=unused',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: function (r) {
        var d = r.data || {};
        var ids = (d.data || []).filter(function (c) { return c.template_id; }).map(function (c) { return c.template_id; });
        t.setData({ claimedIds: ids }, function () { t.applyClaimed(); });
      }
    });
  },

  applyClaimed: function () {
    var claimed = {};
    (this.data.claimedIds || []).forEach(function (id) { claimed[id] = true; });
    var list = (this.data.couponTpls || []).map(function (c) {
      var n = {}; for (var k in c) n[k] = c[k]; n.claimed = !!claimed[c.id]; return n;
    });
    this.setData({ couponTpls: list });
  },

  claimCoupon: function (e) {
    var id = e.currentTarget.dataset.id;
    var ui = wx.getStorageSync('user_info') || {};
    var token = wx.getStorageSync('token') || '';
    if (!ui.id && !token) { wx.navigateTo({ url: '/pages/login/index' }); return; }
    if (this.data.claimedIds.indexOf(id) >= 0) return;
    var t = this;
    wx.showLoading({ title: '领取中...' });
    wx.request({
      url: 'https://colour-choice.art/api/coupons/claim',
      method: 'POST',
      header: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      data: { template_id: id },
      success: function (r) {
        wx.hideLoading();
        var d = r.data || {};
        if (r.statusCode === 401 || d.code === 'unauthorized') {
          wx.navigateTo({ url: '/pages/login/index' });
          return;
        }
        if (d.success) {
          var claimed = t.data.claimedIds.concat([id]);
          t.setData({ claimedIds: claimed }, function () { t.applyClaimed(); });
          wx.showToast({ title: '领取成功', icon: 'success' });
        } else if (d.code === 'already_claimed') {
          var claimed2 = t.data.claimedIds.concat([id]);
          t.setData({ claimedIds: claimed2 }, function () { t.applyClaimed(); });
          wx.showToast({ title: '已领取过', icon: 'none' });
        } else {
          wx.showToast({ title: d.error || '领取失败', icon: 'none' });
        }
      },
      fail: function () { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },

  loadCartCount: function () {
    var cart = wx.getStorageSync('cart_v2') || [];
    var count = 0;
    cart.forEach(function (i) { count += (i.quantity || 1); });
    this.setData({ cartCount: count });
  },

  loadFav: function (id) {
    var favs = wx.getStorageSync('favorites') || [];
    this.setData({ isFav: favs.indexOf(id) >= 0 });
  },

  toggleFav: function () {
    var id = this.data.productId;
    if (!id) return;
    var favs = wx.getStorageSync('favorites') || [];
    var idx = favs.indexOf(id);
    if (idx >= 0) { favs.splice(idx, 1); this.setData({ isFav: false }); wx.showToast({ title: '已取消收藏', icon: 'none' }); }
    else { favs.push(id); this.setData({ isFav: true }); wx.showToast({ title: '已收藏', icon: 'success' }); }
    wx.setStorageSync('favorites', favs);
  },

  inc: function () { this.setData({ quantity: this.data.quantity + 1 }, this.computeSkuTotal); },
  dec: function () { var q = this.data.quantity - 1; if (q < 1) q = 1; this.setData({ quantity: q }, this.computeSkuTotal); },

  addCart: function () {
    var t = this;
    var p = t.data.product;
    if (!p) return;
    if (t.data.sizeOptions.length > 0 || t.data.colorOptions.length > 0 || t.data.setItems.length > 0) {
      t.openSkuPanel('cart');
      return;
    }
    var cart = wx.getStorageSync('cart_v2') || [];
    var idx = -1;
    cart.forEach(function (i, ii) { if (i.id === p.id) idx = ii; });
    if (idx >= 0) { cart[idx].quantity = (cart[idx].quantity || 1) + t.data.quantity; }
    else { cart.push({ id: p.id, title: p.title || p.name, price: Number(p.price), wholesale_price: Number(p.wholesale_price) || 0, image: p.image_url || '', quantity: t.data.quantity }); }
    wx.setStorageSync('cart_v2', cart);
    t.loadCartCount();
    wx.showToast({ title: '已加购物车', icon: 'success' });
  },

  buyNow: function () {
    var t = this;
    var p = t.data.product;
    if (!p) return;
    // 有尺码/颜色/套装子项需选择时，先弹出「下单详情」面板，选好规格后再支付
    if (t.data.sizeOptions.length > 0 || t.data.colorOptions.length > 0 || t.data.setItems.length > 0) {
      t.openSkuPanel('buy');
      return;
    }
    // 无规格商品，直接按默认数量支付
    t.payNowWithSpecs([{ size: '', color: '', qty: t.data.quantity || 1 }]);
  },

  // 按已选规格（[{size,color,qty,setId}]）调起微信支付
  // 按已选规格（[{size,color,qty,setId}]）调起微信支付
  payNowWithSpecs: function (specs) {
    var t = this;
    var p = t.data.product;
    if (!p) return;
    if (!specs || specs.length === 0) { wx.showToast({ title: '请选择规格', icon: 'none' }); return; }
    var totalQty = 0;
    specs.forEach(function (sp) { totalQty += (sp.qty || 0); });
    if (totalQty <= 0) { wx.showToast({ title: '请选择数量', icon: 'none' }); return; }
    // 取当前所选单价（分）：套装子项取子项批发价，普通商品取会员批发价/零售价
    var unitCents = t.getUnitCents();
    var totalFee = unitCents * totalQty;
    // 规格摘要（款式/颜色/尺码/数量），便于后续订单记录
    var specStr = specs.map(function (sp) {
      return (sp.setId ? sp.setId + ' ' : '') + (sp.color ? sp.color + ' ' : '') + (sp.size ? sp.size + ' x' + sp.qty : 'x' + sp.qty);
    }).join('; ');
    app.getOpenid().then(function (openid) {
      wx.showLoading({ title: '调起支付...' });
      wx.request({
        url: 'https://colour-choice.art/api/wechat-pay/unified-order',
        method: 'POST',
        data: {
          product_id: p.id,
          product_title: p.title || p.name,
          total_fee: totalFee,
          quantity: totalQty,
          platform: 'mini',
          openid: openid,
          specs: specStr,
        },
        success: function (r) {
          wx.hideLoading();
          var d = r.data || {};
          if (d.error) { t.closeSkuPanel(); wx.showModal({ title: '下单失败', content: d.error, showCancel: false }); return; }
          var params = d.jsapi || d;
          wx.requestPayment({
            timeStamp: params.timeStamp,
            nonceStr: params.nonceStr,
            package: params.package,
            signType: params.signType || 'MD5',
            paySign: params.paySign,
            success: function () {
              t.closeSkuPanel();
              wx.showToast({ title: '支付成功', icon: 'success' });
              setTimeout(function () { wx.navigateBack(); }, 1500);
            },
            fail: function (err) {
              t.closeSkuPanel();
              if (!(err && err.errMsg && err.errMsg.indexOf('cancel') > -1)) { wx.showToast({ title: '支付取消', icon: 'none' }); }
            }
          });
        },
        fail: function () { wx.hideLoading(); t.closeSkuPanel(); wx.showToast({ title: '网络错误', icon: 'none' }); }
      });
    }).catch(function () {
      wx.showToast({ title: '无法调起微信支付', icon: 'none' });
    });
  },

  goCart: function () { wx.switchTab({ url: '/pages/cart/index' }); },
  goBack: function () { wx.navigateBack({ delta: 1 }); },
  goShop: function (e) { var id = e.currentTarget.dataset.id; if (id) wx.navigateTo({ url: '/pages/shop/index?id=' + id }); },
  goVip: function () { wx.navigateTo({ url: '/pages/vip/index' }); },

  // 发货解释页：把商品级发货信息带过去
  goShippingExplanation: function () {
    var d = this.data;
    var params = 'from=' + encodeURIComponent(d.shipFrom || '') +
      '&est=' + encodeURIComponent(d.shipEstDate || '') +
      '&days=' + encodeURIComponent(String(d.shipDays || '')) +
      '&text=' + encodeURIComponent(d.shipText || '') +
      '&image=' + encodeURIComponent(d.shipImage || '');
    wx.navigateTo({ url: '/pages/shipping-explanation/index?' + params });
  },

  // 商品/档口/详情 吸顶切换
  onPageScroll: function (e) {
    var t = this;
    var scrollTop = e.scrollTop || 0;
    var offset = t.data.customNavTotalHeightPx;
    var show = scrollTop > 100;
    var active = 'product';
    if (t.data.sectionShopTop && scrollTop >= t.data.sectionShopTop - offset) active = 'shop';
    if (t.data.sectionDetailTop && scrollTop >= t.data.sectionDetailTop - offset) active = 'detail';
    if (show !== t.data.showSectionTabs || active !== t.data.sectionActive) {
      t.setData({ showSectionTabs: show, sectionActive: active });
    }
  },
  measureSectionTops: function () {
    var t = this;
    var query = wx.createSelectorQuery();
    query.select('#section-shop').boundingClientRect();
    query.select('#section-detail').boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(function (res) {
      var shopRect = res[0] || {};
      var detailRect = res[1] || {};
      var scrollOffset = res[2] || {};
      var scrollTop = scrollOffset.scrollTop || 0;
      t.setData({
        sectionShopTop: scrollTop + (shopRect.top || 0),
        sectionDetailTop: scrollTop + (detailRect.top || 0)
      });
    });
  },
  scrollToSection: function (e) {
    var section = e.currentTarget.dataset.section;
    var t = this;
    var offset = t.data.customNavTotalHeightPx;
    var top = 0;
    if (section === 'shop') top = t.data.sectionShopTop;
    else if (section === 'detail') top = t.data.sectionDetailTop;
    wx.pageScrollTo({ scrollTop: Math.max(0, top - offset), duration: 300 });
  },

  // 店铺可编辑内容（后台 /api/public/store-content）
  loadStoreContent: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/store-content',
      method: 'GET',
      success: function (r) {
        var d = (r.data && r.data.data) || null;
        if (!d) return;
        var nextStats = t.data.shopStats;
        if (d.shop_stats && typeof d.shop_stats === 'object') {
          nextStats = {
            fans: d.shop_stats.fans || nextStats.fans,
            score: d.shop_stats.score || nextStats.score,
            repurchaseRate: d.shop_stats.repurchase_rate || d.shop_stats.repurchaseRate || nextStats.repurchaseRate,
            selectedBrand: d.shop_stats.selected_brand !== undefined ? d.shop_stats.selected_brand : nextStats.selectedBrand,
          };
        }
        t.setData({
          wholesaleGuide: Array.isArray(d.wholesale_guide) ? d.wholesale_guide : t.data.wholesaleGuide,
          sellerTips: Array.isArray(d.seller_tips) ? d.seller_tips : t.data.sellerTips,
          fabricCare: d.fabric_care || '',
          shippingNote: d.shipping_note || '',
          shopName: d.shop_name || t.data.shopName,
          shopIntro: d.intro || '',
          shopStats: nextStats,
          serviceText: d.service_text || t.data.serviceText,
          serviceGuaranteeText: d.service_guarantee_text || d.service_text || t.data.serviceGuaranteeText,
        });
      }
    });
  },

  onMediaSwiperChange: function (e) {
    var idx = e.detail.current;
    var list = this.data.mediaList;
    var type = (list[idx] && list[idx].type) || 'photo';
    var tabIdx = 0;
    for (var i = 0; i < this.data.mediaTabs.length; i++) {
      if (this.data.mediaTabs[i].key === type) { tabIdx = i; break; }
    }
    this.setData({ mediaIndex: idx, mediaTabIndex: tabIdx });
  },
  switchMediaTab: function (e) {
    var tabIdx = Number(e.currentTarget.dataset.index);
    var start = this.data.mediaTabs[tabIdx].start;
    this.setData({ mediaIndex: start, mediaTabIndex: tabIdx });
  },

  // 系列切换：最新款 / 最爆款
  switchSeries: function (e) {
    var type = e.currentTarget.dataset.type;
    if (type === this.data.seriesActive) return;
    this.setData({ seriesActive: type });
  },

  goShelf: function () {
    var id = this.data.shelfId || 'a161744a-aec1-4849-875f-dcebe52ff91c';
    wx.navigateTo({ url: '/pages/shelf/index?id=' + id });
  },

  // 拉取买手选品货架 block，取 banner 图用于商品页入口卡片
  loadShelfBanner: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/blocks',
      method: 'GET',
      success: function (r) {
        var list = (r.data && r.data.data) || [];
        var block = null;
        for (var i = 0; i < list.length; i++) {
          if (list[i].type === 'shelf') {
            if (list[i].title === '买手选品') { block = list[i]; break; }
            if (!block) block = list[i];
          }
        }
        if (block) {
          var img = (block.content && block.content.image) || '';
          var upd = { shelfId: block.id };
          if (img) upd.shelfBanner = img;
          if (block.title) upd.shelfTitle = block.title;
          t.setData(upd);
        }
      }
    });
  },

  // 店铺推荐位（对标一手：档口最新款 / 档口大爆款 / 新人推荐）
  loadShopRecs: function (cat, excludeId) {
    var t = this;
    var normalize = function (list) {
      var isPM = t.data.isPriceMember;
      list.forEach(function (p) {
        var n = Number(p.price) || 0;
        if (n >= 100) n = Math.round(n / 100);
        var wp = Number(p.wholesale_price) || 0;
        if (wp >= 100) wp = Math.round(wp / 100);
        var main = (isPM && wp > 0) ? wp : n;
        p.priceLabel = '¥' + (main % 1 === 0 ? main : main.toFixed(2));
      });
    };
    var finish = function (list, isFallback) {
      if (excludeId) list = list.filter(function (x) { return x.id !== excludeId; });
      normalize(list);
      var latest = list.slice(0, 6);
      var hot = list.slice().sort(function (a, b) { return (Number(b.sales) || 0) - (Number(a.sales) || 0); }).slice(0, 6);
      t.setData({ shopRecLatest: latest, shopRecHot: hot });
      if (latest.length === 0 && hot.length === 0 && cat && !isFallback) {
        doFallback();
      }
    };
    var doFallback = function () {
      wx.request({
        url: 'https://colour-choice.art/api/public/products?limit=20',
        method: 'GET',
        success: function (r2) {
          var list2 = (r2.data && r2.data.data) || [];
          finish(list2, true);
        },
        fail: function () { finish([], true); }
      });
    };
    var url = 'https://colour-choice.art/api/public/products?limit=20';
    if (cat) url += '&category=' + encodeURIComponent(cat);
    wx.request({
      url: url,
      method: 'GET',
      success: function (r) {
        var list = (r.data && r.data.data) || [];
        if (list.length === 0 && cat) {
          doFallback();
          return;
        }
        finish(list, false);
      },
      fail: function () { doFallback(); }
    });
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=10',
      method: 'GET',
      success: function (r) {
        var list2 = (r.data && r.data.data) || [];
        var isPM2 = t.data.isPriceMember;
        list2.forEach(function (p) {
          var n = Number(p.price) || 0; if (n >= 100) n = Math.round(n / 100);
          var wp = Number(p.wholesale_price) || 0; if (wp >= 100) wp = Math.round(wp / 100);
          var main = (isPM2 && wp > 0) ? wp : n;
          p.priceLabel = '¥' + (main % 1 === 0 ? main : main.toFixed(2));
        });
        t.setData({ shopRecNewbie: list2.slice(0, 6) });
      }
    });
  },

  selectSize: function (e) { this.setData({ selectedSize: e.currentTarget.dataset.v }); },
  selectColor: function (e) { this.setData({ selectedColor: e.currentTarget.dataset.v }); },

  onTryon: function () {
    var t = this;
    var images = t.data.images || [];
    var garment = images[0] || (t.data.product && t.data.product.image_url) || '';
    if (!garment) { wx.showToast({ title: '暂无商品图', icon: 'none' }); return; }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var personPath = res.tempFiles[0].tempFilePath;
        t.setData({ tryonLoading: true });
        wx.uploadFile({
          url: 'https://embodied-ai-eight.vercel.app/api/virtual-tryon',
          filePath: personPath,
          name: 'personImage',
          formData: { garmentImageUrl: garment, industry: 'clothing' },
          success: function (up) {
            var data = {};
            try { data = JSON.parse(up.data); } catch (e) { }
            if (data.ok) {
              t.setData({ tryonLoading: false, tryonResult: data.resultUrl, tryonIsDemo: !!data.demo, showTryon: true });
            } else {
              t.setData({ tryonLoading: false });
              wx.showToast({ title: (data.error || '试穿失败'), icon: 'none' });
            }
          },
          fail: function () {
            t.setData({ tryonLoading: false });
            wx.showToast({ title: '试穿请求失败', icon: 'none' });
          }
        });
      }
    });
  },

  closeTryon: function () { this.setData({ showTryon: false }); },
  stopProp: function () { },

  // ===== 优惠明细弹窗 =====
  openCouponPanel: function () { this.setData({ showCouponPanel: true }); },
  closeCouponPanel: function () { this.setData({ showCouponPanel: false }); },
  stopCouponPanelProp: function () { },

  // ===== 下单详情 / SKU 弹窗（阿里巴巴式：款式/颜色单选 + 尺码每码独立数量 + 底部总价） =====
  openSkuPanel: function (mode) {
    var t = this;
    var sq = {};
    t.data.sizeOptions.forEach(function (s) { sq[s] = t.data.sizeQuantities[s] || 0; });
    var firstColor = t.data.selectedColor || t.data.colorOptions[0] || '';
    var firstSet = t.data.setItems.length > 0 ? t.data.setItems[0].name : '';
    t.setData({
      showSkuPanel: true,
      skuMode: mode === 'buy' ? 'buy' : 'cart',
      selectedColor: firstColor,
      selectedSetItem: firstSet,
      sizeQuantities: sq,
      quantity: 1,
    }, function () { t.updateSkuPrice(); t.computeSkuTotal(); });
  },
  closeSkuPanel: function () { this.setData({ showSkuPanel: false }); },
  stopSkuPanelProp: function () { },
  selectSetItem: function (e) {
    var t = this;
    t.setData({ selectedSetItem: e.currentTarget.dataset.v }, function () { t.updateSkuPrice(); t.computeSkuTotal(); });
  },
  incSkuSize: function (e) {
    var s = e.currentTarget.dataset.s;
    var sq = this.data.sizeQuantities;
    var n = {};
    for (var k in sq) n[k] = sq[k];
    n[s] = (n[s] || 0) + 1;
    this.setData({ sizeQuantities: n }, this.computeSkuTotal);
  },
  decSkuSize: function (e) {
    var s = e.currentTarget.dataset.s;
    var sq = this.data.sizeQuantities;
    if (!sq[s] || sq[s] <= 0) return;
    var n = {};
    for (var k in sq) n[k] = sq[k];
    n[s] = n[s] - 1;
    this.setData({ sizeQuantities: n }, this.computeSkuTotal);
  },
  // 当前所选商品单价（分）
  getUnitCents: function () {
    var t = this;
    var p = t.data.product;
    if (!p) return 0;
    if (t.data.setItems.length > 0 && t.data.selectedSetItem) {
      var raw = (p.params && Array.isArray(p.params.set_items)) ? p.params.set_items : [];
      for (var i = 0; i < raw.length; i++) {
        if (raw[i].name === t.data.selectedSetItem) return Number(raw[i].wholesale) || 0;
      }
    }
    var wp = Number(p.wholesale_price) || 0;
    if (t.data.isPriceMember && wp > 0) return Math.round(wp / 100) * 100;
    return Number(p.price);
  },
  // 面板价格随所选款式变化，并计算底部总价
  updateSkuPrice: function () {
    var t = this;
    var isPM = t.data.isPriceMember;
    var yuan = 0, bulkYuan = 0;
    if (t.data.setItems.length > 0 && t.data.selectedSetItem) {
      for (var i = 0; i < t.data.setItems.length; i++) {
        var si = t.data.setItems[i];
        if (si.name === t.data.selectedSetItem) {
          yuan = isPM ? si.wholesaleY : si.retailY;
          bulkYuan = isPM ? si.bulkY : 0;
          break;
        }
      }
    } else {
      yuan = t.data.priceValue;
      bulkYuan = isPM ? t.data.bulkPriceValue : 0;
    }
    t.setData({ skuPriceValue: yuan || 0, skuBulkValue: bulkYuan || 0 });
  },
  computeSkuTotal: function () {
    var t = this;
    var totalQty;
    if (t.data.sizeOptions.length > 0) {
      totalQty = 0;
      var sq = t.data.sizeQuantities;
      for (var k in sq) totalQty += (sq[k] || 0);
    } else {
      totalQty = t.data.quantity || 1;
    }
    var unitCents = t.getUnitCents();
    t.setData({ skuTotal: totalQty, skuTotalPrice: Math.round(unitCents * totalQty / 100) });
  },
  confirmSkuPanel: function () {
    var t = this;
    var p = t.data.product;
    if (!p) { t.closeSkuPanel(); return; }
    var specs = [];
    if (t.data.sizeOptions.length > 0) {
      // 阿里巴巴式：每码独立数量
      var sq = t.data.sizeQuantities;
      for (var s in sq) if (sq[s] > 0) { specs.push({ size: s, color: t.data.selectedColor || '', qty: sq[s], setId: t.data.selectedSetItem || '' }); }
      if (specs.length === 0) { t.closeSkuPanel(); return; }
    } else {
      // 无尺码：单一数量
      var q = t.data.quantity || 1;
      if (q <= 0) { t.closeSkuPanel(); return; }
      specs.push({ size: '', color: t.data.selectedColor || '', qty: q, setId: t.data.selectedSetItem || '' });
    }
    if (t.data.setItems.length > 0 && !t.data.selectedSetItem) { wx.showToast({ title: '请选择款式', icon: 'none' }); return; }
    if (t.data.colorOptions.length > 0 && t.data.setItems.length === 0 && !t.data.selectedColor) { wx.showToast({ title: '请选择颜色', icon: 'none' }); return; }
    // 立即购买模式：构建带规格的订单并支付
    if (t.data.skuMode === 'buy') {
      t.payNowWithSpecs(specs);
      return;
    }
    // 加入进货车模式
    var cart = wx.getStorageSync('cart_v2') || [];
    var title = p.title || p.name;
    if (t.data.selectedSetItem) title = title + ' ' + t.data.selectedSetItem;
    var unitCents = t.getUnitCents();
    specs.forEach(function (sp) {
      var key = p.id + '|' + sp.size + '|' + sp.color + '|' + sp.setId;
      var existingIdx = -1;
      cart.forEach(function (i, ii) {
        var ik = i.id + '|' + (i.size || '') + '|' + (i.color || '') + '|' + (i.setId || '');
        if (ik === key) existingIdx = ii;
      });
      if (existingIdx >= 0) { cart[existingIdx].quantity = (cart[existingIdx].quantity || 0) + sp.qty; }
      else { cart.push({ id: p.id, setId: sp.setId || '', title: title, price: unitCents, wholesale_price: unitCents, image: p.image_url || '', size: sp.size || '', color: sp.color || '', quantity: sp.qty }); }
    });
    wx.setStorageSync('cart_v2', cart);
    var totalQty = specs.reduce(function (a, b) { return a + b.qty; }, 0);
    t.setData({ showSkuPanel: false, quantity: totalQty }, function () {
      t.loadCartCount();
      wx.showToast({ title: '已加购物车', icon: 'success' });
    });
  },

  // ===== 尺码图弹窗 =====
  showSizeChart: function () { this.setData({ showSizeChart: true }); },
  closeSizeChart: function () { this.setData({ showSizeChart: false }); },
  stopSizeChartProp: function () { },

  onShareAppMessage: function () {
    var p = this.data.product || {};
    return {
      title: p.title || p.name || '骆芷蝶智选',
      path: '/pages/shop/index?id=' + this.data.productId,
      imageUrl: p.image_url || ''
    };
  },
});

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
  wholesale_30w: { icon: '📦', label: '拿货会员·充30万', desc: '2.8折拿货 · 退换20%' },
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
  },

  onLoad: function (opt) {
    var app = getApp();
    var sys = wx.getSystemInfoSync();
    var pxPerRpx = sys.windowWidth / 750;
    var navBarHeightPx = Math.round(88 * pxPerRpx);
    var tabsHeightPx = Math.round(80 * pxPerRpx);
    this.setData({
      productId: opt.id || '',
      isPriceMember: !!(app && app.globalData && app.globalData.isPriceMember),
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
        list.forEach(function (p) { var n = Number(p.price) || 0; if (n >= 100) n = Math.round(n / 100); p.priceLabel = '¥' + n; });
        t.setData({ recList: list.slice(0, 6) });
      }
    });
  },

  // 会员等级（调 /api/user/me 取 membershipType）
  loadMembership: function () {
    var ui = wx.getStorageSync('user_info') || {};
    if (!ui.id) { this.setData({ memberTier: null }); return; }
    var token = wx.getStorageSync('token') || '';
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/user/me',
      method: 'GET',
      header: { 'Authorization': 'Bearer ' + token },
      success: function (r) {
        var d = r.data || {};
        var mt = (d.data && d.data.membershipType) || 'none';
        t.setData({ memberTier: MEMBER_MAP[mt] || null });
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
          return {
            id: c.id,
            title: c.title,
            discount_desc: c.discount_desc || '',
            discount_amount: c.discount_amount || 0,
            min_amount: c.min_amount || 0,
            discountLabel: (c.discount_amount / 100),
            minLabel: c.min_amount > 0 ? '满' + (c.min_amount / 100) + '元' : '无门槛',
            claimed: false,
          };
        });
        t.setData({ couponTpls: list }, function () { t.applyClaimed(); });
      }
    });
  },

  // 已领取的券（用于标记）
  loadClaimed: function () {
    var ui = wx.getStorageSync('user_info') || {};
    if (!ui.id) { this.setData({ claimedIds: [] }); return; }
    var token = wx.getStorageSync('token') || '';
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/coupons?user_id=' + ui.id + '&status=unused',
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
    if (!ui.id) { wx.navigateTo({ url: '/pages/login/index' }); return; }
    if (this.data.claimedIds.indexOf(id) >= 0) return;
    var token = wx.getStorageSync('token') || '';
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

  inc: function () { this.setData({ quantity: this.data.quantity + 1 }); },
  dec: function () { var q = this.data.quantity - 1; if (q < 1) q = 1; this.setData({ quantity: q }); },

  addCart: function () {
    var t = this;
    var p = this.data.product;
    if (!p) return;
    var cart = wx.getStorageSync('cart_v2') || [];
    var idx = -1;
    cart.forEach(function (i, ii) { if (i.id === p.id) idx = ii; });
    if (idx >= 0) { cart[idx].quantity = (cart[idx].quantity || 1) + t.data.quantity; }
    else { cart.push({ id: p.id, title: p.title || p.name, price: Number(p.price), image: p.image_url || '', quantity: t.data.quantity }); }
    wx.setStorageSync('cart_v2', cart);
    t.loadCartCount();
    wx.showToast({ title: '已加购物车', icon: 'success' });
  },

  buyNow: function () {
    var t = this;
    var p = this.data.product;
    if (!p) return;
    app.getOpenid().then(function (openid) {
      wx.showLoading({ title: '调起支付...' });
      wx.request({
        url: 'https://colour-choice.art/api/wechat-pay/unified-order',
        method: 'POST',
        data: {
          product_id: p.id,
          product_title: p.title || p.name,
          total_fee: Number(p.price),
          quantity: t.data.quantity,
          platform: 'mini',
          openid: openid,
        },
        success: function (r) {
          wx.hideLoading();
          var d = r.data || {};
          if (d.error) { wx.showModal({ title: '下单失败', content: d.error, showCancel: false }); return; }
          var params = d.jsapi || d;
          wx.requestPayment({
            timeStamp: params.timeStamp,
            nonceStr: params.nonceStr,
            package: params.package,
            signType: params.signType || 'MD5',
            paySign: params.paySign,
            success: function () { wx.showToast({ title: '支付成功', icon: 'success' }); setTimeout(function () { wx.navigateBack(); }, 1500); },
            fail: function (err) { if (!(err && err.errMsg && err.errMsg.indexOf('cancel') > -1)) { wx.showToast({ title: '支付取消', icon: 'none' }); } }
          });
        },
        fail: function () { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
      });
    }).catch(function () {
      wx.showToast({ title: '无法调起微信支付', icon: 'none' });
    });
  },

  goCart: function () { wx.switchTab({ url: '/pages/cart/index' }); },
  goBack: function () { wx.navigateBack({ delta: 1 }); },
  goShop: function (e) { var id = e.currentTarget.dataset.id; if (id) wx.navigateTo({ url: '/pages/shop/index?id=' + id }); },
  goVip: function () { wx.navigateTo({ url: '/pages/vip/index' }); },

  // 商品/档口/详情 吸顶切换
  onPageScroll: function (e) {
    var t = this;
    var scrollTop = e.scrollTop || 0;
    var offset = t.data.customNavTotalHeightPx + t.data.tabsHeightPx;
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
    var offset = t.data.customNavTotalHeightPx + t.data.tabsHeightPx;
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
        t.setData({
          wholesaleGuide: Array.isArray(d.wholesale_guide) ? d.wholesale_guide : t.data.wholesaleGuide,
          sellerTips: Array.isArray(d.seller_tips) ? d.seller_tips : t.data.sellerTips,
          fabricCare: d.fabric_care || '',
          shippingNote: d.shipping_note || '',
          shopName: d.shop_name || t.data.shopName,
          shopIntro: d.intro || '',
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

  goShelf: function () { wx.switchTab({ url: '/pages/shelf/index' }); },

  // 店铺推荐位（对标一手：档口最新款 / 档口大爆款 / 新人推荐）
  loadShopRecs: function (cat, excludeId) {
    var t = this;
    var url = 'https://colour-choice.art/api/public/products?limit=10';
    if (cat) url += '&category=' + encodeURIComponent(cat);
    wx.request({
      url: url,
      method: 'GET',
      success: function (r) {
        var list = (r.data && r.data.data) || [];
        if (excludeId) list = list.filter(function (x) { return x.id !== excludeId; });
        list.forEach(function (p) { var n = Number(p.price) || 0; if (n >= 100) n = Math.round(n / 100); p.priceLabel = '¥' + n; });
        var latest = list.slice(0, 6);
        var hot = list.slice().sort(function (a, b) { return (Number(b.sales) || 0) - (Number(a.sales) || 0); }).slice(0, 6);
        t.setData({ shopRecLatest: latest, shopRecHot: hot });
      }
    });
    wx.request({
      url: 'https://colour-choice.art/api/public/products?limit=10',
      method: 'GET',
      success: function (r) {
        var list2 = (r.data && r.data.data) || [];
        list2.forEach(function (p) { var n = Number(p.price) || 0; if (n >= 100) n = Math.round(n / 100); p.priceLabel = '¥' + n; });
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
});

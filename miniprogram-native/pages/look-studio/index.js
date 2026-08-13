var app = getApp();
var BASE = 'https://colour-choice.art';

function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  u = u.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
  return u;
}

// 试衣套餐（与网站 /api/tryon/create 服务端定价一致）
var PACKAGES = [
  { id: 'tryon_first_1yuan', name: '首单体验', price: 1, unit: '次', desc: '新人专享 1 次整体造型', type: 'first', days: 365, tries: 1, highlight: true },
  { id: 'tryon_monthly_99', name: '包月畅试', price: 99, unit: '月', desc: '30 天 150 次试穿 + 高清下载', type: 'month', days: 30, tries: 150 },
  { id: 'tryon_quarter_199', name: '季卡', price: 199, unit: '季', desc: '90 天 400 次 + 优先新款', type: 'quarter', days: 90, tries: 400 },
  { id: 'tryon_year_699', name: '年卡', price: 699, unit: '年', desc: '365 天 1000 次 + 专属顾问', type: 'year', days: 365, tries: 1000 },
];

// 价格：数据库按分存，展示为元
function fmtPrice(n) {
  if (n == null) return '0';
  var yuan = Math.round(n) / 100;
  // 去掉无意义的 .00
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
}

// —— 权益缓存（服务端为权威，localStorage 仅作即时缓存）——
function getCacheEnt() { try { return wx.getStorageSync('tryon_entitlement') || null; } catch (e) { return null; } }
function setCacheEnt(e) { try { wx.setStorageSync('tryon_entitlement', e); } catch (e) {} }
function isActiveEnt(e) { return !!(e && e.active); }
function getAuth() { try { return wx.getStorageSync('tryon_auth_agreed') || false; } catch (e) { return false; } }
function setAuth(v) { try { wx.setStorageSync('tryon_auth_agreed', v); } catch (e) {} }

Page({
  data: {
    seasons: [],
    mainStyles: [],
    products: [],
    lookCards: [],
    buyerProducts: [],
    browseProducts: [],
    mode: 'look',
    mySeason: '',
    myStyle: '',
    personPath: '',
    tray: [],
    buyerStyle: '',
    filterSeason: '',
    loading: false,
    resultUrl: '',
    resultCredits: 0,
    showResult: false,
    // —— 普及 / 专业 分层 ——
    proMode: false,
    categories: [],
    category: '',
    // —— 付费墙 / 推广 / 合规 ——
    packages: PACKAGES,
    showPackages: false,
    promo: false,
    isPass: false,
    passText: '未开通 · 首单 ¥1 体验',
    agreedAuth: false,
    showShopPick: false,
  },

  onLoad: function (options) {
    if (options && options.promo) { this.setData({ promo: true }); }
    if (options && options.pro) { this.setData({ proMode: true }); }
    this.setData({ agreedAuth: getAuth() });
    this.syncEntitlement();
    this.loadData();
  },

  // 从服务端拉取权益（权威），并写入缓存 + 刷新 UI
  syncEntitlement: function () {
    var self = this;
    return app.getOpenid().then(function (openid) {
      return new Promise(function (resolve) {
        wx.request({
          url: BASE + '/api/tryon/entitlement?openid=' + encodeURIComponent(openid),
          success: function (r) {
            var d = r.data || {};
            if (typeof d.active === 'boolean') { setCacheEnt(d); self.applyEntitlement(d); }
            resolve(d);
          },
          fail: function () { resolve(getCacheEnt()); }
        });
      });
    }).catch(function () { return Promise.resolve(getCacheEnt()); });
  },

  applyEntitlement: function (d) {
    var txt;
    if (!d.active) {
      txt = '未开通 · 首单 ¥1 体验';
    } else if (d.type === 'first') {
      txt = '首单体验剩余 ' + (d.triesLeft || 0) + ' 次';
    } else {
      var days = d.daysLeft || 0;
      var tries = d.triesLeft || 0;
      var label = d.type === 'month' ? '包月' : d.type === 'quarter' ? '季卡' : '年卡';
      txt = label + '剩余 ' + days + ' 天 · ' + tries + ' 次';
    }
    this.setData({ passText: txt, isPass: d.active });
  },

  loadData: function () {
    var t = this;
    wx.request({
      url: BASE + '/api/public/look-studio',
      success: function (r) {
        var d = r.data || {};
        if (d.error) { wx.showToast({ title: '数据加载失败', icon: 'none' }); return; }
        var seasons = d.seasons || [];
        var styles = d.styles || [];
        var productsRaw = d.products || [];
        var seasonMap = {}; seasons.forEach(function (s) { seasonMap[s.code] = s.name_zh; });
        var styleMap = {}; styles.forEach(function (s) { styleMap[s.code] = s.name_zh; });

        var products = productsRaw.map(function (p) {
          return {
            id: p.id, title: p.title, price: fmtPrice(p.price), cover: p.cover,
            seasons: p.seasons || [], styles: p.styles || [], category: p.category || '',
            seasonNames: (p.seasons || []).slice(0, 2).map(function (c) { return seasonMap[c] || c; }),
            styleNames: (p.styles || []).slice(0, 1).map(function (c) { return styleMap[c] || c; }),
          };
        });

        var mainStyles = styles.filter(function (s) { return s.is_main; })
          .map(function (s) { return { code: s.code, name_zh: s.name_zh, gender: s.gender }; });

        var lookCards = mainStyles.map(function (m) {
          var items = products.filter(function (p) { return p.styles.indexOf(m.code) >= 0; }).slice(0, 4);
          return { code: m.code, name_zh: m.name_zh, gender: m.gender, items: items };
        }).filter(function (c) { return c.items.length > 0; });

        var catCount = {};
        products.forEach(function (p) { if (p.category) catCount[p.category] = (catCount[p.category] || 0) + 1; });
        var categories = Object.keys(catCount).sort(function (a, b) { return catCount[b] - catCount[a]; });

        var defBuyer = (mainStyles[0] && mainStyles[0].code) || '';
        t._seasonMap = seasonMap; t._styleMap = styleMap;
        t.setData({
          seasons: seasons, mainStyles: mainStyles, products: products, lookCards: lookCards,
          categories: categories,
          buyerStyle: defBuyer, buyerProducts: t.computeBuyer(defBuyer, products),
          browseProducts: products,
        });
      },
      fail: function () { wx.showToast({ title: '网络错误', icon: 'none' }); }
    });
  },

  computeBuyer: function (code, products) {
    products = products || this.data.products;
    if (!code) return [];
    return products.filter(function (p) { return p.styles.indexOf(code) >= 0; });
  },
  computeBrowse: function (season, products) {
    products = products || this.data.products;
    if (!season) return products;
    return products.filter(function (p) { return p.seasons.indexOf(season) >= 0; });
  },
  computeByCat: function (cat, products) {
    products = products || this.data.products;
    if (!cat) return products;
    return products.filter(function (p) { return p.category === cat; });
  },

  choosePerson: function () {
    var t = this;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0];
        if (f) t.setData({ personPath: f.tempFilePath });
      }
    });
  },

  // —— 普通版：上传自己的衣服图 ——
  chooseCloth: function () {
    var t = this;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0];
        if (!f) return;
        wx.showLoading({ title: '上传衣服图...' });
        wx.uploadFile({
          url: BASE + '/api/upload',
          filePath: f.tempFilePath,
          name: 'file',
          success: function (up) {
            wx.hideLoading();
            var d; try { d = JSON.parse(up.data); } catch (e) { d = {}; }
            var url = d.url || (d.data && d.data.url);
            if (!url) { wx.showToast({ title: '上传失败', icon: 'none' }); return; }
            var item = { id: 'cloth_' + Date.now(), title: '上传的衣服', cover: url, price: '', seasons: [], styles: [], category: '' };
            t.setData({ tray: t.data.tray.concat([item]) });
            wx.showToast({ title: '已加入造型', icon: 'none' });
          },
          fail: function () { wx.hideLoading(); wx.showToast({ title: '上传失败', icon: 'none' }); }
        });
      }
    });
  },

  // —— 普及版：AI 帮我搭（后台复用专业匹配，话术说人话）——
  smartPick: function () {
    var cards = this.data.lookCards;
    var tray = cards.length ? cards[0].items.slice() : this.data.products.slice(0, 4);
    this.setData({ tray: tray });
    wx.showToast({ title: '已为你搭好一套', icon: 'none' });
  },

  setCategory: function (e) {
    var c = e.currentTarget.dataset.c;
    this.setData({ category: c, browseProducts: this.computeByCat(c, this.data.products) });
  },
  openShopPick: function () { this.setData({ showShopPick: true }); },
  closeShopPick: function () { this.setData({ showShopPick: false }); },

  // —— 合规：肖像授权勾选 ——
  toggleAuth: function () {
    var v = !this.data.agreedAuth;
    setAuth(v);
    this.setData({ agreedAuth: v });
  },

  // —— 专业版开关（开通权益后解锁）——
  togglePro: function () {
    var self = this;
    if (!this.data.proMode && !this.data.isPass) {
      wx.showModal({
        title: '专业风格顾问',
        content: '开通试衣套餐后解锁：21 题穿衣风格诊断 + 按风格一键生成专属造型。',
        confirmText: '去开通', cancelText: '暂不需要',
        success: function (r) { if (r.confirm) self.openPackages(); }
      });
      return;
    }
    this.setData({ proMode: !this.data.proMode, mode: 'look' });
  },

  switchToBasic: function () { this.setData({ proMode: false }); },
  switchToPro: function () {
    var self = this;
    if (!this.data.isPass) {
      wx.showModal({
        title: '专业版',
        content: '专业版含 21 题穿衣风格诊断与 AI 按风格生成造型。开通任意套餐后即可使用。',
        confirmText: '去开通', cancelText: '暂不需要',
        success: function (r) { if (r.confirm) self.openPackages(); }
      });
      return;
    }
    this.setData({ proMode: true, mode: 'look' });
  },

  setMode: function (e) { this.setData({ mode: e.currentTarget.dataset.m }); },
  setMySeason: function (e) { this.setData({ mySeason: e.currentTarget.dataset.c }); },
  setMyStyle: function (e) { this.setData({ myStyle: e.currentTarget.dataset.c }); },
  setBuyer: function (e) {
    var c = e.currentTarget.dataset.c;
    this.setData({ buyerStyle: c, buyerProducts: this.computeBuyer(c, this.data.products) });
  },
  setFilter: function (e) {
    var c = e.currentTarget.dataset.c;
    this.setData({ filterSeason: c, browseProducts: this.computeBrowse(c, this.data.products) });
  },

  addTray: function (e) {
    var id = e.currentTarget.dataset.id;
    var p = this.data.products.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    if (this.data.tray.some(function (x) { return x.id === id; })) return;
    this.setData({ tray: this.data.tray.concat([p]) });
  },
  removeTray: function (e) {
    var id = e.currentTarget.dataset.id;
    this.setData({ tray: this.data.tray.filter(function (x) { return x.id !== id; }) });
  },
  loadLook: function (e) {
    var code = e.currentTarget.dataset.code;
    var card = this.data.lookCards.filter(function (c) { return c.code === code; })[0];
    if (card) this.setData({ tray: card.items.slice() });
    wx.showToast({ title: '已装入我的造型', icon: 'none' });
  },

  score: function (p, sc, st) {
    var s = 0;
    (p.seasons || []).forEach(function (x) { if (sc.indexOf(x) >= 0) s += 2; });
    (p.styles || []).forEach(function (x) { if (st.indexOf(x) >= 0) s += 1; });
    return s;
  },
  autoGenerate: function () {
    var t = this;
    var sc = this.data.mySeason ? [this.data.mySeason] : [];
    var st = this.data.myStyle ? [this.data.myStyle] : [];
    if (!sc.length && !st.length) { wx.showToast({ title: '请先在「我的形象」选季型/风格', icon: 'none' }); return; }
    var ranked = this.data.products.map(function (p) { return { p: p, s: t.score(p, sc, st) }; })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 4).map(function (x) { return x.p; });
    if (!ranked.length) { wx.showToast({ title: '暂无匹配单品', icon: 'none' }); return; }
    this.setData({ tray: ranked, mode: 'auto' });
  },

  // —— 套餐面板 ——
  openPackages: function () { this.setData({ showPackages: true }); },
  closePackages: function () { this.setData({ showPackages: false }); },
  noop: function () {},

  buyPackage: function (e) {
    var id = e.currentTarget.dataset.id;
    var pkg = null;
    for (var i = 0; i < PACKAGES.length; i++) { if (PACKAGES[i].id === id) { pkg = PACKAGES[i]; break; } }
    if (!pkg) return;
    this.payFor(pkg);
  },

  // 调服务端建单 + 微信支付（金额由服务端定，防篡改）
  payFor: function (pkg) {
    var t = this;
    wx.showLoading({ title: '调起支付...' });
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/tryon/create',
        method: 'POST',
        data: { package_id: pkg.id, openid: openid },
        success: function (r) {
          wx.hideLoading();
          var d = r.data || {};
          if (d.error) { wx.showModal({ title: '下单失败', content: d.error, showCancel: false }); return; }
          wx.requestPayment({
            timeStamp: d.timeStamp, nonceStr: d.nonceStr, package: d.package,
            signType: d.signType || 'MD5', paySign: d.paySign,
            success: function () {
              // 乐观开通（服务端 notify 异步发放，稍后同步覆盖）
              var optimistic = { active: true, type: pkg.type, daysLeft: pkg.days || 365, triesLeft: pkg.tries || 1 };
              setCacheEnt(optimistic); t.applyEntitlement(optimistic);
              t.setData({ showPackages: false, proMode: false });
              wx.showToast({ title: '已开通，去试衣', icon: 'success' });
              setTimeout(function () { t.syncEntitlement(); }, 4000);
            },
            fail: function (err) {
              if (!(err && err.errMsg && err.errMsg.indexOf('cancel') > -1)) {
                wx.showToast({ title: '支付失败', icon: 'none' });
              }
            }
          });
        },
        fail: function () { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
      });
    }).catch(function () {
      wx.hideLoading();
      wx.showToast({ title: '无法调起微信支付', icon: 'none' });
    });
  },

  doTryOn: function () {
    if (!this.data.agreedAuth) {
      wx.showModal({
        title: '需同意肖像授权',
        content: '试衣需先勾选「肖像使用授权」：你的照片仅用于本次 AI 合成，不会公开。',
        confirmText: '去勾选', cancelText: '取消',
        success: function (r) { if (r.confirm) { /* 引导到上方勾选框 */ } }
      });
      return;
    }
    if (!this.data.personPath) { wx.showToast({ title: '请先上传你的照片', icon: 'none' }); return; }
    if (this.data.tray.length === 0) { wx.showToast({ title: '请先添加单品', icon: 'none' }); return; }

    var t = this;
    wx.showLoading({ title: '校验权益...' });
    t.syncEntitlement().then(function (ent) {
      wx.hideLoading();
      if (!isActiveEnt(ent)) { t.setData({ showPackages: true }); return; }
      t.runTryOn(ent);
    });
  },

  runTryOn: function (ent) {
    var t = this;
    var products = this.data.tray.map(function (p) { return { url: p.cover, title: p.title }; });
    this.setData({ loading: true });
    wx.showLoading({ title: '生成整体造型...' });
    wx.uploadFile({
      url: BASE + '/svc/tryon/api/multi-tryon',
      filePath: this.data.personPath,
      name: 'personImage',
      formData: { products: JSON.stringify(products), userId: 'mini' },
      success: function (res) {
        wx.hideLoading();
        var d;
        try { d = JSON.parse(res.data); } catch (e) { d = {}; }
        if (d.error) { wx.showModal({ title: '试衣失败', content: d.error, showCancel: false }); t.setData({ loading: false }); return; }
        // 每次成功试衣扣减 1 次（首单/订阅统一按次数计费）
        if (ent && ent.active) {
          app.getOpenid().then(function (openid) {
            wx.request({ url: BASE + '/api/tryon/entitlement', method: 'POST', data: { openid: openid } });
          }).catch(function () {});
        }
        t.syncEntitlement();
        t.setData({ resultUrl: rewriteSupabase(d.resultUrl), resultCredits: d.credits || products.length, showResult: true, loading: false });
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        t.setData({ loading: false });
      }
    });
  },

  closeResult: function () { this.setData({ showResult: false }); },
  previewResult: function () {
    if (this.data.resultUrl) wx.previewImage({ urls: [this.data.resultUrl], current: this.data.resultUrl });
  },

  saveResult: function () {
    var url = this.data.resultUrl;
    if (!url) return;
    wx.showLoading({ title: '保存中...' });
    wx.downloadFile({
      url: url,
      success: function (r) {
        wx.hideLoading();
        if (r.statusCode !== 200) { wx.showToast({ title: '保存失败', icon: 'none' }); return; }
        wx.saveImageToPhotosAlbum({
          filePath: r.tempFilePath,
          success: function () { wx.showToast({ title: '已保存到相册', icon: 'success' }); },
          fail: function () { wx.showToast({ title: '保存失败，请授权相册', icon: 'none' }); }
        });
      },
      fail: function () { wx.hideLoading(); wx.showToast({ title: '下载失败', icon: 'none' }); }
    });
  },
});

var app = getApp();
var BASE = 'https://colour-choice.art';

function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  u = u.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
  return u;
}

// 试衣套餐（与网站 /tryon 定价一致）
var PACKAGES = [
  { id: 'tryon_first_1yuan', name: '首单体验', price: 1, unit: '次', desc: '新人专享 1 次整体造型', type: 'first', tries: 1, highlight: true },
  { id: 'tryon_monthly_99', name: '包月畅试', price: 99, unit: '月', desc: '30 天无限次试穿 + 高清下载', type: 'month', days: 30 },
  { id: 'tryon_quarter_199', name: '季卡', price: 199, unit: '季', desc: '90 天无限次 + 优先新款', type: 'quarter', days: 90 },
  { id: 'tryon_year_699', name: '年卡', price: 699, unit: '年', desc: '365 天无限次 + 专属顾问', type: 'year', days: 365 },
];

function getPass() {
  try { return wx.getStorageSync('tryon_pass') || null; } catch (e) { return null; }
}
function hasPass() {
  var p = getPass();
  if (!p) return false;
  if (p.type === 'first') return (p.triesLeft || 0) > 0;
  return Date.now() < (p.expires || 0);
}
function setPass(p) { try { wx.setStorageSync('tryon_pass', p); } catch (e) {} }
function clearPass() { try { wx.removeStorageSync('tryon_pass'); } catch (e) {} }

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
    // —— 付费墙 / 推广 ——
    packages: PACKAGES,
    showPackages: false,
    promo: false,
    isPass: false,
    passText: '未开通 · 首单 ¥1 体验',
  },

  onLoad: function (options) {
    if (options && options.promo) { this.setData({ promo: true }); }
    this.refreshPass();
    this.loadData();
  },

  refreshPass: function () {
    var p = getPass();
    var txt;
    if (!p) {
      txt = '未开通 · 首单 ¥1 体验';
    } else if (p.type === 'first') {
      txt = '首单体验剩余 ' + (p.triesLeft || 0) + ' 次';
    } else {
      var days = Math.max(0, Math.ceil((p.expires - Date.now()) / 86400000));
      var label = p.type === 'month' ? '包月' : p.type === 'quarter' ? '季卡' : '年卡';
      txt = label + '剩余 ' + days + ' 天';
    }
    this.setData({ passText: txt, isPass: hasPass() });
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
            id: p.id, title: p.title, price: p.price, cover: p.cover,
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

        var defBuyer = (mainStyles[0] && mainStyles[0].code) || '';
        t._seasonMap = seasonMap; t._styleMap = styleMap;
        t.setData({
          seasons: seasons, mainStyles: mainStyles, products: products, lookCards: lookCards,
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

  payFor: function (pkg) {
    var t = this;
    wx.showLoading({ title: '调起支付...' });
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/wechat-pay/unified-order',
        method: 'POST',
        data: {
          product_id: pkg.id,
          product_title: '骆芷蝶智选·虚拟试衣' + pkg.name,
          total_fee: pkg.price * 100,
          quantity: 1,
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
            success: function () {
              // 开通权益（客户端乐观开通；服务端对账为后续硬化步骤）
              var pass = { type: pkg.type };
              if (pkg.type === 'first') {
                pass.triesLeft = pkg.tries;
                pass.expires = Date.now() + 365 * 86400000;
              } else {
                pass.expires = Date.now() + pkg.days * 86400000;
                pass.triesLeft = 999;
              }
              setPass(pass);
              t.setData({ showPackages: false });
              t.refreshPass();
              wx.showToast({ title: '已开通，去试衣', icon: 'success' });
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
    if (!this.data.personPath) { wx.showToast({ title: '请先上传你的照片', icon: 'none' }); return; }
    if (this.data.tray.length === 0) { wx.showToast({ title: '请先添加单品', icon: 'none' }); return; }
    if (!hasPass()) { this.setData({ showPackages: true }); return; }
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
        // 消耗首单次数
        var p = getPass();
        if (p && p.type === 'first') { p.triesLeft = Math.max(0, (p.triesLeft || 1) - 1); setPass(p); t.refreshPass(); }
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

  // 保存高清图到相册（已付费用户）
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

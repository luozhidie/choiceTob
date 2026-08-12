var app = getApp();
var BASE = 'https://colour-choice.art';

function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  u = u.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
  return u;
}

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
  },

  onLoad: function () {
    this.loadData();
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

        // 商品：预计算展示名
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

        // 造型卡：每个主风格挑 ≤4 件匹配单品
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

  doTryOn: function () {
    var t = this;
    if (!this.data.personPath) { wx.showToast({ title: '请先上传你的照片', icon: 'none' }); return; }
    if (this.data.tray.length === 0) { wx.showToast({ title: '请先添加单品', icon: 'none' }); return; }
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
});

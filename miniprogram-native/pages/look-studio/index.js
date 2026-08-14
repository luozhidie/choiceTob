var app = getApp();
var BASE = 'https://colour-choice.art';

function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  u = u.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
  return u;
}

// 试衣套餐（与网站 /api/tryon/create 服务端定价一致）
// 双轨：普通版次数计入 normal_left，专业版次数计入 pro_left，互不稀释
var PACKAGES = [
  // 普通版
  { id: 'tryon_first_9_9',       name: '首单体验',  price: 9.9,  unit: '次', desc: '9 次普通试穿 + 1 次专业诊断', type: 'first',        days: 365, normal: 9,  pro: 1, highlight: true },
  { id: 'tryon_normal_month_59', name: '普通月卡',  price: 59,   unit: '月', desc: '30 天 70 次普通试穿',         type: 'normal_month', days: 30,  normal: 70, pro: 0 },
  // 专业版
  { id: 'tryon_pro_month_199',   name: '专业月卡',  price: 199,  unit: '月', desc: '30 天 200 次专业诊断',        type: 'pro_month',    days: 30,  normal: 0, pro: 200, highlight: true },
  { id: 'tryon_pro_year_999',    name: '专业年卡',  price: 999,  unit: '年', desc: '365 天 1000 次专业诊断',      type: 'pro_year',     days: 365, normal: 0, pro: 1000 },
];

// 衣橱品类中文名
var CAT_NAMES = { top: '上装', bottom: '下装', shoes: '鞋履', bag: '包袋', accessory: '配饰' };

// 价格：数据库按分存，展示为元
function fmtPrice(n) {
  if (n == null) return '0';
  var yuan = Math.round(n) / 100;
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
    closetItems: [],
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
    // —— 普通 / 专业 分层 ——
    proMode: false,
    categories: [],
    category: '',
    // —— 付费墙 / 推广 / 合规 ——
    packages: PACKAGES,
    showPackages: false,
    promo: false,
    isPass: false,
    passText: '未开通 · 首单 ¥9.9 体验',
    agreedAuth: false,
    showShopPick: false,
  },

  onLoad: function (options) {
    if (options && options.promo) { this.setData({ promo: true }); }
    if (options && options.pro) { this.setData({ proMode: true }); }
    this.setData({ agreedAuth: getAuth() });
    this.syncEntitlement();
    this.loadData();
    this.loadCloset();
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
    var typeLabels = {
      first: '首单体验',
      normal_month: '普通月卡',
      pro_month: '专业月卡',
      pro_year: '专业年卡',
      test: '测试套餐'
    };
    if (!d.active) {
      txt = '未开通 · 首单 ¥9.9 体验';
    } else if (d.type === 'first') {
      txt = '首单体验 · 普通 ' + (d.normalLeft || 0) + ' 次 / 专业 ' + (d.proLeft || 0) + ' 次';
    } else {
      var days = d.daysLeft || 0;
      var label = typeLabels[d.type] || '套餐';
      if (d.type && d.type.indexOf('pro') > -1) {
        txt = label + '剩余 ' + days + ' 天 · 专业 ' + (d.proLeft || 0) + ' 次';
      } else {
        txt = label + '剩余 ' + days + ' 天 · 普通 ' + (d.normalLeft || 0) + ' 次';
      }
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
      sizeType: ['compressed', 'original'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0];
        if (!f) return;
        wx.showLoading({ title: '准备图片...' });
        // 压缩+转码为 JPG，规避 iPhone HEIC 与超 5MB 限制
        wx.compressImage({
          src: f.tempFilePath,
          quality: 80,
          compressedWidth: 1000,
          success: function (c) { t._uploadCloth(c.tempFilePath); },
          fail: function () { t._uploadCloth(f.tempFilePath); }
        });
      }
    });
  },

  _uploadCloth: function (filePath) {
    var t = this;
    wx.showLoading({ title: '上传衣服图...' });
    wx.uploadFile({
      url: BASE + '/api/upload',
      filePath: filePath,
      name: 'file',
      success: function (up) {
        wx.hideLoading();
        var d; try { d = JSON.parse(up.data); } catch (e) { d = {}; }
        var url = d.url || (d.data && d.data.url);
        if (!url) {
          var errMsg = d.error || '服务器未返回图片地址';
          wx.showModal({ title: '上传失败', content: String(errMsg).slice(0, 140), showCancel: false });
          console.error('[chooseCloth] 上传无 url', d);
          return;
        }
        var item = { id: 'cloth_' + Date.now(), title: '上传的衣服', cover: url, price: '', seasons: [], styles: [], category: '' };
        t.setData({ tray: t.data.tray.concat([item]) });
        wx.showToast({ title: '已加入造型', icon: 'none' });
      },
      fail: function (err) {
        wx.hideLoading();
        var em = (err && err.errMsg) || '';
        var tip;
        if (em.indexOf('domain') > -1 || em.indexOf('not in domain list') > -1 || em.indexOf('url not in domain list') > -1) {
          tip = '域名未生效：请确认已在「微信公众平台→开发→开发设置→uploadFile合法域名」中保存 https://colour-choice.art（不是 request 域名）。若已保存，请「删除小程序重新进入」刷新缓存。错误：' + em;
        } else if (em.indexOf('timeout') > -1) {
          tip = '上传超时，请检查网络或切换网络重试。' + em;
        } else if (em.indexOf('fail:file too large') > -1 || em.indexOf('exceed') > -1) {
          tip = '图片超过 5MB，已自动压缩，请换一张更小的图片重试。' + em;
        } else {
          tip = '上传失败：' + em + '。若反复失败，请截图联系客服。';
        }
        wx.showModal({ title: '上传失败', content: tip.slice(0, 220), showCancel: false });
        console.error('[chooseCloth] uploadFile fail', err);
      }
    });
  },

  // —— 我的衣橱（toC 形象管理）——
  loadCloset: function () {
    var t = this;
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/closet?openid=' + encodeURIComponent(openid),
        success: function (r) {
          var items = (r.data && r.data.items) || [];
          items.forEach(function (it) { it.catName = CAT_NAMES[it.category] || it.category || '单品'; });
          t.setData({ closetItems: items });
        }
      });
    }).catch(function () {});
  },

  uploadToCloset: function () {
    var t = this;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      sizeType: ['compressed', 'original'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0];
        if (!f) return;
        wx.showLoading({ title: '准备图片...' });
        wx.compressImage({
          src: f.tempFilePath, quality: 80, compressedWidth: 1000,
          success: function (c) { t._uploadCloset(c.tempFilePath); },
          fail: function () { t._uploadCloset(f.tempFilePath); }
        });
      }
    });
  },

  _uploadCloset: function (filePath) {
    var t = this;
    wx.showLoading({ title: '上传到衣橱...' });
    wx.uploadFile({
      url: BASE + '/api/upload', filePath: filePath, name: 'file',
      success: function (up) {
        wx.hideLoading();
        var d; try { d = JSON.parse(up.data); } catch (e) { d = {}; }
        var url = d.url || (d.data && d.data.url);
        if (!url) { wx.showModal({ title: '上传失败', content: String(d.error || '服务器未返回地址').slice(0, 140), showCancel: false }); return; }
        app.getOpenid().then(function (openid) {
          wx.request({
            url: BASE + '/api/closet', method: 'POST',
            data: { openid: openid, image_url: url, category: 'top' },
            success: function () { t.loadCloset(); wx.showToast({ title: '已加入衣橱', icon: 'none' }); },
            fail: function () { wx.showToast({ title: '保存失败', icon: 'none' }); }
          });
        }).catch(function () { wx.showToast({ title: '请先登录', icon: 'none' }); });
      },
      fail: function (err) {
        wx.hideLoading();
        var em = (err && err.errMsg) || '';
        var tip;
        if (em.indexOf('domain') > -1 || em.indexOf('not in domain list') > -1 || em.indexOf('url not in domain list') > -1) {
          tip = '域名未生效：请确认已在「uploadFile合法域名」中保存 https://colour-choice.art（不是 request 域名）。若已保存，请「删除小程序重新进入」刷新缓存。错误：' + em;
        } else if (em.indexOf('timeout') > -1) {
          tip = '上传超时，请切换网络重试。' + em;
        } else if (em.indexOf('fail:file too large') > -1 || em.indexOf('exceed') > -1) {
          tip = '图片超过 5MB，请换小图重试。' + em;
        } else {
          tip = '上传失败：' + em + '。若反复失败请截图联系客服。';
        }
        wx.showModal({ title: '上传失败', content: tip.slice(0, 220), showCancel: false });
      }
    });
  },

  addClosetToTray: function (e) {
    var id = e.currentTarget.dataset.id;
    var it = this.data.closetItems.filter(function (x) { return x.id === id; })[0];
    if (!it) return;
    if (this.data.tray.some(function (x) { return x.id === id; })) return;
    var item = { id: it.id, title: it.catName, cover: it.image_url, price: '', seasons: [], styles: [], category: it.category };
    this.setData({ tray: this.data.tray.concat([item]) });
    wx.showToast({ title: '已加入造型', icon: 'none' });
  },

  delCloset: function (e) {
    var t = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除衣橱单品', content: '确定从衣橱删除这件？',
      success: function (r) {
        if (!r.confirm) return;
        app.getOpenid().then(function (openid) {
          wx.request({
            url: BASE + '/api/closet?openid=' + encodeURIComponent(openid) + '&id=' + id,
            method: 'DELETE',
            success: function () { t.loadCloset(); }
          });
        }).catch(function () {});
      }
    });
  },

  // —— 普通版：AI 帮我搭 ——
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
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/style-profile?openid=' + encodeURIComponent(openid),
        success: function (r) {
          var profile = (r.data && r.data.profile) || null;
          var sc = (profile && profile.season_type) ? [profile.season_type] : (t.data.mySeason ? [t.data.mySeason] : []);
          var st = (profile && profile.style_tags && profile.style_tags.length) ? profile.style_tags : (t.data.myStyle ? [t.data.myStyle] : []);
          if (!sc.length && !st.length && !t.data.myStyle) {
            wx.showModal({
              title: '先完善形象档案',
              content: '在「我的」→ 形象档案 完成色彩季型与风格诊断，生成会更精准。也可直接选下方风格后生成。',
              confirmText: '去形象档案', cancelText: '先用风格',
              success: function (m) { if (m.confirm) wx.navigateTo({ url: '/pages/style-profile/index' }); }
            });
            return;
          }
          var ranked = t.data.products.map(function (p) { return { p: p, s: t.score(p, sc, st) }; })
            .filter(function (x) { return x.s > 0; })
            .sort(function (a, b) { return b.s - a.s; })
            .slice(0, 6).map(function (x) { return x.p; });
          if (!ranked.length) { wx.showToast({ title: '暂无匹配单品', icon: 'none' }); return; }
          t.setData({ tray: ranked, mode: 'auto' });
          wx.showToast({ title: '已按你的形象生成造型', icon: 'none' });
        },
        fail: function () {
          var sc = t.data.mySeason ? [t.data.mySeason] : [];
          var st = t.data.myStyle ? [t.data.myStyle] : [];
          if (!sc.length && !st.length) { wx.showToast({ title: '请先在「我的形象」选风格', icon: 'none' }); return; }
          var ranked = t.data.products.map(function (p) { return { p: p, s: t.score(p, sc, st) }; })
            .filter(function (x) { return x.s > 0; })
            .sort(function (a, b) { return b.s - a.s; })
            .slice(0, 6).map(function (x) { return x.p; });
          if (!ranked.length) { wx.showToast({ title: '暂无匹配单品', icon: 'none' }); return; }
          t.setData({ tray: ranked, mode: 'auto' });
        }
      });
    }).catch(function () { wx.showToast({ title: '请先登录', icon: 'none' }); });
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
              var optimistic = {
                active: true, type: pkg.type, daysLeft: pkg.days || 365,
                normalLeft: pkg.normal, proLeft: pkg.pro, triesLeft: pkg.normal + pkg.pro
              };
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
      // 按当前模式校验对应次数
      var tier = t.data.proMode ? 'pro' : 'normal';
      var left = t.data.proMode ? (ent.proLeft || 0) : (ent.normalLeft || 0);
      if (left <= 0) {
        wx.showModal({
          title: (t.data.proMode ? '专业版' : '普通版') + '次数已用完',
          content: '当前套餐的' + (t.data.proMode ? '专业版' : '普通版') + '次数不足，去开通对应套餐继续试穿。',
          confirmText: '去开通', cancelText: '暂不需要',
          success: function (r) { if (r.confirm) t.openPackages(); }
        });
        return;
      }
      t.runTryOn(ent, tier);
    });
  },

  runTryOn: function (ent, tier) {
    var t = this;
    var products = this.data.tray.map(function (p) { return { url: p.cover, title: p.title }; });
    this.setData({ loading: true });
    wx.showLoading({ title: '生成整体造型...' });
    wx.uploadFile({
      url: BASE + '/api/tryon/generate',
      filePath: this.data.personPath,
      name: 'personImage',
      formData: { products: JSON.stringify(products), userId: 'mini' },
      success: function (res) {
        wx.hideLoading();
        var d;
        try { d = JSON.parse(res.data); } catch (e) { d = {}; }
        if (d.error) { wx.showModal({ title: '试衣失败', content: d.error, showCancel: false }); t.setData({ loading: false }); return; }

        var resultUrl = rewriteSupabase(d.resultUrl);

        // 按档位扣减次数
        if (ent && ent.active) {
          app.getOpenid().then(function (openid) {
            wx.request({ url: BASE + '/api/tryon/entitlement', method: 'POST', data: { openid: openid, tier: tier } });
          }).catch(function () {});
        }

        // 保存试衣记录（7 天历史）
        var clothUrls = t.data.tray.map(function (p) { return p.cover; });
        app.getOpenid().then(function (openid) {
          wx.request({
            url: BASE + '/api/tryon/records',
            method: 'POST',
            data: { openid: openid, mode: tier, cloth_urls: clothUrls, result_url: resultUrl }
          });
        }).catch(function () {});

        t.syncEntitlement();
        t.setData({ resultUrl: resultUrl, resultCredits: d.credits || products.length, showResult: true, loading: false });
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

  // 跳转到试衣历史
  goHistory: function () {
    wx.navigateTo({ url: '/pages/tryon-history/index' });
  },
});

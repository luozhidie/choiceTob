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
  { id: 'tryon_first_9_9',       name: '首单体验',  price: 9.9,  unit: '次', desc: '10 次普通试穿',               type: 'first',        days: 365, normal: 10,  pro: 0, highlight: true },
  { id: 'tryon_normal_month_99', name: '普通月卡',  price: 99,   unit: '月', desc: '30 天 100 次普通试穿',        type: 'normal_month', days: 30,  normal: 100, pro: 0 },
  { id: 'tryon_pro_998',         name: '专业版',    price: 998,  unit: '次', desc: '100 次专业诊断 · 含风格测试', type: 'pro_pack',     days: 365, normal: 0,   pro: 100, highlight: true },
];

var CAT_NAMES = { top: '上装', bottom: '下装', shoes: '鞋履', bag: '包袋', accessory: '配饰' };

function fmtPrice(n) {
  if (n == null) return '0';
  var yuan = Math.round(n) / 100;
  return yuan % 1 === 0 ? String(yuan) : yuan.toFixed(2);
}

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
    mode: 'browse',
    mySeason: '',
    myStyle: '',
    personPath: '',
    // 画布叠加状态
    canvasUrl: '',
    stack: [],
    addingId: '',
    buyerStyle: '',
    filterSeason: '',
    category: '',
    categories: [],
    loading: false,
    recommend: [],
    // 付费墙 / 推广 / 合规
    packages: PACKAGES,
    showPackages: false,
    promo: false,
    isPass: false,
    normalLeft: 0,
    proLeft: 0,
    passText: '未开通 · 首单 ¥9.9 体验',
    agreedAuth: false,
    showShopPick: false,
    showResult: false,
  },

  onLoad: function (options) {
    var upd = { agreedAuth: getAuth() };
    if (options && options.promo) { upd.promo = true; upd.showPackages = true; }
    if (options && options.baseImageUrl) {
      upd.personPath = decodeURIComponent(options.baseImageUrl);
      upd.canvasUrl = upd.personPath;
    }
    this.setData(upd);
    this.syncEntitlement();
    this.loadData();
    this.loadCloset();
  },

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
    var typeLabels = { first: '首单体验', normal_month: '普通月卡', pro_pack: '专业版', test: '测试套餐' };
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
    this.setData({ passText: txt, isPass: d.active, normalLeft: d.normalLeft || 0, proLeft: d.proLeft || 0 });
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

        var defBuyer = (mainStyles[0] && mainStyles[0].code) || '';
        var catCount = {};
        products.forEach(function (p) { if (p.category) catCount[p.category] = (catCount[p.category] || 0) + 1; });
        var categories = Object.keys(catCount).sort(function (a, b) { return catCount[b] - catCount[a]; })
          .map(function (c) { return { code: c, name: CAT_NAMES[c] || c }; });
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

  // —— 上传自己的衣服图，直接逐件加进画布 ——
  chooseCloth: function () {
    var t = this;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      sizeType: ['compressed', 'original'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0];
        if (!f) return;
        wx.compressImage({
          src: f.tempFilePath, quality: 80, compressedWidth: 1000,
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
      url: BASE + '/api/upload', filePath: filePath, name: 'file',
      success: function (up) {
        wx.hideLoading();
        var d; try { d = JSON.parse(up.data); } catch (e) { d = {}; }
        var url = d.url || (d.data && d.data.url);
        if (!url) {
          var errMsg = d.error || '服务器未返回图片地址';
          wx.showModal({ title: '上传失败', content: String(errMsg).slice(0, 140), showCancel: false });
          return;
        }
        t.addClothAsItem(url);
      },
      fail: function (err) {
        wx.hideLoading();
        var em = (err && err.errMsg) || '';
        var tip = em.indexOf('domain') > -1 ? '域名未生效：请确认已在 uploadFile 合法域名保存 https://colour-choice.art。'
          : em.indexOf('timeout') > -1 ? '上传超时，请重试。' : '上传失败：' + em;
        wx.showModal({ title: '上传失败', content: tip.slice(0, 200), showCancel: false });
      }
    });
  },

  addClothAsItem: function (url) {
    var t = this;
    if (!this.data.personPath) { wx.showToast({ title: '请先上传你的照片', icon: 'none' }); return; }
    if (!this.data.agreedAuth) { this.needAuth(); return; }
    this.syncEntitlement().then(function (ent) {
      if (!isActiveEnt(ent)) { t.setData({ showPackages: true }); return; }
      var left = ent.normalLeft || 0;
      if (left <= 0) { t.noLeft('普通版'); return; }
      t.runAdd({ id: 'cloth_' + Date.now(), title: '上传的衣服', cover: url }, ent, 'normal');
    });
  },

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
        var tip = em.indexOf('domain') > -1 ? '域名未生效：请确认已在 uploadFile 合法域名保存 https://colour-choice.art。' : '上传失败：' + em;
        wx.showModal({ title: '上传失败', content: tip.slice(0, 200), showCancel: false });
      }
    });
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

  setCategory: function (e) {
    var c = e.currentTarget.dataset.c;
    this.setData({ category: c, browseProducts: this.computeByCat(c, this.data.products) });
  },
  computeByCat: function (cat, products) {
    products = products || this.data.products;
    if (!cat) return products;
    return products.filter(function (p) { return p.category === cat; });
  },
  openShopPick: function () { this.setData({ showShopPick: true }); },
  closeShopPick: function () { this.setData({ showShopPick: false }); },

  toggleAuth: function () {
    var v = !this.data.agreedAuth;
    setAuth(v);
    this.setData({ agreedAuth: v });
  },
  needAuth: function () {
    wx.showModal({
      title: '需同意肖像授权',
      content: '试衣需先勾选「肖像使用授权」：你的照片仅用于本次 AI 合成，不会公开。',
      confirmText: '去勾选', cancelText: '取消',
      success: function (r) { if (r.confirm) { /* 引导到上方勾选框 */ } }
    });
  },

  togglePro: function () {
    var self = this;
    if (!this.data.proMode && this.data.proLeft <= 0) {
      wx.showModal({
        title: '专业风格顾问',
        content: '专业版次数未开通：含 21 题穿衣风格诊断 + 按季型/风格智能推荐单品。普通版套餐不含专业版次数，需开通专业套餐。',
        confirmText: '去开通', cancelText: '暂不需要',
        success: function (r) { if (r.confirm) self.openPackages(); }
      });
      return;
    }
    this.setData({ proMode: !this.data.proMode, mode: 'browse' });
  },
  switchToBasic: function () { this.setData({ proMode: false }); },
  switchToPro: function () {
    var self = this;
    if (this.data.proLeft <= 0) {
      wx.showModal({
        title: '专业版',
        content: '专业版次数未开通。普通版套餐仅含普通试穿次数，专业版推荐 / 生成需开通专业套餐。',
        confirmText: '去开通', cancelText: '暂不需要',
        success: function (r) { if (r.confirm) self.openPackages(); }
      });
      return;
    }
    this.setData({ proMode: true, mode: 'browse' });
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

  // —— 在全部来源里找单品（商城 / 衣橱）——
  findItem: function (id) {
    var list = (this.data.products || []).concat(this.data.closetItems || []);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) {
        return { id: id, title: list[i].title || list[i].catName || '单品', cover: list[i].cover || list[i].image_url };
      }
    }
    return null;
  },

  // —— 核心：逐件叠加 ——
  addOne: function (e) {
    var id = e.currentTarget.dataset.id;
    var item = this.findItem(id);
    if (!item) return;
    if (!this.data.personPath) { wx.showToast({ title: '请先上传你的照片', icon: 'none' }); return; }
    if (!this.data.agreedAuth) { this.needAuth(); return; }
    var t = this;
    wx.showLoading({ title: '校验权益...' });
    this.syncEntitlement().then(function (ent) {
      wx.hideLoading();
      if (!isActiveEnt(ent)) { t.setData({ showPackages: true }); return; }
      var tier = t.data.proMode ? 'pro' : 'normal';
      var left = t.data.proMode ? (ent.proLeft || 0) : (ent.normalLeft || 0);
      if (left <= 0) { t.noLeft(t.data.proMode ? '专业版' : '普通版'); return; }
      t.runAdd(item, ent, tier);
    });
  },

  runAdd: function (item, ent, tier) {
    var t = this;
    var stackLen = this.data.stack.length;
    // 第 1 件：personPath 是真人照；后续：用 canvasUrl 作基底，personPath 仅作占位文件（后端忽略）
    var fd = { userId: 'mini' };
    if (stackLen === 0) {
      fd.garmentImageUrl = item.cover;
    } else {
      fd.personImageUrl = this.data.canvasUrl;
      fd.garmentImageUrl = item.cover;
    }
    this.setData({ addingId: item.id, loading: true });
    wx.showLoading({ title: stackLen === 0 ? '生成第 1 件...' : '叠加第 ' + (stackLen + 1) + ' 件...' });
    wx.uploadFile({
      url: BASE + '/api/tryon/generate',
      filePath: this.data.personPath,
      name: 'personImage',
      formData: fd,
      success: function (res) {
        wx.hideLoading();
        var d; try { d = JSON.parse(res.data); } catch (e2) { d = {}; }
        if (d.error) { wx.showModal({ title: '试衣失败', content: String(d.error).slice(0, 160), showCancel: false }); t.setData({ loading: false, addingId: '' }); return; }
        var resultUrl = rewriteSupabase(d.resultUrl);
        // 扣权益
        app.getOpenid().then(function (openid) {
          wx.request({ url: BASE + '/api/tryon/entitlement', method: 'POST', data: { openid: openid, tier: tier } });
        }).catch(function () {});
        // 记录
        app.getOpenid().then(function (openid) {
          wx.request({
            url: BASE + '/api/tryon/records', method: 'POST',
            data: { openid: openid, mode: tier, cloth_urls: [item.cover], result_url: resultUrl }
          });
        }).catch(function () {});
        var newStack = t.data.stack.concat([{ id: item.id, title: item.title, cover: item.cover, resultUrl: resultUrl }]);
        t.syncEntitlement();
        t.setData({ canvasUrl: resultUrl, stack: newStack, loading: false, addingId: '', showShopPick: false });
      },
      fail: function () {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
        t.setData({ loading: false, addingId: '' });
      }
    });
  },

  noLeft: function (label) {
    var t = this;
    wx.showModal({
      title: label + '次数已用完',
      content: '当前套餐次数不足，去开通对应套餐继续试穿。',
      confirmText: '去开通', cancelText: '暂不需要',
      success: function (r) { if (r.confirm) t.openPackages(); }
    });
  },

  undo: function () {
    var t = this;
    var stack = this.data.stack;
    if (stack.length === 0) return;
    var next = stack.slice(0, -1);
    var last = next[next.length - 1];
    this.setData({ stack: next, canvasUrl: last ? last.resultUrl : '' });
  },
  resetCanvas: function () { this.setData({ stack: [], canvasUrl: '' }); },

  // —— 按风格生成（推荐列表，逐件加）——
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
          // 专业版推荐：全部商品按匹配度排序，前 6 置顶展示，不会空
          var ranked = t.data.products.map(function (p) { return { p: p, s: t.score(p, sc, st) }; })
            .sort(function (a, b) { return b.s - a.s; })
            .slice(0, 6).map(function (x) { return x.p; });
          t.setData({ recommend: ranked, mode: 'auto' });
          wx.showToast({ title: '已为你挑好，点「＋加这件」', icon: 'none' });
        },
        fail: function () {
          var sc = t.data.mySeason ? [t.data.mySeason] : [];
          var st = t.data.myStyle ? [t.data.myStyle] : [];
          if (!sc.length && !st.length) { wx.showToast({ title: '请先在「我的形象」选风格', icon: 'none' }); return; }
          var ranked = t.data.products.map(function (p) { return { p: p, s: t.score(p, sc, st) }; })
            .sort(function (a, b) { return b.s - a.s; })
            .slice(0, 6).map(function (x) { return x.p; });
          t.setData({ recommend: ranked, mode: 'auto' });
        }
      });
    }).catch(function () { wx.showToast({ title: '请先登录', icon: 'none' }); });
  },

  score: function (p, sc, st) {
    var s = 0;
    (p.seasons || []).forEach(function (x) { if (sc.indexOf(x) >= 0) s += 2; });
    (p.styles || []).forEach(function (x) { if (st.indexOf(x) >= 0) s += 1; });
    return s;
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

  closeResult: function () { this.setData({ showResult: false }); },
  previewResult: function () {
    if (this.data.canvasUrl) wx.previewImage({ urls: [this.data.canvasUrl], current: this.data.canvasUrl });
  },
  saveResult: function () {
    var url = this.data.canvasUrl;
    if (!url) { wx.showToast({ title: '还没有造型图', icon: 'none' }); return; }
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

  goHistory: function () {
    wx.navigateTo({ url: '/pages/tryon-history/index' });
  },

  goOutfit: function () {
    wx.navigateTo({ url: '/pages/outfit/index' });
  },
});

var app = getApp();
var guard = require('../../utils/agent-guard.js');
var BASE = 'https://colour-choice.art';
var vp = require('../../utils/virtual-pay.js');

function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  return u;
}

// 试衣套餐（与网站 /api/tryon/create 服务端定价一致）
var PACKAGES = [
  { id: 'tryon_first_9_9',       name: '首单体验',  price: 9.9,  unit: '次', desc: '10 次普通试穿',               type: 'first',        days: 365, normal: 10,  pro: 0, highlight: true },
  { id: 'tryon_normal_month_99', name: '普通月卡',  price: 99,   unit: '月', desc: '30 天 100 次普通试穿',        type: 'normal_month', days: 30,  normal: 100, pro: 0 },
  { id: 'tryon_pro_998',         name: '专业版',    price: 998,  unit: '次', desc: '100 次专业诊断 · 含风格测试', type: 'pro_pack',     days: 365, normal: 0,   pro: 100, highlight: true },
  { id: 'tryon_test_cent',       name: '测试通道',  price: 1, unit: '次', desc: '1 次普通 + 1 次专业（7 天）',  type: 'test',         days: 7,   normal: 1,   pro: 1, isTest: true },
];

var CAT_NAMES = { top: '上装', bottom: '下装', shoes: '鞋履', bag: '包袋', accessory: '配饰' };
var CAT_NAMES_DATA = { top: '上装', bottom: '下装', shoes: '鞋履', bag: '包袋', accessory: '配饰' };

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
    personPhotos: [],
    selectedPersonIndex: 0,
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
    referralCode: '',       // 代理推广码
    fromAgent: false,       // 是否来自代理分享
    currentTryonId: '',     // 当前试衣记录ID
    showCard: false,        // 搭配卡片视图
    catNames: CAT_NAMES_DATA,
  },

  onLoad: function (options) {
  if (!guard.guardAgentOnly()) return;
    var self = this;
    // 登录隔离：未登录用户不允许进入云衣橱（试衣为付费诊断，未登录会泄漏代理推广记录与下单链路）
    var token = '';
    try { token = wx.getStorageSync('token') || ''; } catch (e) {}
    if (!token) {
      var back = '/pages/look-studio/index';
      try {
        if (options) {
          var qs = [];
          for (var k in options) { if (Object.prototype.hasOwnProperty.call(options, k)) qs.push(encodeURIComponent(k) + '=' + encodeURIComponent(options[k])); }
          if (qs.length) back += '?' + qs.join('&');
        }
      } catch (e) {}
      wx.showModal({
        title: '请先登录',
        content: '云衣橱·AI 虚拟试衣为付费诊断内容，登录后才能使用。',
        confirmText: '去登录',
        cancelText: '返回',
        success: function (res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/index?redirect=' + encodeURIComponent(back) });
          } else {
            try {
              var pages = getCurrentPages();
              if (pages && pages.length > 1) wx.navigateBack({ delta: 1 });
              else wx.switchTab({ url: '/pages/home/index' });
            } catch (e) {
              wx.switchTab({ url: '/pages/home/index' });
            }
          }
        }
      });
      return;
    }
    var upd = { agreedAuth: getAuth() };
    if (options && options.promo) { upd.promo = true; upd.showPackages = true; }
    if (options && options.baseImageUrl) {
      upd.personPath = decodeURIComponent(options.baseImageUrl);
      upd.canvasUrl = upd.personPath;
    }
    // 接收代理推广码
    if (options && (options.ref || options.referral_code)) {
      upd.referralCode = options.ref || options.referral_code;
      upd.fromAgent = true;
    }
    this.setData(upd);
    this.syncEntitlement().then(function (ent) {
      if (!isActiveEnt(ent)) { self.setData({ showPackages: true }); }
    });
    this.loadData();
    this.loadCloset();
    this.loadStyleProfile();
  },

  // 从形象档案自动载入全身照 + 色彩季型 + 主风格
  loadStyleProfile: function () {
    var t = this;
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/style-profile?openid=' + encodeURIComponent(openid),
        success: function (r) {
          var p = (r.data && r.data.profile) || null;
          if (!p) return;
          var upd = {};
          var photos = Array.isArray(p.full_body_photos) && p.full_body_photos.length
            ? p.full_body_photos
            : (p.full_body_photo ? [p.full_body_photo] : []);
          var selectedIdx = typeof p.selected_photo_index === 'number' ? p.selected_photo_index : 0;
          if (selectedIdx >= photos.length) selectedIdx = 0;
          if (photos.length) {
            upd.personPhotos = photos.map(rewriteSupabase);
            upd.selectedPersonIndex = selectedIdx;
            if (!t.data.personPath) upd.personPath = rewriteSupabase(photos[selectedIdx]);
          }
          if (p.season_type) upd.mySeason = p.season_type;
          var tags = Array.isArray(p.style_tags) ? p.style_tags : [];
          var mainCode = '';
          for (var i = 0; i < tags.length; i++) {
            if (/^[a-z]+(_m)?$/i.test(tags[i])) { mainCode = tags[i]; break; }
          }
          if (!mainCode && tags.length) {
            var parts = tags[0].split('_');
            mainCode = parts[0] + (tags[0].indexOf('_m') > -1 ? '_m' : '');
          }
          if (mainCode) upd.myStyle = mainCode;
          if (Object.keys(upd).length) t.setData(upd);
        }
      });
    }).catch(function () {});
  },
  selectPersonPhoto: function (e) {
    var idx = e.currentTarget.dataset.index;
    var photos = this.data.personPhotos;
    if (idx < 0 || idx >= photos.length) return;
    this.setData({ selectedPersonIndex: idx, personPath: photos[idx], canvasUrl: '' });
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
    if (!this.data.isPass) { this.openPackages(); return; }
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
    if (!this.data.isPass) { this.openPackages(); return; }
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
        content: '专业版次数未开通：含男/女穿衣风格诊断 + 按季型/风格智能推荐单品。普通版套餐不含专业版次数，需开通专业套餐。',
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
        content: '专业版次数未开通：含男/女穿衣风格诊断。普通版套餐仅含普通试穿次数，专业版推荐 / 生成需开通专业套餐。',
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
        var it = list[i];
        return {
          id: id,
          title: it.title || it.catName || '单品',
          cover: it.cover || it.image_url,
          price: it.price ? fmtPrice(it.price) : '',
          category: it.category || ''
        };
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
    var garmentImageUrl = rewriteSupabase(item.cover);
    var isRemotePerson = typeof this.data.personPath === 'string' && /^https?:\/\//.test(this.data.personPath);
    t.setData({ addingId: item.id, loading: true });

    // 统一完成回调：扣权益、写记录、更新画布
    var onDone = function (resultUrl) {
      resultUrl = rewriteSupabase(resultUrl);
      app.getOpenid().then(function (openid) {
        wx.request({ url: BASE + '/api/tryon/entitlement', method: 'POST', data: { openid: openid, tier: tier } });
      }).catch(function () {});
      app.getOpenid().then(function (openid) {
        wx.request({
          url: BASE + '/api/tryon/records', method: 'POST',
          data: { openid: openid, mode: tier, cloth_urls: [item.cover], result_url: resultUrl }
        });
      }).catch(function () {});
      var newStack = t.data.stack.concat([{ id: item.id, title: item.title, cover: item.cover, resultUrl: resultUrl, price: item.price || '', category: item.category || '' }]);
      t.syncEntitlement();
      t.setData({ canvasUrl: resultUrl, stack: newStack, loading: false, addingId: '', showShopPick: false });
    };

    // 创建任务并轮询
    var doGenerate = function (personImageUrl) {
      wx.showLoading({ title: stackLen === 0 ? '生成第 1 件...' : '叠加第 ' + (stackLen + 1) + ' 件...' });
      wx.request({
        url: BASE + '/api/tryon/generate',
        method: 'POST',
        data: {
          userId: 'mini',
          personImageUrl: personImageUrl,
          garmentImageUrl: garmentImageUrl,
          title: item.title || '单品'
        },
        success: function (res) {
          var d = res.data || {};
          if (d.error) {
            wx.hideLoading();
            wx.showModal({ title: '试衣失败', content: String(d.error).slice(0, 160), showCancel: false });
            t.setData({ loading: false, addingId: '' });
            return;
          }
          if (d.generationId) {
            t.pollTryon(d.generationId, onDone);
          } else if (d.resultUrl) {
            // 兼容同步返回
            wx.hideLoading();
            onDone(d.resultUrl);
          } else {
            wx.hideLoading();
            wx.showToast({ title: '生成异常', icon: 'none' });
            t.setData({ loading: false, addingId: '' });
          }
        },
        fail: function () {
          wx.hideLoading();
          wx.showToast({ title: '网络错误', icon: 'none' });
          t.setData({ loading: false, addingId: '' });
        }
      });
    };

    if (stackLen === 0) {
      // 第 1 件：先拿到稳定人像 URL（远程 URL 直接用；本地文件上传到服务端自动抠图）
      if (isRemotePerson) {
        doGenerate(this.data.personPath);
      } else if (this.data.personPath) {
        wx.uploadFile({
          url: BASE + '/api/tryon/upload-person',
          filePath: this.data.personPath,
          name: 'personImage',
          success: function (res) {
            var d; try { d = JSON.parse(res.data); } catch (e2) { d = {}; }
            if (d.error || !d.personImageUrl) {
              wx.hideLoading();
              wx.showModal({ title: '上传人像失败', content: String(d.error || '未返回地址').slice(0, 140), showCancel: false });
              t.setData({ loading: false, addingId: '' });
              return;
            }
            doGenerate(d.personImageUrl);
          },
          fail: function (err) {
            wx.hideLoading();
            var em = (err && err.errMsg) || '';
            var tip = em.indexOf('domain') > -1 ? '域名未生效：请确认 uploadFile 合法域名已保存 https://colour-choice.art。'
              : em.indexOf('timeout') > -1 ? '上传超时，请重试。' : '上传失败：' + em;
            wx.showModal({ title: '上传人像失败', content: tip.slice(0, 200), showCancel: false });
            t.setData({ loading: false, addingId: '' });
          }
        });
      } else {
        wx.showToast({ title: '请先上传你的照片', icon: 'none' });
        t.setData({ loading: false, addingId: '' });
      }
    } else {
      // 后续叠加：以上一次结果图为基底
      doGenerate(this.data.canvasUrl);
    }
  },

  pollTryon: function (generationId, onDone) {
    var t = this;
    var attempts = 0;
    var maxAttempts = 40;
    var done = false;
    var poll = function () {
      if (done) return;
      attempts++;
      wx.request({
        url: BASE + '/api/tryon/generate/' + encodeURIComponent(generationId),
        method: 'GET',
        timeout: 60000,
        success: function (res) {
          if (done) return;
          var d = res.data || {};
          if (d.error) {
            done = true;
            wx.hideLoading();
            wx.showModal({ title: '试衣失败', content: String(d.error).slice(0, 160), showCancel: false });
            t.setData({ loading: false, addingId: '' });
            return;
          }
          if (d.status === 'COMPLETED' && d.resultUrl) {
            done = true;
            wx.hideLoading();
            onDone(d.resultUrl);
            return;
          }
          if (attempts >= maxAttempts) {
            done = true;
            wx.hideLoading();
            wx.showModal({ title: '生成超时', content: '试衣生成时间较长，请稍后到历史记录查看结果。', showCancel: false });
            t.setData({ loading: false, addingId: '' });
          }
        },
        fail: function () {
          if (done) return;
          if (attempts >= maxAttempts) {
            done = true;
            wx.hideLoading();
            wx.showToast({ title: '网络错误', icon: 'none' });
            t.setData({ loading: false, addingId: '' });
          }
        }
      });
    };
    poll();
    var timer = setInterval(poll, 5000);
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
          var oc = (profile && profile.occasions && profile.occasions.length) ? profile.occasions : [];
          var profileLabel = t.buildProfileLabel(profile);
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
          var ranked = t.data.products.map(function (p) { return { p: p, s: t.score(p, sc, st, oc) }; })
            .sort(function (a, b) { return b.s - a.s; })
            .slice(0, 6).map(function (x) { return x.p; });
          var outfitSet = t.buildOutfitSet(sc, st, oc);
          t.setData({ recommend: ranked, outfitSet: outfitSet, mode: 'auto', profileLabel: profileLabel });
          wx.showToast({ title: '已为你挑好，点「＋加这件」', icon: 'none' });
        },
        fail: function () {
          var sc = t.data.mySeason ? [t.data.mySeason] : [];
          var st = t.data.myStyle ? [t.data.myStyle] : [];
          if (!sc.length && !st.length) { wx.showToast({ title: '请先在「我的形象」选风格', icon: 'none' }); return; }
          var ranked = t.data.products.map(function (p) { return { p: p, s: t.score(p, sc, st, []) }; })
            .sort(function (a, b) { return b.s - a.s; })
            .slice(0, 6).map(function (x) { return x.p; });
          t.setData({ recommend: ranked, outfitSet: [], profileLabel: '', mode: 'auto' });
        }
      });
    }).catch(function () { wx.showToast({ title: '请先登录', icon: 'none' }); });
  },

  buildProfileLabel: function (profile) {
    if (!profile) return '';
    var parts = [];
    if (profile.season_type) parts.push(profile.season_type);
    if (profile.style_tags && profile.style_tags.length) parts.push(profile.style_tags[0]);
    if (profile.occasions && profile.occasions.length) parts.push(profile.occasions.join('/'));
    return parts.join(' · ');
  },

  score: function (p, sc, st, oc) {
    var s = 0;
    (p.seasons || []).forEach(function (x) { if (sc.indexOf(x) >= 0) s += 2; });
    (p.styles || []).forEach(function (x) { if (st.indexOf(x) >= 0) s += 1; });
    (p.occasions || []).forEach(function (x) { if (oc.indexOf(x) >= 0) s += 1; });
    return s;
  },

  buildOutfitSet: function (sc, st, oc) {
    var t = this;
    var cats = ['top', 'bottom', 'shoes', 'bag', 'accessory'];
    var set = [];
    cats.forEach(function (cat) {
      var items = t.data.products.filter(function (p) { return p.category === cat; })
        .map(function (p) { return { p: p, s: t.score(p, sc, st, oc) }; })
        .sort(function (a, b) { return b.s - a.s; });
      if (items.length) set.push(items[0].p);
    });
    return set;
  },

  tryOnOutfitSet: function () {
    var t = this;
    var set = t.data.outfitSet || [];
    if (!set.length) { wx.showToast({ title: '没有可试穿的搭配', icon: 'none' }); return; }
    if (!t.data.personPath) { wx.showToast({ title: '请先上传你的照片', icon: 'none' }); return; }
    if (!t.data.agreedAuth) { t.needAuth(); return; }
    // 先清空画布：整套搭配从「纯真人」开始，避免叠在旧衣服上导致原衣残留
    t.setData({ stack: [], canvasUrl: '' });
    t.syncEntitlement().then(function (ent) {
      if (!isActiveEnt(ent)) { t.setData({ showPackages: true }); return; }
      var tier = t.data.proMode ? 'pro' : 'normal';
      var left = t.data.proMode ? (ent.proLeft || 0) : (ent.normalLeft || 0);
      if (left < set.length) { t.noLeft(t.data.proMode ? '专业版' : '普通版'); return; }
      var idx = 0;
      var next = function () {
        if (idx >= set.length) {
          wx.hideLoading();
          wx.showToast({ title: '整套试穿完成', icon: 'success' });
          return;
        }
        var item = set[idx++];
        if (idx > 1) wx.showLoading({ title: '试穿第 ' + idx + '/' + set.length + ' 件...' });
        else wx.showLoading({ title: '开始试穿整套...' });
        t.runAdd(item, ent, tier);
        var check = function () {
          if (t.data.addingId) { setTimeout(check, 300); return; }
          setTimeout(next, 300);
        };
        setTimeout(check, 500);
      };
      next();
    });
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
    vp.pay({
      goodsKey: pkg.id,
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
        if (!(err && err.errMsg && String(err.errMsg).indexOf('cancel') > -1)) {
          wx.showToast({ title: '支付失败', icon: 'none' });
        }
      },
      legacy: function () { t.legacyPayFor(pkg); }
    });
  },

  /* 兜底：虚拟支付不可用时走原 JSAPI 通道 */
  legacyPayFor: function (pkg) {
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
    var url = rewriteSupabase(this.data.canvasUrl);
    if (!url) { wx.showToast({ title: '还没有造型图', icon: 'none' }); return; }
    this._saveImages([url], '造型图');
  },

  // 统一保存图片：downloadFile → getImageInfo → previewImage 兜底
  _saveImages: function (urls, label) {
    var t = this;
    urls = (urls || []).filter(Boolean).map(rewriteSupabase);
    if (!urls.length) { wx.showToast({ title: '没有可保存的图片', icon: 'none' }); return; }
    wx.showLoading({ title: '保存' + (label || '') + '...' });

    var authAlbum = function (cb) {
      wx.getSetting({
        success: function (res) {
          if (!res.authSetting['scope.writePhotosAlbum']) {
            wx.authorize({
              scope: 'scope.writePhotosAlbum',
              success: function () { cb(true); },
              fail: function () {
                wx.hideLoading();
                wx.showModal({
                  title: '需要相册权限', content: '请允许保存图片到相册',
                  confirmText: '去设置',
                  success: function (r) { if (r.confirm) wx.openSetting(); }
                });
              }
            });
          } else { cb(true); }
        },
        fail: function () { cb(true); }
      });
    };

    var tryDownload = function (url, cb) {
      wx.downloadFile({
        url: url,
        success: function (r) {
          if (r.statusCode === 200) {
            wx.saveImageToPhotosAlbum({
              filePath: r.tempFilePath,
              success: function () { cb(true); },
              fail: function () { cb(false); }
            });
          } else { cb(false); }
        },
        fail: function () { cb(false); }
      });
    };

    var tryGetInfo = function (url, cb) {
      wx.getImageInfo({
        src: url,
        success: function (res) {
          wx.saveImageToPhotosAlbum({
            filePath: res.path,
            success: function () { cb(true); },
            fail: function () { cb(false); }
          });
        },
        fail: function () { cb(false); }
      });
    };

    var tryPreview = function (url) {
      wx.hideLoading();
      wx.previewImage({ urls: [url], current: url });
      wx.showToast({ title: '长按图片可保存', icon: 'none' });
    };

    authAlbum(function (ok) {
      if (!ok) return;
      var done = 0, fail = 0, idx = 0;
      var step = function () {
        if (idx >= urls.length) {
          wx.hideLoading();
          if (urls.length === 1 && fail === 1) {
            tryPreview(urls[0]);
            return;
          }
          wx.showToast({
            title: '已保存 ' + done + ' 张' + (fail ? '，' + fail + ' 张失败' : ''),
            icon: fail ? 'none' : 'success'
          });
          return;
        }
        var u = urls[idx++];
        tryDownload(u, function (ok1) {
          if (ok1) { done++; step(); return; }
          tryGetInfo(u, function (ok2) {
            if (ok2) { done++; step(); return; }
            fail++; step();
          });
        });
      };
      step();
    });
  },

  goHistory: function () {
    wx.navigateTo({ url: '/pages/tryon-history/index' });
  },
  goAgentShop: function () {
    var code = this.data.referralCode || '';
    if (!code) return;
    wx.navigateTo({ url: '/pages/agent-shop/index?ref=' + code });
  },

  goOutfit: function () {
    var self = this;
    this.syncEntitlement().then(function (ent) {
      if (!isActiveEnt(ent)) { self.setData({ showPackages: true }); return; }
      wx.navigateTo({ url: '/pages/outfit/index' });
    });
  },
  goProfile: function () {
    wx.navigateTo({ url: '/pages/style-profile/index' });
  },
  goDiagnosis: function () {
    wx.navigateTo({ url: '/pages/style-test/index' });
  },

  // —— 搭配卡片（本人试穿图 + 单品拆解 + 分享/下载/下单）——
  genCard: function () {
    if (this.data.stack.length === 0) { wx.showToast({ title: '先加几件单品', icon: 'none' }); return; }
    this.setData({ showCard: true });
  },
  closeCard: function () { this.setData({ showCard: false }); },

  goBuyCard: function (e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    var ref = this.data.referralCode ? ('&ref=' + this.data.referralCode) : '';
    wx.navigateTo({ url: '/pages/shop/index?id=' + id + ref });
  },

  // 一键下载整套：试穿大图 + 各单品图
  downloadAll: function () {
    var urls = [this.data.canvasUrl].concat(this.data.stack.map(function (s) { return s.cover; }));
    this._saveImages(urls, '整套搭配');
  },

  // 分享搭配：主商品链接 + 搭配图，客户点开看商品
  onShareAppMessage: function () {
    var stack = this.data.stack || [];
    var first = stack[0] || {};
    var code = this.data.referralCode || '';
    var count = stack.length;
    var title = count > 0 ? ('我搭了 ' + count + ' 件 · ' + (first.title || '精选搭配')) : '精选搭配';
    var path = first.id
      ? ('/pages/shop/index?id=' + first.id + (code ? '&ref=' + code : ''))
      : '/pages/look-studio/index';
    return {
      title: title,
      path: path,
      imageUrl: this.data.canvasUrl || first.cover || ''
    };
  },
});

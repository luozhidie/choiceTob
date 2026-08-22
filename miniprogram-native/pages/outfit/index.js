var app = getApp();
var BASE = 'https://colour-choice.art';

function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  return u;
}

function getCacheEnt() { try { return wx.getStorageSync('tryon_entitlement') || null; } catch (e) { return null; } }
function setCacheEnt(e) { try { wx.setStorageSync('tryon_entitlement', e); } catch (e) {} }
function isActiveEnt(e) { return !!(e && e.active); }

Page({
  data: {
    personPath: '', topPath: '', bottomPath: '',
    loading: false, resultUrl: '', err: '',
    agreedAuth: false,
    isPass: false,
    normalLeft: 0,
    proLeft: 0,
  },

  onLoad: function () {
    var self = this;
    var v = false;
    try { v = wx.getStorageSync('tryon_auth_agreed') || false; } catch (e) {}
    this.setData({ agreedAuth: v });
    this.syncEntitlement().then(function (ent) {
      if (!isActiveEnt(ent)) { self.showNeedPackage(); }
    });
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
    d = d || {};
    this.setData({
      isPass: d.active || false,
      normalLeft: d.normalLeft || 0,
      proLeft: d.proLeft || 0,
    });
  },

  checkGate: function () {
    if (!this.data.isPass) { this.showNeedPackage(); return false; }
    if (this.data.normalLeft <= 0) { this.showNoLeft(); return false; }
    return true;
  },

  showNeedPackage: function () {
    wx.showModal({
      title: '未开通试衣套餐',
      content: '整体造型 · 一套上身需先开通试衣套餐并支付后才能使用。',
      confirmText: '去开通', cancelText: '暂不需要',
      success: function (r) { if (r.confirm) wx.navigateTo({ url: '/pages/tryon-promo/index' }); }
    });
  },

  showNoLeft: function () {
    wx.showModal({
      title: '普通版次数不足',
      content: '当前套餐普通试穿次数已用完，去开通或续费继续生成整体造型。',
      confirmText: '去开通', cancelText: '暂不需要',
      success: function (r) { if (r.confirm) wx.navigateTo({ url: '/pages/tryon-promo/index' }); }
    });
  },

  onAuthChange: function (e) {
    var v = e.detail.value;
    try { wx.setStorageSync('tryon_auth_agreed', v); } catch (err) {}
    this.setData({ agreedAuth: v });
  },

  choose: function (e) {
    if (!this.checkGate()) return;
    var slot = e.currentTarget.dataset.slot; // person | top | bottom
    var t = this;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      sizeType: ['original', 'compressed'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0];
        if (!f) return;
        var obj = {};
        obj[slot + 'Path'] = f.tempFilePath;
        t.setData(obj);
      }
    });
  },

  uploadOne: function (filePath) {
    return new Promise(function (resolve, reject) {
      wx.uploadFile({
        url: BASE + '/api/upload', filePath: filePath, name: 'file',
        success: function (up) {
          var d; try { d = JSON.parse(up.data); } catch (e) { d = {}; }
          var url = d.url || (d.data && d.data.url);
          if (!url) reject(new Error(d.error || '上传失败'));
          else resolve(url);
        },
        fail: function (err) { reject(new Error((err && err.errMsg) || '上传失败')); }
      });
    });
  },

  generate: function () {
    var t = this;
    if (!t.checkGate()) return;
    if (!t.data.personPath) { wx.showToast({ title: '请先上传人物照片', icon: 'none' }); return; }
    if (!t.data.topPath && !t.data.bottomPath) { wx.showToast({ title: '请至少上传一件衣服', icon: 'none' }); return; }
    if (!t.data.agreedAuth) {
      wx.showModal({
        title: '需同意肖像授权',
        content: '试衣需先勾选「肖像使用授权」：你的照片仅用于本次 AI 合成，不会公开。',
        confirmText: '去勾选', cancelText: '取消',
        success: function (r) { if (r.confirm) { t.setData({ agreedAuth: true }); try { wx.setStorageSync('tryon_auth_agreed', true); } catch (e) {} } }
      });
      return;
    }
    t.setData({ loading: true, err: '', resultUrl: '' });
    wx.showLoading({ title: '生成整套造型...' });
    Promise.all([
      t.uploadOne(t.data.personPath),
      t.data.topPath ? t.uploadOne(t.data.topPath) : Promise.resolve(''),
      t.data.bottomPath ? t.uploadOne(t.data.bottomPath) : Promise.resolve(''),
    ]).then(function (urls) {
      var body = { personImageUrl: urls[0] };
      if (urls[1]) body.topImageUrl = urls[1];
      if (urls[2]) body.bottomImageUrl = urls[2];
      wx.request({
        url: BASE + '/api/tryon/outfit',
        method: 'POST',
        header: { 'content-type': 'application/json' },
        data: body,
        success: function (r) {
          wx.hideLoading();
          var d = r.data || {};
          if (!r.statusCode || r.statusCode >= 400 || d.error || !d.ok) {
            t.setData({ loading: false, err: d.error || '生成失败' });
            return;
          }
          t.setData({ loading: false, resultUrl: rewriteSupabase(d.resultUrl), normalLeft: Math.max(0, t.data.normalLeft - 1) });
          // 扣减普通版次数
          app.getOpenid().then(function (openid) {
            wx.request({ url: BASE + '/api/tryon/entitlement', method: 'POST', data: { openid: openid, tier: 'normal' } });
          }).catch(function () {});
        },
        fail: function () {
          wx.hideLoading();
          t.setData({ loading: false, err: '网络错误，请重试' });
        }
      });
    }).catch(function (e) {
      wx.hideLoading();
      t.setData({ loading: false, err: (e && e.message) || '图片上传失败' });
    });
  },

  preview: function () {
    if (this.data.resultUrl) wx.previewImage({ urls: [this.data.resultUrl], current: this.data.resultUrl });
  },

  continueStack: function () {
    var url = this.data.resultUrl;
    if (!url) return;
    wx.navigateTo({ url: '/pages/look-studio/index?baseImageUrl=' + encodeURIComponent(url) });
  },

  save: function () {
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

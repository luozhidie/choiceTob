var app = getApp();
var guard = require('../../utils/agent-guard.js');
var BASE = 'https://colour-choice.art';

var CAT_NAMES = { top: '上装', bottom: '下装', shoes: '鞋履', bag: '包袋', accessory: '配饰' };
function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  return u;
}

Page({
  onLoad: function () {
    this.setData({ showTryon: guard.isAllowed() });
  },

  data: {
    showTryon: false,
    activeTab: 'mine',          // 'mine' = 我的衣橱 / 'cloud' = 我的云衣橱
    selfItems: [],
    stylistItems: [],
    outfits: [],
    profile: null,
    needs: '',
    storeProducts: [],
    loading: true,
    uploading: false,
  },

  onShow: function () {
    this.loadNeeds();
    this.loadCloset();
    this.loadOutfits();
    this.loadStore();
  },

  switchTab: function (e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  loadNeeds: function () {
    var t = this;
    app.getOpenid().then(function (openid) {
      try {
        var v = wx.getStorageSync('wardrobe_needs_' + openid);
        if (v) t.setData({ needs: v });
      } catch (e) {}
    }).catch(function () {});
  },

  loadCloset: function () {
    var t = this;
    t.setData({ loading: true });
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/closet?openid=' + encodeURIComponent(openid),
        success: function (r) {
          var items = (r.data && r.data.items) || [];
          var selfItems = [];
          var stylistItems = [];
          items.forEach(function (it) {
            it.catName = CAT_NAMES[it.category] || it.category || '单品';
            it.image_url = rewriteSupabase(it.image_url);
            if ((it.source || 'self') === 'stylist') stylistItems.push(it);
            else selfItems.push(it);
          });
          t.setData({ selfItems: selfItems, stylistItems: stylistItems, loading: false });
        },
        fail: function () { t.setData({ loading: false }); }
      });
    }).catch(function () {
      t.setData({ loading: false });
      wx.showToast({ title: '请先登录', icon: 'none' });
    });
  },

  // 按场合搭配（基于形象档案，限量 3 套）
  loadOutfits: function () {
    var t = this;
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/wardrobe/outfits?openid=' + encodeURIComponent(openid),
        success: function (r) {
          var d = r.data || {};
          t.setData({ outfits: d.occasions || [], profile: d.profile || null });
        },
        fail: function () {}
      });
    }).catch(function () {});
  },

  // 商城推荐商品（去虚拟试衣下方展示）
  loadStore: function () {
    var t = this;
    wx.request({
      url: BASE + '/api/public/look-studio',
      success: function (r) {
        var d = r.data || {};
        var products = (d.products || []).slice(0, 12).map(function (p) {
          return {
            id: p.id,
            title: p.title || p.name || '商品',
            cover: rewriteSupabase(p.cover || p.image_url || ''),
          };
        }).filter(function (p) { return p.cover; });
        t.setData({ storeProducts: products });
      },
      fail: function () {}
    });
  },

  // 去虚拟试衣（与主试衣共用权益门禁）
  goTryon: function () {
    if (!guard.isAllowed()) { wx.showToast({ title: '该功能仅对合作代理开放', icon: 'none', duration: 2000 }); return; }
    var t = this;
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/tryon/entitlement?openid=' + encodeURIComponent(openid),
        success: function (r) {
          var d = r.data || {};
          if (d.active) wx.navigateTo({ url: '/pages/look-studio/index' });
          else wx.navigateTo({ url: '/pages/look-studio/index?promo=1' });
        },
        fail: function () { wx.navigateTo({ url: '/pages/look-studio/index?promo=1' }); }
      });
    }).catch(function () { wx.navigateTo({ url: '/pages/look-studio/index?promo=1' }); });
  },

  goLooks: function () {
    wx.navigateTo({ url: '/pages/looks/index' });
  },

  onNeedsInput: function (e) {
    var v = e.detail.value;
    this.setData({ needs: v });
    var t = this;
    app.getOpenid().then(function (openid) {
      try { wx.setStorageSync('wardrobe_needs_' + openid, v); } catch (e2) {}
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
    wx.showLoading({ title: '上传到云衣橱...' });
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
            data: { openid: openid, image_url: url, category: 'top', source: 'self' },
            success: function () { t.loadCloset(); wx.showToast({ title: '已加入云衣橱', icon: 'none' }); },
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

  delItem: function (e) {
    var t = this;
    var id = e.currentTarget.dataset.id;
    var source = e.currentTarget.dataset.source;
    wx.showModal({
      title: '删除衣橱单品', content: '确定从衣橱删除这件？',
      success: function (r) {
        if (!r.confirm) return;
        app.getOpenid().then(function (openid) {
          wx.request({
            url: BASE + '/api/closet?openid=' + encodeURIComponent(openid) + '&id=' + id,
            method: 'DELETE',
            success: function () {
              if (source === 'stylist') {
                t.setData({ stylistItems: t.data.stylistItems.filter(function (x) { return x.id !== id; }) });
              } else {
                t.setData({ selfItems: t.data.selfItems.filter(function (x) { return x.id !== id; }) });
              }
            }
          });
        }).catch(function () {});
      }
    });
  },

  preview: function (e) {
    var url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ urls: [url], current: url });
  },
});

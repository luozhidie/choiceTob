var app = getApp();
var BASE = 'https://colour-choice.art';

var CAT_NAMES = { top: '上装', bottom: '下装', shoes: '鞋履', bag: '包袋', accessory: '配饰' };
function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  u = u.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
  return u;
}

Page({
  data: {
    selfItems: [],
    stylistItems: [],
    loading: true,
    uploading: false,
  },

  onShow: function () {
    this.loadCloset();
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

  goTryon: function () {
    wx.navigateTo({ url: '/pages/look-studio/index' });
  },

  preview: function (e) {
    var url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ urls: [url], current: url });
  },
});

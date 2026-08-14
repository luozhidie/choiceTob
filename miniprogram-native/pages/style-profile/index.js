var app = getApp();
var BASE = 'https://colour-choice.art';

var SEASON_TYPES = [
  { code: 'deep_cool', name: '深冷' }, { code: 'deep_warm', name: '深暖' },
  { code: 'light_cool', name: '浅冷' }, { code: 'light_warm', name: '浅暖' },
  { code: 'cool_bright', name: '冷亮' }, { code: 'cool_soft', name: '冷柔' },
  { code: 'warm_bright', name: '暖亮' }, { code: 'warm_soft', name: '暖柔' },
  { code: 'clear_cool', name: '净冷' }, { code: 'clear_warm', name: '净暖' },
  { code: 'soft_cool', name: '柔冷' }, { code: 'soft_warm', name: '柔暖' }
];
var STYLE_TAGS = [
  { code: 'ingenue', name: '少女型' }, { code: 'elegant', name: '优雅型' }, { code: 'romantic', name: '浪漫型' },
  { code: 'gamine', name: '少年型' }, { code: 'trendy', name: '时尚型' }, { code: 'classic', name: '古典型' },
  { code: 'natural', name: '自然型' }, { code: 'dramatic', name: '戏剧型' }
];
var OCCASIONS = [
  { code: 'work', name: '职场通勤' }, { code: 'date', name: '约会休闲' }, { code: 'travel', name: '出行旅游' }, { code: 'social', name: '社交礼仪' }, { code: 'home', name: '居家' }
];

Page({
  data: {
    seasonTypes: SEASON_TYPES, styleTagsList: STYLE_TAGS, occasionsList: OCCASIONS,
    seasonType: '', styleTags: [], occasions: [],
    bodyType: '', height: '', weight: '',
    sizes: { top: '', bottom: '', shoe: '' },
    fullBodyPhoto: '',
  },
  onLoad: function () {
    var t = this;
    app.getOpenid().then(function (openid) {
      t.setData({ openid: openid });
      wx.request({
        url: BASE + '/api/style-profile?openid=' + encodeURIComponent(openid),
        success: function (r) {
          var p = (r.data && r.data.profile) || null;
          if (p) {
            t.setData({
              seasonType: p.season_type || '',
              styleTags: p.style_tags || [],
              occasions: p.occasions || [],
              bodyType: p.body_type || '',
              height: p.height ? String(p.height) : '',
              weight: p.weight ? String(p.weight) : '',
              sizes: (p.sizes && typeof p.sizes === 'object') ? p.sizes : {},
              fullBodyPhoto: p.full_body_photo || '',
            });
          }
        }
      });
    }).catch(function () {
      wx.showModal({
        title: '请先登录',
        content: '形象档案需要登录后保存，请先登录。',
        showCancel: false,
        success: function () { wx.navigateBack(); }
      });
    });
  },
  setSeason: function (e) { this.setData({ seasonType: e.currentTarget.dataset.c }); },
  toggleStyle: function (e) {
    var c = e.currentTarget.dataset.c;
    var arr = this.data.styleTags.slice();
    var i = arr.indexOf(c);
    if (i >= 0) arr.splice(i, 1); else arr.push(c);
    this.setData({ styleTags: arr });
  },
  toggleOccasion: function (e) {
    var c = e.currentTarget.dataset.c;
    var arr = this.data.occasions.slice();
    var i = arr.indexOf(c);
    if (i >= 0) arr.splice(i, 1); else arr.push(c);
    this.setData({ occasions: arr });
  },
  onInput: function (e) { var f = e.currentTarget.dataset.f; this.setData({ [f]: e.detail.value }); },
  onSize: function (e) { var k = e.currentTarget.dataset.k; var s = Object.assign({}, this.data.sizes); s[k] = e.detail.value; this.setData({ sizes: s }); },
  choosePhoto: function () {
    var t = this;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0]; if (!f) return;
        wx.showLoading({ title: '上传...' });
        wx.compressImage({ src: f.tempFilePath, quality: 80, compressedWidth: 1000,
          success: function (c) { t._up(c.tempFilePath); }, fail: function () { t._up(f.tempFilePath); } });
      }
    });
  },
  _up: function (filePath) {
    var t = this;
    wx.uploadFile({
      url: BASE + '/api/upload', filePath: filePath, name: 'file',
      success: function (up) {
        wx.hideLoading();
        var d; try { d = JSON.parse(up.data); } catch (e) { d = {}; }
        var url = d.url || (d.data && d.data.url);
        if (!url) { wx.showModal({ title: '上传失败', content: String(d.error || '服务器未返回地址').slice(0, 140), showCancel: false }); return; }
        t.setData({ fullBodyPhoto: url });
        wx.showToast({ title: '已上传', icon: 'none' });
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
  save: function () {
    var t = this;
    if (!t.data.seasonType && !t.data.styleTags.length) { wx.showToast({ title: '先选色彩季型或风格', icon: 'none' }); return; }
    app.getOpenid().then(function (openid) {
      wx.showLoading({ title: '保存中...' });
      wx.request({
        url: BASE + '/api/style-profile', method: 'POST',
        data: {
          openid: openid,
          season_type: t.data.seasonType,
          style_tags: t.data.styleTags,
          occasions: t.data.occasions,
          body_type: t.data.bodyType,
          height: t.data.height ? Number(t.data.height) : null,
          weight: t.data.weight ? Number(t.data.weight) : null,
          sizes: t.data.sizes,
          full_body_photo: t.data.fullBodyPhoto
        },
        success: function (r) {
          wx.hideLoading();
          if (r.data && r.data.error) { wx.showModal({ title: '保存失败', content: r.data.error, showCancel: false }); return; }
          wx.showToast({ title: '形象档案已保存', icon: 'success' });
          setTimeout(function () { wx.navigateBack(); }, 800);
        },
        fail: function () { wx.hideLoading(); wx.showToast({ title: '网络错误', icon: 'none' }); }
      });
    }).catch(function () { wx.showToast({ title: '请先登录', icon: 'none' }); });
  }
});

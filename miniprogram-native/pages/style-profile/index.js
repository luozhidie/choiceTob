var app = getApp();
var BASE = 'https://colour-choice.art';

var SEASON_TYPES = [
  { code: 'light_spring', name: '浅春型' }, { code: 'warm_spring', name: '暖春型' }, { code: 'bright_spring', name: '亮春型' },
  { code: 'light_summer', name: '浅夏型' }, { code: 'soft_summer', name: '柔夏型' }, { code: 'cool_summer', name: '冷夏型' },
  { code: 'light_autumn', name: '浅秋型' }, { code: 'soft_autumn', name: '柔秋型' }, { code: 'deep_autumn', name: '深秋型' },
  { code: 'light_winter', name: '浅冬型' }, { code: 'clear_winter', name: '净冬型' }, { code: 'deep_winter', name: '深冬型' }
];
var STYLE_TAGS = [
  { code: 'natural', name: '自然' }, { code: 'elegant', name: '优雅' }, { code: 'romantic', name: '浪漫' }, { code: 'dramatic', name: '戏剧' },
  { code: 'classic', name: '古典' }, { code: 'gamin', name: '少年' }, { code: 'avant_garde', name: '前卫' }, { code: 'sporty', name: '运动' }
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
    }).catch(function () {});
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
        var tip = em.indexOf('domain') > -1 ? '域名不在白名单：请到微信公众平台→开发设置→uploadFile合法域名添加 https://colour-choice.art' : ('网络错误：' + em);
        wx.showModal({ title: '上传失败', content: tip.slice(0, 200), showCancel: false });
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

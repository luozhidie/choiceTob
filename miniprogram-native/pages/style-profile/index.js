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
// 穿衣风格：以系统 style_tags 表为权威源（女士 8 主 + 56 偏；男士 5 主 + 20 偏）
// 主风格 code 与系统一致：女士 girl/elegant/romantic/boyish/fashion/classic/natural/dramatic；男士加 _m 后缀
// 偏风格 code 规则：{主}_qz_xxx=曲偏直，{主}_qq_xxx=曲偏曲，{主}_zz_xxx=直偏直，{主}_zq_xxx=直偏曲；男士偏风格无 direction
var STYLE_DATA = {
  women: [
    { code: 'girl', name: '少女型', subs: [
      { code: 'girl_qz_boyish', name: '少女偏少年' }, { code: 'girl_qz_fashion', name: '少女偏时尚' }, { code: 'girl_qz_classic', name: '少女偏古典' }, { code: 'girl_qz_natural', name: '少女偏自然' }, { code: 'girl_qz_dramatic', name: '少女偏戏剧' }, { code: 'girl_qq_elegant', name: '少女偏优雅' }, { code: 'girl_qq_romantic', name: '少女偏浪漫' }
    ] },
    { code: 'elegant', name: '优雅型', subs: [
      { code: 'elegant_qz_boyish', name: '优雅偏少年' }, { code: 'elegant_qz_fashion', name: '优雅偏时尚' }, { code: 'elegant_qz_classic', name: '优雅偏古典' }, { code: 'elegant_qz_natural', name: '优雅偏自然' }, { code: 'elegant_qz_dramatic', name: '优雅偏戏剧' }, { code: 'elegant_qq_girl', name: '优雅偏少女' }, { code: 'elegant_qq_romantic', name: '优雅偏浪漫' }
    ] },
    { code: 'romantic', name: '浪漫型', subs: [
      { code: 'romantic_qz_boyish', name: '浪漫偏少年' }, { code: 'romantic_qz_fashion', name: '浪漫偏时尚' }, { code: 'romantic_qz_classic', name: '浪漫偏古典' }, { code: 'romantic_qz_natural', name: '浪漫偏自然' }, { code: 'romantic_qz_dramatic', name: '浪漫偏戏剧' }, { code: 'romantic_qq_girl', name: '浪漫偏少女' }, { code: 'romantic_qq_elegant', name: '浪漫偏优雅' }
    ] },
    { code: 'boyish', name: '少年型', subs: [
      { code: 'boyish_zq_girl', name: '少年偏少女' }, { code: 'boyish_zq_elegant', name: '少年偏优雅' }, { code: 'boyish_zq_romantic', name: '少年偏浪漫' }, { code: 'boyish_zz_fashion', name: '少年偏时尚' }, { code: 'boyish_zz_classic', name: '少年偏古典' }, { code: 'boyish_zz_natural', name: '少年偏自然' }, { code: 'boyish_zz_dramatic', name: '少年偏戏剧' }
    ] },
    { code: 'fashion', name: '时尚型', subs: [
      { code: 'fashion_zq_girl', name: '时尚偏少女' }, { code: 'fashion_zq_elegant', name: '时尚偏优雅' }, { code: 'fashion_zq_romantic', name: '时尚偏浪漫' }, { code: 'fashion_zz_boyish', name: '时尚偏少年' }, { code: 'fashion_zz_classic', name: '时尚偏古典' }, { code: 'fashion_zz_natural', name: '时尚偏自然' }, { code: 'fashion_zz_dramatic', name: '时尚偏戏剧' }
    ] },
    { code: 'classic', name: '古典型', subs: [
      { code: 'classic_zq_girl', name: '古典偏少女' }, { code: 'classic_zq_elegant', name: '古典偏优雅' }, { code: 'classic_zq_romantic', name: '古典偏浪漫' }, { code: 'classic_zz_boyish', name: '古典偏少年' }, { code: 'classic_zz_fashion', name: '古典偏时尚' }, { code: 'classic_zz_natural', name: '古典偏自然' }, { code: 'classic_zz_dramatic', name: '古典偏戏剧' }
    ] },
    { code: 'natural', name: '自然型', subs: [
      { code: 'natural_zq_girl', name: '自然偏少女' }, { code: 'natural_zq_elegant', name: '自然偏优雅' }, { code: 'natural_zq_romantic', name: '自然偏浪漫' }, { code: 'natural_zz_boyish', name: '自然偏少年' }, { code: 'natural_zz_fashion', name: '自然偏时尚' }, { code: 'natural_zz_classic', name: '自然偏古典' }, { code: 'natural_zz_dramatic', name: '自然偏戏剧' }
    ] },
    { code: 'dramatic', name: '戏剧型', subs: [
      { code: 'dramatic_zq_girl', name: '戏剧偏少女' }, { code: 'dramatic_zq_elegant', name: '戏剧偏优雅' }, { code: 'dramatic_zq_romantic', name: '戏剧偏浪漫' }, { code: 'dramatic_zz_boyish', name: '戏剧偏少年' }, { code: 'dramatic_zz_fashion', name: '戏剧偏时尚' }, { code: 'dramatic_zz_classic', name: '戏剧偏古典' }, { code: 'dramatic_zz_natural', name: '戏剧偏自然' }
    ] }
  ],
  men: [
    { code: 'dramatic_m', name: '戏剧型', subs: [
      { code: 'dramatic_m_natural', name: '戏剧偏自然' }, { code: 'dramatic_m_classic', name: '戏剧偏古典' }, { code: 'dramatic_m_romantic', name: '戏剧偏浪漫' }, { code: 'dramatic_m_fashion', name: '戏剧偏时尚' }
    ] },
    { code: 'natural_m', name: '自然型', subs: [
      { code: 'natural_m_dramatic', name: '自然偏戏剧' }, { code: 'natural_m_classic', name: '自然偏古典' }, { code: 'natural_m_romantic', name: '自然偏浪漫' }, { code: 'natural_m_fashion', name: '自然偏时尚' }
    ] },
    { code: 'classic_m', name: '古典型', subs: [
      { code: 'classic_m_dramatic', name: '古典偏戏剧' }, { code: 'classic_m_natural', name: '古典偏自然' }, { code: 'classic_m_romantic', name: '古典偏浪漫' }, { code: 'classic_m_fashion', name: '古典偏时尚' }
    ] },
    { code: 'romantic_m', name: '浪漫型', subs: [
      { code: 'romantic_m_dramatic', name: '浪漫偏戏剧' }, { code: 'romantic_m_natural', name: '浪漫偏自然' }, { code: 'romantic_m_classic', name: '浪漫偏古典' }, { code: 'romantic_m_fashion', name: '浪漫偏时尚' }
    ] },
    { code: 'fashion_m', name: '时尚型', subs: [
      { code: 'fashion_m_dramatic', name: '时尚偏戏剧' }, { code: 'fashion_m_natural', name: '时尚偏自然' }, { code: 'fashion_m_classic', name: '时尚偏古典' }, { code: 'fashion_m_romantic', name: '时尚偏浪漫' }
    ] }
  ]
};
function deriveStyle(gender, tags) {
  var mains = STYLE_DATA[gender];
  for (var i = 0; i < mains.length; i++) {
    if (tags.indexOf(mains[i].code) > -1) {
      return { gender: gender, mainStyle: mains[i].code, mainName: mains[i].name, subList: mains[i].subs };
    }
  }
  return { gender: gender, mainStyle: '', mainName: '', subList: [] };
}
// 偏风格小标题：男士风格不分直曲，故不显示「曲直」维度
function subHeadingOf(gender, mainName) {
  if (!mainName) return '';
  return gender === 'men' ? (mainName + '的偏风格（如' + mainName + '偏自然，可多选）') : (mainName + '的偏风格（如' + mainName + '偏浪漫，可多选）');
}
var OCCASIONS = [
  { code: 'work', name: '职场通勤' }, { code: 'date', name: '约会休闲' }, { code: 'travel', name: '出行旅游' }, { code: 'social', name: '社交礼仪' }, { code: 'home', name: '居家' }
];

Page({
  data: {
    seasonTypes: SEASON_TYPES, occasionsList: OCCASIONS,
    gender: 'women', mainList: STYLE_DATA.women, mainStyle: '', mainName: '', subList: [], subHeading: '',
    seasonType: '', styleTags: [], occasions: [], pureSelected: false,
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
            var tags = p.style_tags || [];
            var gender = 'women';
            for (var k = 0; k < tags.length; k++) { if (String(tags[k]).indexOf('_m') > -1) { gender = 'men'; break; } }
            var der = deriveStyle(gender, tags);
            var hasSubs = der.subList.some(function (s) { return tags.indexOf(s.code) >= 0; });
            var pureSelected = !!der.mainStyle && !hasSubs;
            t.setData({
              seasonType: p.season_type || '',
              styleTags: tags,
              gender: der.gender, mainList: STYLE_DATA[der.gender], mainStyle: der.mainStyle, mainName: der.mainName, subList: der.subList, subHeading: subHeadingOf(der.gender, der.mainName), pureSelected: pureSelected,
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
  _codeFrom: function (e) {
    var ct = e.currentTarget || {};
    var tg = e.target || {};
    return ct.dataset && (ct.dataset.c || ct.dataset.code || ct.id) || (tg.dataset && (tg.dataset.c || tg.dataset.code || tg.id)) || '';
  },
  setSeason: function (e) { var c = this._codeFrom(e); if (!c) return; this.setData({ seasonType: c }); },
  setGender: function (e) {
    var g = e.currentTarget.dataset.g;
    if (g === this.data.gender) return;
    this.setData({ gender: g, mainList: STYLE_DATA[g], mainStyle: '', mainName: '', subList: [], subHeading: '', styleTags: [] });
  },
  toggleMain: function (e) {
    var t = this; var c = t._codeFrom(e); if (!c) return;
    var mains = STYLE_DATA[t.data.gender];
    var cur = null, old = null;
    for (var i = 0; i < mains.length; i++) { if (mains[i].code === c) cur = mains[i]; if (mains[i].code === t.data.mainStyle) old = mains[i]; }
    var tags = t.data.styleTags.slice();
    if (t.data.mainStyle === c) {
      tags = tags.filter(function (x) { return x !== c && !(cur && cur.subs.some(function (s) { return s.code === x; })); });
      t.setData({ mainStyle: '', mainName: '', subList: [], subHeading: '', styleTags: tags, pureSelected: false });
    } else {
      if (old) tags = tags.filter(function (x) { return x !== old.code && !old.subs.some(function (s) { return s.code === x; }); });
      tags.push(c);
      t.setData({ mainStyle: c, mainName: cur.name, subList: cur.subs, subHeading: subHeadingOf(t.data.gender, cur.name), styleTags: tags, pureSelected: true });
    }
  },
  // 纯主风格：仅选中主风格 code（清空该主风格下所有偏风格）
  togglePureMain: function () {
    var t = this; var c = t.data.mainStyle; if (!c) return;
    var cur = null; var mains = STYLE_DATA[t.data.gender];
    for (var i = 0; i < mains.length; i++) { if (mains[i].code === c) cur = mains[i]; }
    var tags = t.data.styleTags.slice();
    var hasSubs = cur && cur.subs.some(function (s) { return tags.indexOf(s.code) >= 0; });
    if (tags.indexOf(c) >= 0 && !hasSubs) {
      tags = tags.filter(function (x) { return x !== c; });
      t.setData({ styleTags: tags, pureSelected: false });
    } else {
      tags = tags.filter(function (x) { return x !== c && !(cur && cur.subs.some(function (s) { return s.code === x; })); });
      tags.push(c);
      t.setData({ styleTags: tags, pureSelected: true });
    }
  },
  toggleSub: function (e) {
    var c = this._codeFrom(e);
    if (!c) { wx.showToast({ title: '未取到风格码', icon: 'none' }); return; }
    var arr = this.data.styleTags.slice();
    var i = arr.indexOf(c);
    if (i >= 0) arr.splice(i, 1); else arr.push(c);
    var cur = null; var mains = STYLE_DATA[this.data.gender];
    for (var k = 0; k < mains.length; k++) { if (mains[k].code === this.data.mainStyle) cur = mains[k]; }
    var pureSelected = !!this.data.mainStyle && cur && !cur.subs.some(function (s) { return arr.indexOf(s.code) >= 0; });
    this.setData({ styleTags: arr, pureSelected: pureSelected });
  },
  toggleOccasion: function (e) {
    var c = this._codeFrom(e);
    if (!c) { wx.showToast({ title: '未取到场合码', icon: 'none' }); return; }
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
          gender: t.data.gender,
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

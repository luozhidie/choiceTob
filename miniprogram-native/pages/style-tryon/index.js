var app = getApp();
var BASE = 'https://colour-choice.art';
var SUPABASE_PUBLIC = 'https://fxeknwkmytzedkhplozn.supabase.co/storage/v1/object/public/';
var BUCKET = 'blocks-images';

function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  u = u.replace(/^https?:\/\/lzdchoice\.supabase\.co\//i, 'https://colour-choice.art/sapimg/');
  return u;
}
function garmentUrl(path) {
  return rewriteSupabase(SUPABASE_PUBLIC + BUCKET + '/' + path);
}

// 8 件女士风格测试衣（与网站 style-tryon.ts 完全一致）
var GARMENTS = [
  { id: 'shaonian', name: '少年型', path: 'style-test/shaonian.jpg', short: '帅气利落·中性直线' },
  { id: 'shishang', name: '时尚型', path: 'style-test/shishang.jpg', short: '个性潮流·设计感' },
  { id: 'gudian', name: '古典型', path: 'style-test/gudian.jpg', short: '端庄精致·上品严谨' },
  { id: 'ziran', name: '自然型', path: 'style-test/ziran.jpg', short: '潇洒随意·亲切舒适' },
  { id: 'xiju', name: '戏剧型', path: 'style-test/xiju.jpg', short: '大气夸张·强气场' },
  { id: 'shaonv', name: '少女型', path: 'style-test/shaonv.jpg', short: '甜美圆润·活泼可爱' },
  { id: 'youya', name: '优雅型', path: 'style-test/youya.jpg', short: '温柔柔美·女人味' },
  { id: 'langman', name: '浪漫型', path: 'style-test/langman.jpg', short: '华丽妩媚·曲线性感' },
];

function emptyResults() {
  return GARMENTS.map(function (g) { return { id: g.id, name: g.name, short: g.short, url: '', error: '' }; });
}

Page({
  data: {
    personPath: '',
    personUrl: '',
    uploading: false,
    running: false,
    doneCount: 0,
    results: [],
    selected: [],
    selectedNames: '',
    concluded: false,
    proLeft: 0,
    checking: false,
  },

  onLoad: function () {
    this.setData({ results: emptyResults() });
    this.checkEntitlement();
  },

  checkEntitlement: function () {
    var t = this;
    t.setData({ checking: true });
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/tryon/entitlement?openid=' + encodeURIComponent(openid),
        method: 'GET',
        success: function (r) {
          var d = r.data || {};
          t.setData({ proLeft: d.proLeft || 0, checking: false });
        },
        fail: function () { t.setData({ checking: false }); }
      });
    }).catch(function () { t.setData({ checking: false }); });
  },

  buyPro: function () {
    wx.navigateTo({ url: '/pages/tryon-pro/index' });
  },

  choosePerson: function () {
    var t = this;
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0];
        if (!f) return;
        t.setData({ personPath: f.tempFilePath, personUrl: '', results: emptyResults(), selected: [], concluded: false, doneCount: 0 });
        t.uploadPerson(f.tempFilePath);
      }
    });
  },

  uploadPerson: function (filePath) {
    var t = this;
    t.setData({ uploading: true });
    wx.uploadFile({
      url: BASE + '/api/tryon/upload-person',
      filePath: filePath, name: 'personImage',
      success: function (up) {
        var d; try { d = JSON.parse(up.data); } catch (e) { d = {}; }
        if (d.error) { wx.showToast({ title: '人像处理失败', icon: 'none' }); t.setData({ uploading: false }); return; }
        t.setData({ personUrl: rewriteSupabase(d.personImageUrl), uploading: false });
      },
      fail: function () { wx.showToast({ title: '上传失败', icon: 'none' }); t.setData({ uploading: false }); }
    });
  },

  startTryon: function () {
    var t = this;
    if (t.data.proLeft <= 0) {
      wx.showModal({
        title: '需开通专业版',
        content: '八大风格真人试穿属于专业诊断，需购买 ¥998 专业版（100 次）后使用。',
        confirmText: '去开通',
        cancelText: '取消',
        success: function (res) { if (res.confirm) t.buyPro(); }
      });
      return;
    }
    if (!t.data.personUrl) {
      if (t.data.personPath) t.uploadPerson(t.data.personPath);
      return;
    }
    if (!t.data.personPath) { wx.showToast({ title: '请先上传真人照', icon: 'none' }); return; }
    t.setData({ running: true, doneCount: 0, selected: [], concluded: false });

    var BATCH = 4;
    var batches = [];
    for (var b = 0; b < GARMENTS.length; b += BATCH) {
      batches.push(GARMENTS.slice(b, b + BATCH));
    }
    function runBatch(batch) {
      return Promise.all(batch.map(function (g) {
        return new Promise(function (resolve) {
          wx.uploadFile({
            url: BASE + '/api/tryon/generate',
            filePath: t.data.personPath,
            name: 'personImage',
            formData: {
              personImageUrl: t.data.personUrl,
              garmentImageUrl: garmentUrl(g.path),
              userId: 'style-tryon-mini',
            },
            success: function (res) {
              var d; try { d = JSON.parse(res.data); } catch (e) { d = {}; }
              var updated = { id: g.id, name: g.name, short: g.short, url: '', error: '' };
              if (d.error) { updated.error = String(d.error).slice(0, 60); }
              else { updated.url = rewriteSupabase(d.resultUrl); }
              t.setData({
                results: t.data.results.map(function (r) { return r.id === g.id ? updated : r; }),
                doneCount: t.data.doneCount + 1,
              });
              resolve();
            },
            fail: function () {
              t.setData({
                results: t.data.results.map(function (r) {
                  return r.id === g.id ? { id: g.id, name: g.name, short: g.short, url: '', error: '网络错误' } : r;
                }),
                doneCount: t.data.doneCount + 1,
              });
              resolve();
            }
          });
        });
      }));
    }
    var chain = Promise.resolve();
    batches.forEach(function (batch) {
      chain = chain.then(function () { return runBatch(batch); });
    });
    chain.then(function () { t.setData({ running: false }); });
  },

  toggleSelect: function (e) {
    var id = e.currentTarget.dataset.id;
    var r = this.data.results.filter(function (x) { return x.id === id; })[0];
    if (!r || !r.url) return;
    var sel = this.data.selected.slice();
    var idx = sel.indexOf(id);
    if (idx >= 0) { sel.splice(idx, 1); }
    else {
      if (sel.length >= 2) { wx.showToast({ title: '最多选 2 个', icon: 'none' }); return; }
      sel.push(id);
    }
    var names = sel.map(function (sid) {
      var gr = GARMENTS.filter(function (g) { return g.id === sid; })[0];
      return gr ? gr.name : '';
    });
    this.setData({ selected: sel, selectedNames: names.join(' / ') });
  },

  saveConclusion: function () {
    this.setData({ concluded: true });
  },

  reset: function () {
    this.setData({ results: emptyResults(), selected: [], concluded: false, doneCount: 0 });
  },

  preview: function (e) {
    var url = e.currentTarget.dataset.url;
    if (url) wx.previewImage({ urls: [url], current: url });
  },
});

var app = getApp();
var guard = require('../../utils/agent-guard.js');
var BASE = 'https://colour-choice.art';
var SUPABASE_PUBLIC = 'https://fxeknwkmytzedkhplozn.supabase.co/storage/v1/object/public/';
var BUCKET = 'blocks-images';

function rewriteSupabase(u) {
  if (typeof u !== 'string') return u;
  u = u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
  return u;
}
function garmentUrl(path) {
  // 以 / 开头 → 网站自身 CDN（public 目录），最稳定
  if (path && path.charAt(0) === '/') return BASE + path;
  return rewriteSupabase(SUPABASE_PUBLIC + BUCKET + '/' + path);
}

// 8 件女士风格测试衣（与网站 style-tryon.ts 完全一致）
// 路径指向 public/tryon-garments/（Vercel CDN），为 docx 解出的真实测试衣
var GARMENTS = [
  { id: 'shaonian', name: '少年型', path: '/tryon-garments/shaonian.png', short: '帅气利落·中性直线' },
  { id: 'shishang', name: '时尚型', path: '/tryon-garments/shishang.png', short: '个性潮流·设计感' },
  { id: 'gudian', name: '古典型', path: '/tryon-garments/gudian.png', short: '端庄精致·上品严谨' },
  { id: 'ziran', name: '自然型', path: '/tryon-garments/ziran.png', short: '潇洒随意·亲切舒适' },
  { id: 'xiju', name: '戏剧型', path: '/tryon-garments/xiju.png', short: '大气夸张·强气场' },
  { id: 'shaonv', name: '少女型', path: '/tryon-garments/shaonv.png', short: '甜美圆润·活泼可爱' },
  { id: 'youya', name: '优雅型', path: '/tryon-garments/youya.png', short: '温柔柔美·女人味' },
  { id: 'langman', name: '浪漫型', path: '/tryon-garments/langman.png', short: '华丽妩媚·曲线性感' },
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
    checkError: false,
    /* 形象档案全身照 */
    profilePhotos: [],
    selectedProfileIndex: -1,
  },

  onLoad: function () {
  if (!guard.guardAgentOnly()) return;
    this.setData({ results: emptyResults() });
    this.checkEntitlement();
    this.loadProfilePhotos();
  },

  onShow: function () {
    // 从支付页返回或从其他页面切回时，重新检查权益
    this.checkEntitlement();
  },

  /* ========== 读取形象档案全身照 ========== */
  loadProfilePhotos: function () {
    var t = this;
    if (!app || !app.getOpenid) return;
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/style-profile?openid=' + encodeURIComponent(openid),
        method: 'GET',
        success: function (r) {
          var d = r.data || {};
          var p = d.profile;
          if (!p) return;
          var photos = Array.isArray(p.full_body_photos) && p.full_body_photos.length
            ? p.full_body_photos
            : (p.full_body_photo ? [p.full_body_photo] : []);
          var selectedIdx = typeof p.selected_photo_index === 'number' ? p.selected_photo_index : 0;
          if (selectedIdx >= photos.length) selectedIdx = 0;
          t.setData({ profilePhotos: photos, selectedProfileIndex: photos.length ? selectedIdx : -1 });
          /* 有档案照片时自动处理第一张为试衣人像，无需再上传 */
          if (photos.length > 0) {
            t.processProfilePhoto(photos[selectedIdx], selectedIdx);
          }
        }
      });
    }).catch(function () {});
  },

  /* ========== 选择形象档案照片并自动处理白底 ========== */
  selectProfilePhoto: function (e) {
    var idx = e.currentTarget.dataset.index;
    var url = this.data.profilePhotos[idx];
    this.processProfilePhoto(url, idx);
  },

  /* 处理形象档案照片为白底人像（自动选中 + 手动切换共用） */
  processProfilePhoto: function (url, idx) {
    var t = this;
    if (!url) return;
    t.setData({ selectedProfileIndex: idx, uploading: true, personPath: url, personUrl: '', results: emptyResults(), selected: [], concluded: false, doneCount: 0 });
    wx.request({
      url: BASE + '/api/tryon/upload-person-url',
      method: 'POST',
      data: { imageUrl: url },
      success: function (r) {
        var d = r.data || {};
        if (d.error) {
          wx.showToast({ title: '处理失败：' + d.error, icon: 'none' });
          t.setData({ uploading: false });
          return;
        }
        t.setData({ personUrl: rewriteSupabase(d.personImageUrl), uploading: false });
      },
      fail: function () {
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        t.setData({ uploading: false });
      }
    });
  },

  checkEntitlement: function () {
    var t = this;
    if (t.data.checking) return;
    t.setData({ checking: true, checkError: false });
    if (!app || !app.getOpenid) {
      t.setData({ checking: false, checkError: true });
      return;
    }
    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/tryon/entitlement?openid=' + encodeURIComponent(openid),
        method: 'GET',
        success: function (r) {
          var d = r.data || {};
          t.setData({ proLeft: d.proLeft || 0, checking: false, checkError: false });
        },
        fail: function () { t.setData({ checking: false, checkError: true }); }
      });
    }).catch(function () { t.setData({ checking: false, checkError: true }); });
  },

  retryCheckEntitlement: function () {
    this.checkEntitlement();
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
        t.setData({ personPath: f.tempFilePath, personUrl: '', selectedProfileIndex: -1, results: emptyResults(), selected: [], concluded: false, doneCount: 0 });
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
    if (t.data.checkError) {
      t.retryCheckEntitlement();
      return;
    }
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
          wx.request({
            url: BASE + '/api/tryon/generate',
            method: 'POST',
            data: {
              personImageUrl: t.data.personUrl,
              garmentImageUrl: garmentUrl(g.path),
              userId: 'style-tryon-mini',
              title: g.name,
            },
            success: function (res) {
              var d = res.data || {};
              if (d.error) {
                t.setData({
                  results: t.data.results.map(function (r) { return r.id === g.id ? { id: g.id, name: g.name, short: g.short, url: '', error: String(d.error).slice(0, 60) } : r; }),
                  doneCount: t.data.doneCount + 1,
                });
                resolve();
                return;
              }
              if (d.generationId) {
                t.setData({
                  results: t.data.results.map(function (r) { return r.id === g.id ? { id: g.id, name: g.name, short: g.short, url: '', error: '', generationId: d.generationId } : r; }),
                });
                t.pollTryon(d.generationId, g, function (resultUrl, err) {
                  var updated = { id: g.id, name: g.name, short: g.short, url: '', error: '', generationId: d.generationId };
                  if (err) updated.error = err;
                  else updated.url = rewriteSupabase(resultUrl);
                  t.setData({
                    results: t.data.results.map(function (r) { return r.id === g.id ? updated : r; }),
                    doneCount: t.data.doneCount + 1,
                  });
                  resolve();
                });
                return;
              }
              t.setData({
                results: t.data.results.map(function (r) { return r.id === g.id ? { id: g.id, name: g.name, short: g.short, url: '', error: '未返回任务ID' } : r; }),
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

  pollTryon: function (generationId, g, onDone) {
    var t = this;
    var attempts = 0;
    var maxAttempts = 40;
    var done = false;
    var timer = null;
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
            if (timer) clearInterval(timer);
            onDone('', String(d.error).slice(0, 60));
            return;
          }
          if (d.status === 'COMPLETED' && d.resultUrl) {
            done = true;
            if (timer) clearInterval(timer);
            onDone(d.resultUrl, '');
            return;
          }
          if (attempts >= maxAttempts) {
            done = true;
            if (timer) clearInterval(timer);
            onDone('', '生成超时');
          }
        },
        fail: function () {
          if (done) return;
          if (attempts >= maxAttempts) {
            done = true;
            if (timer) clearInterval(timer);
            onDone('', '网络错误');
          }
        }
      });
    };
    poll();
    timer = setInterval(poll, 5000);
  },
});

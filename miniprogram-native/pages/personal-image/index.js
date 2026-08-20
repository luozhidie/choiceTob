var app = getApp();

Page({
  data: {
    heroImage: '',
    blocks: [],
    // 顾问人工服务（提交资料 → 顾问人工报价，不展示价格）
    showConsult: false,
    consultName: '',
    consultContact: '',
    consultNotes: '',
    consultPhotos: [],
    consultSubmitting: false,
  },
  onLoad: function () {
    wx.setNavigationBarTitle({ title: '形象管理' });
    this.loadConfig();
  },
  // 读取后台配置（Hero 大图 + 图片模块）
  loadConfig: function () {
    var t = this;
    wx.request({
      url: 'https://colour-choice.art/api/public/site-assets?keys=diagnosis_hero,diagnosis_blocks',
      method: 'GET',
      success: function (r) {
        var d = r.data || {};
        if (d.success && d.data) {
          if (d.data.diagnosis_hero) t.setData({ heroImage: d.data.diagnosis_hero });
          if (d.data.diagnosis_blocks) {
            try {
              var list = JSON.parse(d.data.diagnosis_blocks);
              if (Array.isArray(list)) t.setData({ blocks: list });
            } catch (e) {}
          }
        }
      }
    });
  },
  // 色彩季型与风格测试 → 风格测试
  goTest: function () {
    wx.navigateTo({ url: '/pages/style-test/index' });
  },
  // 整体形象管理 → 在线课程
  goPaid: function () {
    wx.navigateTo({ url: '/pages/courses/index' });
  },
  noop: function () {},

  // —— 顾问人工服务（低调入口，提交资料 → 人工报价）——
  openConsult: function () { this.setData({ showConsult: true }); },
  closeConsult: function () { this.setData({ showConsult: false }); },
  onCName: function (e) { this.setData({ consultName: e.detail.value }); },
  onCContact: function (e) { this.setData({ consultContact: e.detail.value }); },
  onCNotes: function (e) { this.setData({ consultNotes: e.detail.value }); },

  chooseConsultPhoto: function () {
    var t = this;
    if (t.data.consultPhotos.length >= 3) { wx.showToast({ title: '最多 3 张', icon: 'none' }); return; }
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: function (res) {
        var f = res.tempFiles && res.tempFiles[0];
        if (!f) return;
        wx.showLoading({ title: '上传照片...' });
        wx.uploadFile({
          url: 'https://colour-choice.art/api/upload', filePath: f.tempFilePath, name: 'file',
          success: function (up) {
            wx.hideLoading();
            var d; try { d = JSON.parse(up.data); } catch (e) { d = {}; }
            var url = d.url || (d.data && d.data.url);
            if (!url) { wx.showToast({ title: '上传失败', icon: 'none' }); return; }
            t.setData({ consultPhotos: t.data.consultPhotos.concat([url]) });
          },
          fail: function () { wx.hideLoading(); wx.showToast({ title: '上传失败', icon: 'none' }); }
        });
      }
    });
  },
  removeConsultPhoto: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var photos = this.data.consultPhotos.slice();
    photos.splice(idx, 1);
    this.setData({ consultPhotos: photos });
  },

  submitConsult: function () {
    var t = this;
    var name = t.data.consultName.trim();
    var contact = t.data.consultContact.trim();
    if (!name || !contact) { wx.showToast({ title: '请填写姓名与联系方式', icon: 'none' }); return; }
    t.setData({ consultSubmitting: true });
    app.getOpenid().then(function (openid) {
      wx.request({
        url: 'https://colour-choice.art/api/diagnosis-consult',
        method: 'POST',
        data: {
          openid: openid,
          name: name,
          contact: contact,
          notes: t.data.consultNotes,
          photo_urls: t.data.consultPhotos,
          source: 'personal_image_manual',
        },
        success: function (r) {
          t.setData({ consultSubmitting: false, showConsult: false });
          var d = r.data || {};
          if (d.error) { wx.showModal({ title: '提交失败', content: d.error, showCancel: false }); return; }
          wx.showModal({
            title: '提交成功',
            content: d.message || '资料已提交，顾问会在 24 小时内联系你报价',
            showCancel: false,
            success: function () {
              t.setData({ consultName: '', consultContact: '', consultNotes: '', consultPhotos: [] });
            }
          });
        },
        fail: function () {
          t.setData({ consultSubmitting: false });
          wx.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    }).catch(function () {
      t.setData({ consultSubmitting: false });
      wx.showToast({ title: '请先登录', icon: 'none' });
    });
  },
});

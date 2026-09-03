var app = getApp();
var BASE = 'https://colour-choice.art';
var mp = require('../../utils/mp-page-copy.js');

var EXPERIENCE = ['无', '1年以下', '1-3年', '3-5年', '5年以上'];
var STORE_COUNT = ['1-2家', '3-5家', '6-10家', '10家以上'];

Page({
  data: {
    experienceOptions: EXPERIENCE,
    storeCountOptions: STORE_COUNT,
    form: { name: '', phone: '', email: '', company: '', wechat: '', experience: 0, storeCount: 0, message: '' },
    submitting: false,
    submitted: false,
    pageCopy: {},
  },

  onLoad: function () {
    var t = this;
    mp.loadMpSection('agent', function (c) { t.setData({ pageCopy: (c && c.recruit) || {} }); });
  },

  update: function (k, v) {
    var f = this.data.form; f[k] = v; this.setData({ form: f });
  },
  onName: function (e) { this.update('name', e.detail.value); },
  onPhone: function (e) { this.update('phone', e.detail.value); },
  onEmail: function (e) { this.update('email', e.detail.value); },
  onCompany: function (e) { this.update('company', e.detail.value); },
  onWechat: function (e) { this.update('wechat', e.detail.value); },
  onMessage: function (e) { this.update('message', e.detail.value); },
  onExperience: function (e) { var f = this.data.form; f.experience = Number(e.detail.value); this.setData({ form: f }); },
  onStoreCount: function (e) { var f = this.data.form; f.storeCount = Number(e.detail.value); this.setData({ form: f }); },

  submit: function () {
    var t = this;
    var f = t.data.form;
    if (!f.name) { wx.showToast({ title: '请填写姓名', icon: 'none' }); return; }
    if (!f.phone) { wx.showToast({ title: '请填写电话', icon: 'none' }); return; }
    if (!/^1[3-9]\d{9}$/.test(f.phone)) { wx.showToast({ title: '请填写正确手机号', icon: 'none' }); return; }
    if (t.data.submitting) return;
    t.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    app.getOpenid().then(function (openid) {
      wx.request({
        url: BASE + '/api/agent/apply',
        method: 'POST',
        header: { 'Content-Type': 'application/json' },
        data: {
          openid: openid || '',
          name: f.name,
          phone: f.phone,
          email: f.email,
          company: f.company,
          wechat_id: f.wechat,
          experience: EXPERIENCE[f.experience],
          store_count: STORE_COUNT[f.storeCount],
          message: f.message,
        },
        success: function (r) {
          wx.hideLoading();
          t.setData({ submitting: false });
          var d = r.data || {};
          if (d.error) { wx.showModal({ title: '提交失败', content: d.error, showCancel: false }); return; }
          t.setData({ submitted: true });
        },
        fail: function () {
          wx.hideLoading();
          t.setData({ submitting: false });
          wx.showToast({ title: '网络错误', icon: 'none' });
        }
      });
    }).catch(function () {
      wx.hideLoading();
      t.setData({ submitting: false });
      wx.showToast({ title: '无法获取 openid', icon: 'none' });
    });
  },

  goBack: function () { wx.navigateBack(); },
  goHome: function () { wx.switchTab({ url: '/pages/home/index' }); },
  noop: function () {},
});

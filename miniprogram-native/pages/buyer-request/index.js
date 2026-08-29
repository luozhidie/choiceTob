var BASE = 'https://colour-choice.art';

Page({
  data: {
    categoryOptions: [
      {name:'外套', selected:false},{name:'连衣裙', selected:false},{name:'套装', selected:false},{name:'裤装', selected:false},
      {name:'针织', selected:false},{name:'上衣', selected:false},{name:'半身裙', selected:false},{name:'鞋包配饰', selected:false}
    ],
    styleOptions: [
      {name:'简约风', selected:false},{name:'复古风', selected:false},{name:'新中式', selected:false},{name:'韩系风', selected:false},
      {name:'日系风', selected:false},{name:'法式风', selected:false},{name:'通勤风', selected:false},{name:'街头风', selected:false},
      {name:'老钱风', selected:false},{name:'波西米亚风', selected:false},{name:'运动休闲', selected:false},{name:'文艺风', selected:false},
      {name:'甜美风', selected:false},{name:'辣妹风', selected:false},{name:'中性风', selected:false},{name:'轻奢风', selected:false}
    ],
    colorOptions: [
      {name:'奶杏', selected:false},{name:'黑白灰', selected:false},{name:'大地色', selected:false},{name:'莫兰迪', selected:false},
      {name:'亮彩色', selected:false},{name:'深色系', selected:false},{name:'浅色系', selected:false}
    ],
    customCategory: '',
    customStyle: '',
    customColor: '',
    hasOrphan: false,
    budgetMin: '',
    budgetMax: '',
    note: '',
    contactInfo: '',
    submitting: false,
    submitted: false,
    workQr: ''
  },

  onLoad: function () {
    var that = this;
    // 拉取企业微信二维码（site_assets.wechat_work_qr）
    wx.request({
      url: BASE + '/api/public/site-assets?keys=wechat_work_qr',
      success: function (r) {
        var d = (r.data && r.data.data) || {};
        if (d.wechat_work_qr) that.setData({ workQr: d.wechat_work_qr });
      }
    });
  },

  toggleCat: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var key = 'categoryOptions[' + idx + '].selected';
    this.setData({ [key]: !this.data.categoryOptions[idx].selected });
  },
  toggleStyle: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var key = 'styleOptions[' + idx + '].selected';
    this.setData({ [key]: !this.data.styleOptions[idx].selected });
  },
  toggleColor: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var key = 'colorOptions[' + idx + '].selected';
    this.setData({ [key]: !this.data.colorOptions[idx].selected });
  },
  onOrphan: function (e) { this.setData({ hasOrphan: e.detail.value }); },
  onMin: function (e) { this.setData({ budgetMin: e.detail.value }); },
  onMax: function (e) { this.setData({ budgetMax: e.detail.value }); },
  onNote: function (e) { this.setData({ note: e.detail.value }); },
  onContact: function (e) { this.setData({ contactInfo: e.detail.value }); },
  onCustomCategory: function (e) { this.setData({ customCategory: e.detail.value }); },
  onCustomStyle: function (e) { this.setData({ customStyle: e.detail.value }); },
  onCustomColor: function (e) { this.setData({ customColor: e.detail.value }); },

  submit: function () {
    var d = this.data;
    var cats = d.categoryOptions.filter(function(x){return x.selected;}).map(function(x){return x.name;});
    var styles = d.styleOptions.filter(function(x){return x.selected;}).map(function(x){return x.name;});
    var colors = d.colorOptions.filter(function(x){return x.selected;}).map(function(x){return x.name;});
    if (d.customCategory) cats.push(d.customCategory);
    if (d.customStyle) styles.push(d.customStyle);
    if (d.customColor) colors.push(d.customColor);

    if (cats.length === 0 && styles.length === 0 && colors.length === 0 && !d.note) {
      wx.showToast({ title: '请至少填一项需求', icon: 'none' });
      return;
    }
    this.setData({ submitting: true });
    var token = wx.getStorageSync('token') || '';
    var userId = '';
    var ui = wx.getStorageSync('user_info');
    if (ui) userId = ui.openid || ui.id || ui.nickName || '';

    var that = this;
    wx.request({
      url: BASE + '/api/buyer-request',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
      data: {
        userId: userId,
        contact_name: '',
        contact_info: d.contactInfo,
        category: cats.join('、'),
        style: styles.join('、'),
        color: colors.join('、'),
        has_orphan: d.hasOrphan,
        budget_min: d.budgetMin,
        budget_max: d.budgetMax,
        note: d.note
      },
      success: function (r) {
        if (r.data && r.data.success) {
          that.setData({ submitting: false, submitted: true });
          wx.showToast({ title: '提交成功', icon: 'success' });
        } else {
          that.setData({ submitting: false });
          wx.showToast({ title: (r.data && r.data.error) || '提交失败', icon: 'none' });
        }
      },
      fail: function () {
        that.setData({ submitting: false });
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
      }
    });
  },

  goBack: function () {
    wx.navigateBack({ delta: 1 });
  }
});

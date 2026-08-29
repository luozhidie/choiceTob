var BASE = 'https://colour-choice.art';

Page({
  data: {
    categoryOptions: ['外套', '连衣裙', '套装', '裤装', '针织', '上衣', '半身裙', '鞋包配饰'],
    styleOptions: ['简约风','复古风','新中式','韩系风','日系风','法式风','通勤风','街头风','老钱风','波西米亚风','运动休闲','文艺风','甜美风','辣妹风','中性风','轻奢风'],
    colorOptions: ['奶杏', '黑白灰', '大地色', '莫兰迪', '亮彩色', '深色系', '浅色系'],
    selectedCategory: [],
    selectedStyle: [],
    selectedColor: [],
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
    var v = e.currentTarget.dataset.v;
    var arr = this.data.selectedCategory.slice();
    var i = arr.indexOf(v);
    if (i === -1) arr.push(v); else arr.splice(i, 1);
    this.setData({ selectedCategory: arr });
  },
  toggleStyle: function (e) {
    var v = e.currentTarget.dataset.v;
    var arr = this.data.selectedStyle.slice();
    var i = arr.indexOf(v);
    if (i === -1) arr.push(v); else arr.splice(i, 1);
    this.setData({ selectedStyle: arr });
  },
  toggleColor: function (e) {
    var v = e.currentTarget.dataset.v;
    var arr = this.data.selectedColor.slice();
    var i = arr.indexOf(v);
    if (i === -1) arr.push(v); else arr.splice(i, 1);
    this.setData({ selectedColor: arr });
  },
  onOrphan: function (e) { this.setData({ hasOrphan: e.detail.value }); },
  onMin: function (e) { this.setData({ budgetMin: e.detail.value }); },
  onMax: function (e) { this.setData({ budgetMax: e.detail.value }); },
  onNote: function (e) { this.setData({ note: e.detail.value }); },
  onContact: function (e) { this.setData({ contactInfo: e.detail.value }); },

  submit: function () {
    var d = this.data;
    if (d.selectedCategory.length === 0 && d.selectedStyle.length === 0 && d.selectedColor.length === 0 && !d.note) {
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
        category: d.selectedCategory.join('、'),
        style: d.selectedStyle.join('、'),
        color: d.selectedColor.join('、'),
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

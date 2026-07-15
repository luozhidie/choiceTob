var app = getApp();

Page({
  data: {
    inputText: '',
    mode: 'url',         // url | batch
    urls: [],
    results: [],
    isProcessing: false,
    toastText: '',
    toastType: '',   // success | error
  },

  onLoad: function (options) {
    // 如果从小程序其他页面跳转过来，可以带 URL
    if (options && options.url) {
      this.setData({ inputText: decodeURIComponent(options.url), mode: 'url' });
    }
  },

  // 切换模式
  switchMode: function (e) {
    this.setData({ mode: e.currentTarget.dataset.mode, inputText: '', results: [] });
  },

  // 输入变化
  onInput: function (e) {
    this.setData({ inputText: e.detail.value });
  },

  // 开始导入
  startImport: function () {
    var that = this;
    var text = that.data.inputText.trim();
    if (!text) {
      that.showToast('请输入商品链接');
      return;
    }

    var urls = [];
    if (that.data.mode === 'batch') {
      urls = text.split(/[\n\r]+/).map(function (l) { return l.trim(); }).filter(function (l) { return l.length > 0; });
    } else {
      urls = [text];
    }

    if (urls.length === 0) {
      that.showToast('没有有效的链接');
      return;
    }

    // 检测微信小程序内部链接：一键导入不支持，提示用「相册抓取」
    var mpHit = urls.filter(function (u) {
      return u.indexOf('#小程序://') >= 0 || u.indexOf('weixin.qq.com') >= 0;
    });
    if (mpHit.length > 0) {
      that.showToast('小程序链接无法自动抓取，请用「相册抓取」');
      return;
    }

    var app = getApp();
    var token = wx.getStorageSync('token') || '';

    that.setData({ isProcessing: true, results: [], toastText: '正在导入 ' + urls.length + ' 个商品...' });

    // 调用 Vercel API（走 products/create?action=import）
    wx.request({
      url: 'https://colour-choice.art/api/admin/products/create?action=import',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : '',
      },
      data: { urls: urls },
      success: function (res) {
        that.setData({ isProcessing: false });
        var result = res.data || {};
        var results = result.results || [];
        that.setData({ results: results });
        var okCount = result.success != null ? result.success : results.filter(function(r){return r.status==='success'}).length;
        var skipCount = result.skipped != null ? result.skipped : results.filter(function(r){return r.status==='skipped'}).length;
        var errCount = results.filter(function(r){return r.status==='error'}).length;
        var msg = '成功 ' + okCount + ' 个';
        if (skipCount > 0) msg += '，跳过 ' + skipCount + ' 个（动态站点）';
        if (errCount > 0) msg += '，失败 ' + errCount + ' 个';
        that.showToast(msg);
      },
      fail: function (err) {
        that.setData({ isProcessing: false });
        that.showToast('网络错误，请稍后重试');
        console.error('[import]', err);
      }
    });
  },

  // 显示提示
  showToast: function (msg) {
    var that = this;
    that.setData({ toastText: msg, toastType: 'error' });
    setTimeout(function () { that.setData({ toastText: '' }); }, 3000);
  },

  // 复制链接
  copyUrl: function (e) {
    var url = e.currentTarget.dataset.url;
    wx.setClipboardData({ data: url });
  },

  // 预览商品
  previewGoods: function (e) {
    var id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({ url: '/pages/shop/detail?id=' + id });
    }
  },

  // 查看全部结果
  viewAll: function () {
    // 可以把 results 存到全局，然后跳转到结果页
    this.showToast('请到「商品管理」查看');
  },
});

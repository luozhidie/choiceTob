Page({
  data: {
    images: [],
    content: '',
    uploading: false
  },
  onContent: function (e) {
    var v = e.detail.value;
    if (v.length > 1000) v = v.slice(0, 1000);
    this.setData({ content: v });
  },
  chooseImg: function () {
    var t = this;
    var remain = 9 - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({ title: '最多 9 张', icon: 'none' });
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        t.setData({ uploading: true });
        var paths = res.tempFilePaths;
        var done = 0;
        var urls = t.data.images.slice();
        paths.forEach(function (p) {
          wx.uploadFile({
            url: 'https://colour-choice.art/api/upload',
            filePath: p,
            name: 'file',
            success: function (r) {
              try {
                var d = JSON.parse(r.data);
                if (d.url) urls.push(d.url);
              } catch (e) {}
            },
            complete: function () {
              done += 1;
              if (done === paths.length) {
                t.setData({ uploading: false, images: urls });
              }
            }
          });
        });
      }
    });
  },
  delImg: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var images = this.data.images.slice();
    images.splice(idx, 1);
    this.setData({ images: images });
  },
  submit: function () {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请填写穿搭需求', icon: 'none' });
      return;
    }
    var list = wx.getStorageSync('styling_requests') || [];
    list.unshift({
      id: Date.now(),
      images: this.data.images,
      content: this.data.content.trim(),
      date: '刚刚',
      status: '待处理'
    });
    wx.setStorageSync('styling_requests', list);
    wx.showToast({ title: '已提交', icon: 'success' });
    setTimeout(function () { wx.navigateBack(); }, 600);
  }
});

Page({
  data: {
    scenes: ['职场', '休闲', '社交', '旅游'],
    form: { name: '', scene: '职场', images: [] },
    uploading: false
  },
  onName: function (e) {
    this.setF('name', e.detail.value);
  },
  setScene: function (e) {
    this.setF('scene', e.currentTarget.dataset.scene);
  },
  setF: function (k, v) {
    var f = this.data.form;
    f[k] = v;
    this.setData({ form: f });
  },
  chooseImg: function () {
    var t = this;
    var remain = 9 - this.data.form.images.length;
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
        var urls = t.data.form.images.slice();
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
                t.setData({ uploading: false, form: Object.assign({}, t.data.form, { images: urls }) });
              }
            }
          });
        });
      }
    });
  },
  delImg: function (e) {
    var idx = e.currentTarget.dataset.idx;
    var images = this.data.form.images.slice();
    images.splice(idx, 1);
    this.setF('images', images);
  },
  save: function () {
    var f = this.data.form;
    if (!f.name.trim()) {
      wx.showToast({ title: '请输入搭配名称', icon: 'none' });
      return;
    }
    if (f.images.length === 0) {
      wx.showToast({ title: '请至少添加一张照片', icon: 'none' });
      return;
    }
    var outfits = wx.getStorageSync('outfits_list') || [];
    outfits.unshift({
      id: Date.now(),
      name: f.name.trim(),
      scene: f.scene,
      images: f.images,
      cover: f.images[0],
      date: '刚刚'
    });
    wx.setStorageSync('outfits_list', outfits);
    wx.showToast({ title: '已保存', icon: 'success' });
    setTimeout(function () { wx.navigateBack(); }, 600);
  }
});

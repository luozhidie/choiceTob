var app = getApp();
var STORAGE_KEY = 'album_grabbed';

// 与 app.js 图片代理一致：把 Supabase 域名改写为本站已白名单域名，供 <image> 直接展示
function toViewUrl(u) {
  if (typeof u !== 'string') return u;
  return u.replace(/^https?:\/\/fxeknwkmytzedkhplozn\.supabase\.co\//i, 'https://colour-choice.art/simg/');
}

Page({
  data: {
    images: [],     // {url, viewUrl, ts}
    uploading: false,
    tip: ''
  },

  onShow: function () {
    this.loadLocal();
  },

  loadLocal: function () {
    var list = wx.getStorageSync(STORAGE_KEY) || [];
    this.setData({ images: list });
  },

  saveLocal: function () {
    wx.setStorageSync(STORAGE_KEY, this.data.images);
  },

  chooseImages: function () {
    var t = this;
    if (t.data.uploading) return;
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (r) {
        var paths = r.tempFiles.map(function (f) { return f.tempFilePath; });
        t.uploadMany(paths);
      },
      fail: function () {}
    });
  },

  uploadMany: function (paths) {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    var queue = paths.slice();
    var idx = 0;
    var okCount = 0;
    var errMsg = '';
    t.setData({ uploading: true, tip: '准备上传 0/' + queue.length });

    function uploadOne(path, done) {
      var step = function (p) {
        wx.getFileSystemManager().readFile({
          filePath: p,
          encoding: 'base64',
          success: function (res) {
            var b64 = 'data:image/jpeg;base64,' + res.data;
            wx.request({
              url: 'https://colour-choice.art/api/mini/upload-product-image',
              method: 'POST',
              header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
              data: { image: b64 },
              success: function (rr) {
                if (rr.statusCode === 200 && rr.data && rr.data.success && rr.data.url) {
                  var item = { url: rr.data.url, viewUrl: toViewUrl(rr.data.url), ts: Date.now() };
                  var imgs = t.data.images.concat([item]);
                  t.setData({ images: imgs });
                  t.saveLocal();
                  okCount++;
                } else {
                  errMsg = (rr.data && rr.data.error) || ('HTTP' + rr.statusCode);
                }
                done();
              },
              fail: function () { errMsg = '网络错误'; done(); }
            });
          },
          fail: function () { errMsg = '读取图片失败'; done(); }
        });
      };
      if (wx.compressImage) {
        wx.compressImage({ src: path, quality: 80, success: function (c) { step(c.tempFilePath); }, fail: function () { step(path); } });
      } else {
        step(path);
      }
    }

    function next() {
      t.setData({ tip: '上传中 ' + idx + '/' + queue.length });
      if (idx >= queue.length) {
        t.setData({ uploading: false, tip: okCount + ' 张上传成功' + (errMsg ? '，部分失败：' + errMsg : '') });
        return;
      }
      var p = queue[idx++];
      uploadOne(p, next);
    }
    next();
  },

  copyUrl: function (e) {
    var url = e.currentTarget.dataset.url;
    wx.setClipboardData({ data: url, success: function () { wx.showToast({ title: '链接已复制', icon: 'none' }); } });
  },

  copyAll: function () {
    var urls = this.data.images.map(function (i) { return i.url; });
    if (urls.length === 0) { wx.showToast({ title: '暂无图片', icon: 'none' }); return; }
    wx.setClipboardData({ data: urls.join('\n'), success: function () { wx.showToast({ title: '已复制全部链接', icon: 'none' }); } });
  },

  deleteOne: function (e) {
    var ts = e.currentTarget.dataset.ts;
    var imgs = this.data.images.filter(function (i) { return i.ts !== ts; });
    this.setData({ images: imgs });
    this.saveLocal();
  },

  clearAll: function () {
    var t = this;
    if (t.data.images.length === 0) return;
    wx.showModal({
      title: '清空',
      content: '确定清空已采集列表？（仅清除本地记录，已上传到图库的图片仍在）',
      success: function (r) {
        if (r.confirm) { t.setData({ images: [] }); t.saveLocal(); wx.showToast({ title: '已清空', icon: 'none' }); }
      }
    });
  },

  goTool: function () {
    wx.setClipboardData({
      data: 'https://colour-choice.art/admin/image-grabber',
      success: function () { wx.showToast({ title: '网页采集地址已复制', icon: 'none' }); }
    });
  }
});

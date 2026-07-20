var app = getApp();

Page({
  data: {
    images: [],          // 已选本地图（tempFilePath）
    uploadedUrls: [],    // 已上传到 Storage 的公开 URL
    note: '',            // 供应商报价文字
    extracting: false,
    product: null,       // AI 抽取结果（可编辑）
    saving: false,
    toastText: '',
    toastType: '',
    categoryOptions: ['上装', '下装', '连衣裙', '外套', '鞋靴', '箱包', '配饰', '珠宝首饰', '其他'],
    seasonOptions: ['春', '夏', '秋', '冬', '四季']
  },

  /* 选图（转发/相册里的供应商图） */
  chooseImages: function () {
    var t = this;
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (r) {
        var paths = r.tempFiles.map(function (f) { return f.tempFilePath; });
        t.setData({ images: t.data.images.concat(paths).slice(0, 9) });
      }
    });
  },

  removeImage: function (e) {
    var i = e.currentTarget.dataset.i;
    var images = this.data.images.slice();
    images.splice(i, 1);
    this.setData({ images: images });
  },

  onNote: function (e) { this.setData({ note: e.detail.value }); },

  /* 上传所有本地图到 Storage */
  uploadAll: function (cb) {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    var urls = [];
    var queue = t.data.images.slice();
    if (queue.length === 0) { cb([]); return; }
    var idx = 0;
    var lastErr = '';

    function uploadOne(path, done) {
      wx.uploadFile({
        url: 'https://colour-choice.art/api/upload',
        filePath: path,
        name: 'file',
        header: token ? { 'Authorization': 'Bearer ' + token } : {},
        success: function (res) {
          var err = '';
          if (res.statusCode !== 200) {
            err = 'HTTP' + res.statusCode + ': ' + (res.data || '').slice(0, 60);
          } else {
            try {
              var j = JSON.parse(res.data);
              if (j && j.success && j.url) { urls.push(j.url); }
              else if (j && j.error) { err = j.error; }
              else { err = '上传返回异常'; }
            } catch (e) { err = '解析失败'; }
          }
          if (err) { lastErr = err; }
          done();
        },
        fail: function (res) {
          lastErr = 'uploadFile失败: ' + (res && res.errMsg || '未知');
          done();
        }
      });
    }

    // 小程序临时图可能为 HEIC 或无扩展名，先压缩成 JPEG 再上传，提高成功率
    function compressThenUpload(path, done) {
      if (!wx.compressImage) { uploadOne(path, done); return; }
      wx.compressImage({
        src: path,
        quality: 80,
        success: function (res) { uploadOne(res.tempFilePath, done); },
        fail: function () { uploadOne(path, done); }
      });
    }

    function next() {
      if (idx >= queue.length) { cb(urls, lastErr); return; }
      var p = queue[idx++];
      compressThenUpload(p, next);
    }

    next();
  },

  /* AI 识别 */
  extract: function () {
    var t = this;
    if (t.data.images.length === 0 && !t.data.note) {
      t.showToast('请先选图或填写供应商文字');
      return;
    }
    t.setData({ extracting: true });
    t.uploadAll(function (urls, lastErr) {
      if (urls.length === 0 && t.data.images.length > 0) {
        t.setData({ extracting: false });
        t.showToast(lastErr || '图片上传失败，请重试');
        return;
      }
      var token = wx.getStorageSync('token') || '';
      wx.request({
        url: 'https://colour-choice.art/api/ai/extract-product',
        method: 'POST',
        header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
        data: { images: urls, note: t.data.note },
        success: function (res) {
          t.setData({ extracting: false });
          var p = res.data && res.data.product;
          if (p) {
            // 默认草稿就在当前，用户可改
            t.setData({ product: p, uploadedUrls: urls });
            if (res.data.source === 'mock') t.showToast('AI 未配置，已生成空草稿');
            else t.showToast('识别完成，请核对');
          } else {
            t.showToast((res.data && res.data.error) || '识别失败');
          }
        },
        fail: function () {
          t.setData({ extracting: false });
          t.showToast('网络错误');
        }
      });
    });
  },

  /* 表单编辑 */
  onField: function (e) {
    var field = e.currentTarget.dataset.field;
    var product = Object.assign({}, this.data.product);
    product[field] = e.detail.value;
    this.setData({ product: product });
  },
  onCategory: function (e) { var p = Object.assign({}, this.data.product); p.category = this.data.categoryOptions[e.detail.value]; this.setData({ product: p }); },
  onSeason: function (e) { var p = Object.assign({}, this.data.product); p.season = this.data.seasonOptions[e.detail.value]; this.setData({ product: p }); },

  /* 保存：草稿 / 直接上架 */
  save: function (e) {
    var t = this;
    var publish = e.currentTarget.dataset.publish === '1';
    var p = t.data.product;
    if (!p) { t.showToast('请先 AI 识别'); return; }
    if (!p.title) { t.showToast('请填写标题'); return; }
    var priceY = parseFloat(p.price) || 0;
    var wsY = parseFloat(p.wholesale_price) || 0;
    var payload = {
      title: p.title,
      category: p.category || '待分类',
      price: Math.round(priceY * 100),
      wholesale_price: wsY ? Math.round(wsY * 100) : null,
      original_price: Math.round(priceY * 100),
      sizes: p.sizes || '',
      color: p.color || '',
      material: p.material || '',
      season: p.season || '四季',
      description: p.description || '',
      cover_image: (t.data.uploadedUrls[0]) || (p.images && p.images[0]) || null,
      images: t.data.uploadedUrls.length ? t.data.uploadedUrls : (p.images || []),
      is_published: publish,
      stock: 0,
      tags: Array.isArray(p.tags) ? p.tags : []
    };
    t.setData({ saving: true });
    var token = wx.getStorageSync('token') || '';
    wx.request({
      url: 'https://colour-choice.art/api/admin/products/create',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
      data: payload,
      success: function (res) {
        t.setData({ saving: false });
        if (res.data && res.data.success) {
          t.showToast(publish ? '已上架' : '已存草稿');
          setTimeout(function () { wx.navigateBack(); }, 1200);
        } else {
          t.showToast((res.data && res.data.error) || '保存失败');
        }
      },
      fail: function () {
        t.setData({ saving: false });
        t.showToast('网络错误');
      }
    });
  },

  showToast: function (msg) {
    var t = this;
    t.setData({ toastText: msg, toastType: 'error' });
    setTimeout(function () { t.setData({ toastText: '' }); }, 2500);
  },

  previewImg: function (e) {
    wx.previewImage({ current: e.currentTarget.dataset.src, urls: this.data.images });
  }
});

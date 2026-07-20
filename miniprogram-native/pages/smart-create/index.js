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
    seasonOptions: ['春', '夏', '秋', '冬', '四季'],
    categoryCustomMode: false,
    seasonCustomMode: false,
    // 套装拆分价：部件名 + 零售价/批发价/批量价/成本价(元)，保存时换算成分并入 params.set_items
    setItems: [],
    setSumR: 0,
    setSumW: 0,
    setSumB: 0,
    setSumC: 0
  },

  /* 套装拆分价 */
  recalcSet: function () {
    var sumR = 0, sumW = 0, sumB = 0, sumC = 0;
    this.data.setItems.forEach(function (s) {
      sumR += parseFloat(s.retail) || 0;
      sumW += parseFloat(s.wholesale) || 0;
      sumB += parseFloat(s.bulk) || 0;
      sumC += parseFloat(s.cost) || 0;
    });
    this.setData({ setSumR: sumR, setSumW: sumW, setSumB: sumB, setSumC: sumC });
  },
  addSetItem: function () {
    var items = this.data.setItems.concat([{ name: '', retail: '', wholesale: '', bulk: '', cost: '' }]);
    this.setData({ setItems: items });
    this.recalcSet();
  },
  removeSetItem: function (e) {
    var i = e.currentTarget.dataset.i;
    var items = this.data.setItems.slice();
    items.splice(i, 1);
    this.setData({ setItems: items });
    this.recalcSet();
  },
  onSetItem: function (e) {
    var i = e.currentTarget.dataset.i;
    var f = e.currentTarget.dataset.f;
    var items = this.data.setItems.map(function(s){ return Object.assign({}, s); });
    if (!items[i]) items[i] = { name: '', retail: '', wholesale: '', bulk: '', cost: '' };
    items[i][f] = e.detail.value;
    if (f === 'cost') {
      var costY = parseFloat(e.detail.value) || 0;
      if (costY > 0) {
        var retail = Math.round(costY / 0.26 * 1.10);
        var wholesale = Math.round(retail * 0.33);
        var bulk = Math.round(retail * 0.28);
        if (!items[i].retail) items[i].retail = String(retail);
        if (!items[i].wholesale) items[i].wholesale = String(wholesale);
        if (!items[i].bulk) items[i].bulk = String(bulk);
      }
    }
    this.setData({ setItems: items });
    this.recalcSet();
  },
  applySetTotal: function () {
    var p = Object.assign({}, this.data.product);
    if (this.data.setSumR) p.price = String(this.data.setSumR);
    if (this.data.setSumW) p.wholesale_price = String(this.data.setSumW);
    if (this.data.setSumB) p.bulk_price = String(this.data.setSumB);
    if (this.data.setSumC) p.cost_price = String(this.data.setSumC);
    this.setData({ product: p });
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

  /* 上传所有本地图到 Storage（使用 base64 + wx.request 绕过 uploadFile 域名白名单限制） */
  uploadAll: function (cb) {
    var t = this;
    var token = wx.getStorageSync('token') || '';
    var urls = [];
    var queue = t.data.images.slice();
    if (queue.length === 0) { cb([]); return; }
    var idx = 0;
    var lastErr = '';

    function readAndUpload(path, done) {
      wx.getFileSystemManager().readFile({
        filePath: path,
        encoding: 'base64',
        success: function (res) {
          var b64 = 'data:image/jpeg;base64,' + res.data;
          wx.request({
            url: 'https://colour-choice.art/api/upload-base64',
            method: 'POST',
            header: { 'Content-Type': 'application/json', 'Authorization': token ? 'Bearer ' + token : '' },
            data: { image: b64 },
            success: function (r) {
              if (r.statusCode === 200 && r.data && r.data.success && r.data.url) {
                urls.push(r.data.url);
              } else {
                lastErr = (r.data && r.data.error) || ('HTTP' + r.statusCode);
              }
              done();
            },
            fail: function (res) {
              lastErr = 'request失败: ' + (res && res.errMsg || '未知');
              done();
            }
          });
        },
        fail: function () {
          lastErr = '读取文件失败';
          done();
        }
      });
    }

    function uploadOne(path, done) {
      // 先压缩，避免 base64 过大
      if (wx.compressImage) {
        wx.compressImage({
          src: path,
          quality: 80,
          success: function (res) { readAndUpload(res.tempFilePath, done); },
          fail: function () { readAndUpload(path, done); }
        });
      } else {
        readAndUpload(path, done);
      }
    }

    function next() {
      if (idx >= queue.length) { cb(urls, lastErr); return; }
      var p = queue[idx++];
      uploadOne(p, next);
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
            t.setData({ product: p, uploadedUrls: urls, setItems: [], setSumR: 0, setSumW: 0, setSumB: 0, setSumC: 0 });
            if (res.data.source === 'mock') t.showToast('AI 识别超时，已按备注生成草稿');
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
  onCategory: function (e) { var p = Object.assign({}, this.data.product); p.category = this.data.categoryOptions[e.detail.value]; this.setData({ product: p, categoryCustomMode: false }); },
  onSeason: function (e) { var p = Object.assign({}, this.data.product); p.season = this.data.seasonOptions[e.detail.value]; this.setData({ product: p, seasonCustomMode: false }); },
  toggleCategoryCustom: function () { this.setData({ categoryCustomMode: !this.data.categoryCustomMode }); },
  onCategoryCustomInput: function (e) { var p = Object.assign({}, this.data.product); p.category = e.detail.value; this.setData({ product: p }); },
  toggleSeasonCustom: function () { this.setData({ seasonCustomMode: !this.data.seasonCustomMode }); },
  onSeasonCustomInput: function (e) { var p = Object.assign({}, this.data.product); p.season = e.detail.value; this.setData({ product: p }); },
  /* 成本价输入自动换算价格体系 */
  onCostPrice: function (e) {
    var costY = parseFloat(e.detail.value) || 0;
    var p = Object.assign({}, this.data.product);
    p.cost_price = e.detail.value;
    if (costY > 0) {
      var retail = Math.round(costY / 0.26 * 1.10);
      var wholesale = Math.round(retail * 0.33);
      var bulk = Math.round(retail * 0.28);
      p.price = String(retail);
      p.wholesale_price = String(wholesale);
      p.bulk_price = String(bulk);
    }
    this.setData({ product: p });
  },

  /* 保存：草稿 / 直接上架 */
  save: function (e) {
    var t = this;
    var publish = e.currentTarget.dataset.publish === '1';
    var p = t.data.product;
    if (!p) { t.showToast('请先 AI 识别'); return; }
    if (!p.title) { t.showToast('请填写标题'); return; }
    var priceY = parseFloat(p.price) || 0;
    var wsY = parseFloat(p.wholesale_price) || 0;
    var costY = parseFloat(p.cost_price) || 0;
    var bkY = parseFloat(p.bulk_price) || 0;
    var payload = {
      title: p.title,
      category: p.category || '待分类',
      price: Math.round(priceY * 100),
      wholesale_price: wsY ? Math.round(wsY * 100) : null,
      bulk_price: bkY ? Math.round(bkY * 100) : null,
      cost_price: costY ? Math.round(costY * 100) : null,
      original_price: Math.round(priceY * 100),
      sizes: p.sizes || '',
      color: p.color || '',
      material: p.material || '',
      description: p.description || '',
      cover_image: (t.data.uploadedUrls[0]) || (p.images && p.images[0]) || null,
      images: t.data.uploadedUrls.length ? t.data.uploadedUrls : (p.images || []),
      is_published: publish,
      stock: 0,
      tags: Array.isArray(p.tags) ? p.tags : []
    };
    // 季节、套装拆分价等存入 params JSONB（products 表没有 season 列，不能作为顶层字段）
    var paramsObj = {};
    if (p.season) paramsObj.season = p.season;
    // 套装拆分价：换算成分(cent)
    var setArr = t.data.setItems
      .filter(function (s) { return s.name || s.retail || s.wholesale || s.bulk || s.cost; })
      .map(function (s) {
        return {
          name: s.name || '',
          retail: s.retail ? Math.round(parseFloat(s.retail) * 100) : 0,
          wholesale: s.wholesale ? Math.round(parseFloat(s.wholesale) * 100) : 0,
          bulk: s.bulk ? Math.round(parseFloat(s.bulk) * 100) : 0,
          cost: s.cost ? Math.round(parseFloat(s.cost) * 100) : 0
        };
      });
    if (setArr.length) paramsObj.set_items = setArr;
    if (Object.keys(paramsObj).length) payload.params = paramsObj;
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
